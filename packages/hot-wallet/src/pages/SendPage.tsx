import { useState, useEffect } from 'react';
import { Button, Input, Form, Toast, Steps, Skeleton } from 'antd-mobile';
import { ScanningOutline, TextOutline } from 'antd-mobile-icons';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout, StandardCard, QRCodeDisplay } from '@offline-wallet/shared/components';
import { CHAIN_DISPLAY_NAMES, isEVMChain, type ChainType } from '@offline-wallet/shared/config';
import { QRCodeProtocol, QRCodeType } from '@offline-wallet/shared/types';
import { readFromClipboard } from '@offline-wallet/shared/utils';
import { useI18n } from '../hooks/useI18n';
import useAddressStore from '../stores/useAddressStore';
import useScanStore, { ScanType } from '../stores/useScanStore';
import { useBalance } from '../hooks/useBalance';
import { formatBalance } from '../utils/format';
import { invoke } from '@tauri-apps/api/core';

const { Step } = Steps;

interface TxParams {
  nonce?: string;
  gasPrice?: string;
  gasLimit?: string;
}

function SendPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useI18n();
  const { getAddressById } = useAddressStore();
  const address = id ? getAddressById(id) : null;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [unsignedTxQR, setUnsignedTxQR] = useState<string | null>(null);
  const [txInfo, setTxInfo] = useState<{
    to: string;
    amount: string;
    fee?: string;
    gasPrice?: string;
    gasLimit?: string;
    nonce?: string;
  } | null>(null);

  // 交易参数（nonce, gasPrice 等）
  const [txParams, setTxParams] = useState<TxParams | null>(null);
  const [paramsLoading, setParamsLoading] = useState(false);

  const { balance } = useBalance(address?.chain || 'eth', address?.address || '');
  const chain = address?.chain as ChainType;
  const isEVM = chain ? isEVMChain(chain) : false;

  // 扫描 Store
  const { scanResult, scanSuccess, scanType, setScanConfig, clearScanState } = useScanStore();

  useEffect(() => {
    if (!address) {
      navigate('/');
    }
  }, [address, navigate]);

  // 处理扫描结果（地址）
  useEffect(() => {
    if (scanSuccess && scanResult && scanType === ScanType.ADDRESS && address) {
      handleScanResult(scanResult);
      clearScanState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanSuccess, scanResult, scanType]);

  // 处理扫描结果
  const handleScanResult = async (qrData: string) => {
    try {
      // 尝试解析为地址二维码
      try {
        const parsed = QRCodeProtocol.decode(qrData);
        if (parsed.type === QRCodeType.ADDRESS) {
          // 验证链匹配
          if (parsed.chain === address!.chain) {
            form.setFieldValue('toAddress', parsed.address);
            Toast.show({ content: t.common.success, icon: 'success' });
          } else {
            Toast.show({ content: t.send.chainMismatch || '链类型不匹配', icon: 'fail' });
          }
          return;
        }
      } catch {
        // 不是标准协议格式，尝试直接作为地址使用
      }

      // 直接作为地址使用
      const trimmedText = qrData.trim();
      const isValid = await invoke<boolean>('validate_address', {
        chain: address!.chain,
        address: trimmedText,
      });

      if (isValid) {
        form.setFieldValue('toAddress', trimmedText);
        Toast.show({ content: t.common.success, icon: 'success' });
      } else {
        Toast.show({ content: t.send.invalidAddress, icon: 'fail' });
      }
    } catch (error) {
      console.error('处理扫描结果失败:', error);
    }
  };

  // 获取交易参数（EVM 链需要 nonce 和 gasPrice）
  useEffect(() => {
    if (!address || !isEVM) return;

    const fetchTxParams = async () => {
      setParamsLoading(true);
      try {
        const result = await invoke<string>('get_tx_params', {
          chain: address.chain,
          address: address.address,
        });
        const params = JSON.parse(result) as TxParams;
        setTxParams(params);

        // 设置默认值到表单
        form.setFieldsValue({
          gasPrice: params.gasPrice,
          gasLimit: params.gasLimit || '21000',
          nonce: params.nonce,
        });
      } catch (error) {
        console.error('获取交易参数失败:', error);
        // 使用默认值
        setTxParams({ gasPrice: '20', gasLimit: '21000', nonce: '0' });
        form.setFieldsValue({ gasPrice: '20', gasLimit: '21000', nonce: '0' });
      } finally {
        setParamsLoading(false);
      }
    };

    fetchTxParams();
  }, [address, isEVM, form]);

  if (!address) return null;

  // 粘贴地址
  const handlePasteAddress = async () => {
    try {
      const clipboardText = await readFromClipboard();
      if (!clipboardText) {
        Toast.show({ content: t.send.clipboardEmpty || '剪贴板为空', icon: 'fail' });
        return;
      }

      const trimmedText = clipboardText.trim();
      // 验证地址格式
      const isValid = await invoke<boolean>('validate_address', {
        chain: address.chain,
        address: trimmedText,
      });

      if (isValid) {
        form.setFieldValue('toAddress', trimmedText);
        Toast.show({ content: t.common.success, icon: 'success' });
      } else {
        // 即使无效也填入，让用户知道
        form.setFieldValue('toAddress', trimmedText);
        Toast.show({ content: t.send.invalidAddress, icon: 'fail' });
      }
    } catch (error) {
      console.error('粘贴失败:', error);
      Toast.show({ content: `${t.common.failed}: ${error}`, icon: 'fail' });
    }
  };

  // 扫描地址二维码（跳转到扫描页面）
  const handleScanAddress = () => {
    setScanConfig({
      scanType: ScanType.ADDRESS,
      hint: t.send.scanAddressHint || '扫描接收地址二维码',
      returnPath: `/send/${id}`,
    });
    navigate('/scan-qr', { replace: true });
  };

  // 构建交易
  const handleBuildTransaction = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // 验证接收地址
      const isValidTo = await invoke<boolean>('validate_address', {
        chain: address.chain,
        address: values.toAddress,
      });

      if (!isValidTo) {
        Toast.show({ content: t.send.invalidAddress, icon: 'fail' });
        return;
      }

      // 验证金额
      const amount = parseFloat(values.amount);
      const currentBalance = parseFloat(balance || '0');
      if (isNaN(amount) || amount <= 0) {
        Toast.show({ content: t.send.invalidAmount, icon: 'fail' });
        return;
      }
      if (amount > currentBalance) {
        Toast.show({ content: t.send.insufficientBalance, icon: 'fail' });
        return;
      }

      // 根据链类型构建不同格式的交易数据
      let unsignedTx: Record<string, any>;
      let estimatedFee = '0';

      if (isEVM) {
        // EVM 链：需要 value（Wei）、gas_price、gas_limit、nonce
        const gasPrice = parseFloat(values.gasPrice || '20');
        const gasLimit = parseInt(values.gasLimit || '21000', 10);
        const nonce = parseInt(values.nonce || '0', 10);

        // 计算估算费用（ETH）
        estimatedFee = ((gasPrice * gasLimit) / 1e9).toFixed(6);

        unsignedTx = {
          from: address.address, // 发送地址
          to: values.toAddress,
          value: (amount * 1e18).toString(), // ETH 转 Wei
          gas_price: (gasPrice * 1e9).toString(), // Gwei 转 Wei
          gas_limit: gasLimit.toString(),
          nonce: nonce.toString(),
        };
      } else {
        // 非 EVM 链：包含 from + to + amount
        unsignedTx = {
          from: address.address, // 发送地址
          to: values.toAddress,
          amount: amount.toString(),
        };
      }

      // 生成二维码数据
      const qrData = QRCodeProtocol.encode({
        type: QRCodeType.UNSIGNED_TRANSACTION,
        chain: address.chain,
        unsignedTx: JSON.stringify(unsignedTx),
        description: `${t.send.sendTo} ${values.amount} ${CHAIN_DISPLAY_NAMES[address.chain]}`,
      } as any);

      setUnsignedTxQR(qrData);
      setTxInfo({
        to: values.toAddress,
        amount: values.amount,
        fee: estimatedFee,
        gasPrice: isEVM ? values.gasPrice : undefined,
        gasLimit: isEVM ? values.gasLimit : undefined,
        nonce: isEVM ? values.nonce : undefined,
      });
      setCurrentStep(1);

      Toast.show({ content: t.send.buildSuccess, icon: 'success' });
    } catch (error) {
      console.error('构建交易失败:', error);
      Toast.show({ content: `${t.send.buildFailed}: ${error}`, icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  // 进入扫描签名页面
  const handleNextStep = () => {
    navigate(`/scan-signed/${id}`, {
      state: { txInfo, chain: address.chain },
    });
  };

  // 刷新交易参数
  const handleRefreshParams = async () => {
    if (!isEVM) return;
    setParamsLoading(true);
    try {
      const result = await invoke<string>('get_tx_params', {
        chain: address.chain,
        address: address.address,
      });
      const params = JSON.parse(result) as TxParams;
      setTxParams(params);
      form.setFieldsValue({
        gasPrice: params.gasPrice,
        nonce: params.nonce,
      });
      Toast.show({ content: t.common.success, icon: 'success' });
    } catch (error) {
      Toast.show({ content: String(error), icon: 'fail' });
    } finally {
      setParamsLoading(false);
    }
  };

  return (
    <PageLayout title={t.send.title} onBack={() => navigate(-1)}>
      <StandardCard style={{ marginBottom: '16px' }}>
        <Steps current={currentStep} style={{ '--icon-size': '22px' }}>
          <Step title={t.send.buildTransaction} />
          <Step title={t.send.showQRCode} />
          <Step title={t.send.scanSigned} />
        </Steps>
      </StandardCard>

      {/* 步骤1: 构建交易表单 */}
      {currentStep === 0 && (
        <StandardCard style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{ fontSize: '13px', color: 'var(--app-subtitle-color)', marginBottom: '4px' }}
            >
              {t.send.from}
            </div>
            <div style={{ fontSize: '14px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {address.address}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--adm-color-primary)', marginTop: '4px' }}>
              {t.addressDetail.balance}: {formatBalance(balance)}{' '}
              {CHAIN_DISPLAY_NAMES[address.chain]}
            </div>
          </div>

          <Form form={form} layout="vertical">
            <Form.Item
              label={
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <span>{t.send.to}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      size="mini"
                      onClick={handlePasteAddress}
                      style={{ fontSize: '12px', padding: '2px 8px' }}
                    >
                      <TextOutline style={{ marginRight: '2px' }} />
                      {t.send.paste || '粘贴'}
                    </Button>
                    <Button
                      size="mini"
                      onClick={handleScanAddress}
                      style={{ fontSize: '12px', padding: '2px 8px' }}
                    >
                      <ScanningOutline style={{ marginRight: '2px' }} />
                      {t.send.scan || '扫描'}
                    </Button>
                  </div>
                </div>
              }
              name="toAddress"
              rules={[{ required: true, message: t.send.toRequired }]}
            >
              <Input placeholder={t.send.toPlaceholder} style={{ fontSize: '14px' }} />
            </Form.Item>

            <Form.Item
              label={`${t.send.amount} (${CHAIN_DISPLAY_NAMES[address.chain]})`}
              name="amount"
              rules={[{ required: true, message: t.send.amountRequired }]}
            >
              <Input
                type="number"
                placeholder={t.send.amountPlaceholder}
                style={{ fontSize: '14px' }}
              />
            </Form.Item>

            {/* EVM 链额外字段 */}
            {isEVM && (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--app-subtitle-color)' }}>
                    {t.send.gasParams || 'Gas 参数'}
                  </span>
                  <Button size="mini" onClick={handleRefreshParams} loading={paramsLoading}>
                    {t.send.refresh || '刷新'}
                  </Button>
                </div>

                {paramsLoading ? (
                  <Skeleton.Paragraph lineCount={3} animated />
                ) : (
                  <>
                    <Form.Item
                      label={`${t.send.gasPrice} (Gwei)`}
                      name="gasPrice"
                      rules={[
                        { required: true, message: t.send.gasPriceRequired || '请输入 Gas Price' },
                      ]}
                    >
                      <Input type="number" placeholder="20" style={{ fontSize: '14px' }} />
                    </Form.Item>

                    <Form.Item
                      label={t.send.gasLimit}
                      name="gasLimit"
                      rules={[
                        { required: true, message: t.send.gasLimitRequired || '请输入 Gas Limit' },
                      ]}
                    >
                      <Input type="number" placeholder="21000" style={{ fontSize: '14px' }} />
                    </Form.Item>

                    <Form.Item
                      label={t.send.nonce}
                      name="nonce"
                      rules={[{ required: true, message: t.send.nonceRequired || '请输入 Nonce' }]}
                    >
                      <Input type="number" placeholder="0" style={{ fontSize: '14px' }} />
                    </Form.Item>
                  </>
                )}
              </>
            )}

            <Form.Item label={t.send.memo} name="memo">
              <Input placeholder={t.send.memoPlaceholder} style={{ fontSize: '14px' }} />
            </Form.Item>
          </Form>

          <Button
            color="primary"
            block
            size="large"
            loading={loading}
            disabled={isEVM && paramsLoading}
            onClick={handleBuildTransaction}
            style={{ borderRadius: '12px', height: '50px', fontSize: '17px', marginTop: '8px' }}
          >
            {t.send.buildTransaction}
          </Button>
        </StandardCard>
      )}

      {/* 步骤2: 显示二维码 */}
      {currentStep === 1 && unsignedTxQR && txInfo && (
        <>
          <StandardCard style={{ marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--app-subtitle-color)',
                  marginBottom: '16px',
                }}
              >
                {t.send.scanWithColdWallet}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <QRCodeDisplay data={unsignedTxQR} size={240} />
              </div>
            </div>

            <div
              style={{
                background: 'var(--adm-color-fill-content)',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--app-subtitle-color)',
                  marginBottom: '12px',
                }}
              >
                {t.send.txSummary}
              </div>

              {/* 接收地址 */}
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--app-subtitle-color)',
                    marginBottom: '4px',
                  }}
                >
                  {t.send.to}
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    wordBreak: 'break-all',
                    background: 'var(--adm-color-box)',
                    padding: '8px',
                    borderRadius: '6px',
                  }}
                >
                  {txInfo.to}
                </div>
              </div>

              {/* 金额 */}
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <span style={{ color: 'var(--app-subtitle-color)' }}>{t.send.amount}</span>
                <span
                  style={{ fontWeight: 600, color: 'var(--adm-color-primary)', fontSize: '16px' }}
                >
                  {txInfo.amount} {CHAIN_DISPLAY_NAMES[address.chain]}
                </span>
              </div>

              {/* EVM 链显示 Gas 详情 */}
              {isEVM && (
                <>
                  <div
                    style={{
                      borderTop: '1px solid var(--adm-color-border)',
                      marginTop: '12px',
                      paddingTop: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--app-subtitle-color)',
                        marginBottom: '8px',
                      }}
                    >
                      Gas {t.send.gasParams || '参数'}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--app-subtitle-color)' }}>
                        Gas Price
                      </span>
                      <span style={{ fontSize: '13px' }}>{txInfo.gasPrice} Gwei</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--app-subtitle-color)' }}>
                        Gas Limit
                      </span>
                      <span style={{ fontSize: '13px' }}>{txInfo.gasLimit}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--app-subtitle-color)' }}>
                        Nonce
                      </span>
                      <span style={{ fontSize: '13px' }}>{txInfo.nonce}</span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--adm-color-border)',
                    }}
                  >
                    <span style={{ color: 'var(--app-subtitle-color)' }}>{t.send.fee}</span>
                    <span style={{ fontWeight: 500 }}>
                      ~{txInfo.fee} {CHAIN_DISPLAY_NAMES[address.chain]}
                    </span>
                  </div>
                </>
              )}
            </div>
          </StandardCard>

          <StandardCard>
            <Button
              color="primary"
              block
              size="large"
              onClick={handleNextStep}
              style={{ borderRadius: '12px', height: '50px', fontSize: '17px' }}
            >
              {t.send.nextStep}
            </Button>
            <Button
              block
              size="large"
              onClick={() => setCurrentStep(0)}
              style={{ borderRadius: '12px', height: '50px', fontSize: '17px', marginTop: '12px' }}
            >
              {t.common.back}
            </Button>
          </StandardCard>
        </>
      )}
    </PageLayout>
  );
}

export default SendPage;
