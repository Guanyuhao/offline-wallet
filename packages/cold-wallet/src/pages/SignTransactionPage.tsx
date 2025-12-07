import { useState, useEffect, useCallback } from 'react';
import { Button, Toast, Grid, Form, JumboTabs } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import useWalletStore from '../stores/useWalletStore';
import useScanStore, { ScanType } from '../stores/useScanStore';
import {
  QRCodeProtocol,
  QRCodeType,
  SignedTransactionQRCode,
  UnsignedTransactionQRCode,
} from '@shared/types/qrcode';
import PageLayout from '../components/PageLayout';
import { isEVMChain, type ChainType } from '../config/chainConfig';
import StandardCard from '../components/StandardCard';
import TransactionForm from '../components/TransactionForm';
import PrimaryButton from '../components/PrimaryButton';

type SignMode = 'scan' | 'manual';

/**
 * 根据链类型填充表单值（从扫描的二维码数据）
 */
function fillFormValuesFromTxData(txData: any, chain: ChainType): Record<string, any> {
  const formValues: Record<string, any> = {};

  if (txData.to) formValues.to = txData.to;

  if (txData.value) {
    if (isEVMChain(chain)) {
      // EVM 链：从 Wei 转换为 ETH
      const valueInWei = BigInt(txData.value);
      formValues.value = (Number(valueInWei) / 1e18).toString();
    } else {
      // 其他链：直接使用
      formValues.value = txData.value.toString();
    }
  }

  if (isEVMChain(chain)) {
    // EVM 链：gasPrice, gasLimit, nonce
    if (txData.gas_price) {
      const gasPriceInWei = BigInt(txData.gas_price);
      formValues.gasPrice = (Number(gasPriceInWei) / 1e9).toString();
    }
    if (txData.gas_limit) formValues.gasLimit = txData.gas_limit.toString();
    if (txData.nonce !== undefined) formValues.nonce = txData.nonce.toString();
  }

  return formValues;
}

/**
 * 构建交易数据（根据链类型）
 */
function buildTransactionData(
  values: { to: string; value: string; gasPrice?: string; gasLimit?: string; nonce?: string },
  chain: ChainType
): string {
  const { to, value, gasPrice, gasLimit, nonce } = values;
  const numValue = parseFloat(value);

  if (isEVMChain(chain)) {
    // EVM 链（ETH, BNB, TRON）使用 value 字段
    const numGasPrice = parseFloat(gasPrice || '0');
    const intGasLimit = parseInt(gasLimit || '0', 10);
    const intNonce = parseInt(nonce || '0', 10);

    return JSON.stringify({
      to,
      value: (numValue * 1e18).toString(), // ETH 转 Wei
      gas_price: (numGasPrice * 1e9).toString(), // Gwei 转 Wei
      gas_limit: intGasLimit.toString(),
      nonce: intNonce.toString(),
    });
  } else {
    // 非 EVM 链（BTC, SOL, KASPA）使用 amount 字段
    return JSON.stringify({
      to,
      amount: numValue.toString(),
    });
  }
}

/**
 * 验证表单字段值
 */
async function validateFormValues(
  values: any,
  chain: ChainType,
  form: any
): Promise<{ valid: boolean; error?: string }> {
  const { to, value, gasPrice, gasLimit, nonce } = values;

  // 1. 地址验证
  const trimmedTo = typeof to === 'string' ? to.trim() : '';
  if (!trimmedTo) {
    form.setFields([{ name: 'to', errors: ['收款地址不能为空'] }]);
    return { valid: false };
  }

  try {
    const result = await invoke<{ is_valid: boolean; error_message?: string }>(
      'validate_address_with_message',
      { chain, address: trimmedTo }
    );

    if (!result.is_valid) {
      form.setFields([{ name: 'to', errors: ['地址无效'] }]);
      return { valid: false };
    }
  } catch (error: any) {
    console.error('[地址验证失败]', error);
    form.setFields([{ name: 'to', errors: ['地址无效'] }]);
    return { valid: false };
  }

  // 2. 金额验证
  const numValue = parseFloat(value);
  if (isNaN(numValue) || numValue <= 0) {
    form.setFields([{ name: 'value', errors: ['金额必须是大于0的有效数字'] }]);
    return { valid: false };
  }

  // 3. EVM 链字段验证
  if (isEVMChain(chain)) {
    if (!gasPrice) {
      form.setFields([{ name: 'gasPrice', errors: ['请输入 Gas Price'] }]);
      return { valid: false };
    }
    const numGasPrice = parseFloat(gasPrice);
    if (isNaN(numGasPrice) || numGasPrice <= 0) {
      form.setFields([{ name: 'gasPrice', errors: ['Gas Price 必须是大于0的有效数字'] }]);
      return { valid: false };
    }

    if (!gasLimit) {
      form.setFields([{ name: 'gasLimit', errors: ['请输入 Gas Limit'] }]);
      return { valid: false };
    }
    const intGasLimit = parseInt(gasLimit, 10);
    if (isNaN(intGasLimit) || intGasLimit <= 0) {
      form.setFields([{ name: 'gasLimit', errors: ['Gas Limit 必须是大于0的有效整数'] }]);
      return { valid: false };
    }

    if (!nonce) {
      form.setFields([{ name: 'nonce', errors: ['请输入 Nonce'] }]);
      return { valid: false };
    }
    const intNonce = parseInt(String(nonce), 10);
    if (isNaN(intNonce) || intNonce < 0) {
      form.setFields([{ name: 'nonce', errors: ['Nonce 必须是非负整数'] }]);
      return { valid: false };
    }
  }

  return { valid: true };
}

function SignTransactionPage() {
  const navigate = useNavigate();
  const { mnemonic, currentChain, isUnlocked } = useWalletStore();
  const {
    scanResult,
    scanSuccess,
    scanType,
    returnMode,
    setScanConfig,
    clearScanState,
  } = useScanStore();
  const [form] = Form.useForm();
  const [mode, setMode] = useState<SignMode>(returnMode || 'scan');
  const [scannedData, setScannedData] = useState<Record<string, any> | null>(null);
  const [showScannedInfo, setShowScannedInfo] = useState(false);

  if (!isUnlocked || !mnemonic) {
    navigate('/unlock');
    return null;
  }

  // 处理扫描成功
  const handleScanSuccess = useCallback(async (scannedText: string) => {
    try {
      const scannedTextTrimmed = scannedText.trim();
      let qrData: UnsignedTransactionQRCode;

      try {
        const decoded = QRCodeProtocol.decode(scannedTextTrimmed);
        if (decoded.type !== QRCodeType.UNSIGNED_TRANSACTION) {
          Toast.show({ content: '二维码类型错误，请扫描未签名交易二维码', position: 'top' });
          return;
        }
        qrData = decoded as UnsignedTransactionQRCode;
      } catch (error: any) {
        console.error('[二维码解析失败]', error);
        Toast.show({
          content: '二维码格式无效，请检查是否为有效的未签名交易二维码',
          position: 'top',
        });
        return;
      }

      // 验证链类型是否匹配
      if (qrData.chain.toLowerCase() !== currentChain.toLowerCase()) {
        Toast.show({
          content: `链类型不匹配，二维码为 ${qrData.chain.toUpperCase()}，当前链为 ${currentChain.toUpperCase()}`,
          position: 'top',
        });
        return;
      }

      // 解析未签名交易数据
      let txData: any;
      try {
        txData = JSON.parse(qrData.unsignedTx);
      } catch (error: any) {
        console.error('[交易数据解析失败]', error);
        Toast.show({ content: '交易数据格式无效', position: 'top' });
        return;
      }

      // 填充表单
      const formValues = fillFormValuesFromTxData(txData, currentChain as ChainType);
      setScannedData(formValues);
      form.setFieldsValue(formValues);

      Toast.show({ content: '交易信息验证成功', position: 'top', icon: 'success' });
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString();
      if (
        errorMessage.includes('cancel') ||
        errorMessage.includes('取消') ||
        errorMessage.includes('User cancelled')
      ) {
        return;
      }
      if (
        errorMessage.includes('not supported') ||
        errorMessage.includes('不支持') ||
        errorMessage.includes('not available') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('Cannot find module') ||
        errorMessage.includes('Failed to resolve')
      ) {
        Toast.show({ content: '当前设备不支持扫描功能', position: 'top' });
        return;
      }
      Toast.show({ content: `扫描失败: ${errorMessage}`, position: 'top' });
    }
  }, [currentChain, form]);

  // 恢复 tab 模式（从 store 中恢复）
  useEffect(() => {
    if (returnMode && (returnMode === 'scan' || returnMode === 'manual')) {
      console.log('[SignTransactionPage] 恢复 tab 模式:', returnMode);
      setMode(returnMode);
    }
  }, [returnMode]);

  // 处理扫描结果（从 store 中读取）
  useEffect(() => {
    if (
      scanSuccess &&
      scanResult &&
      scanType === ScanType.UNSIGNED_TRANSACTION
    ) {
      console.log('[SignTransactionPage] 处理扫描结果');
      // 使用 requestAnimationFrame 确保 mode 先恢复，再处理结果
      requestAnimationFrame(() => {
        handleScanSuccess(scanResult);
        // 清除扫描状态，避免重复处理
        clearScanState();
      });
    }
  }, [scanSuccess, scanResult, scanType, handleScanSuccess, clearScanState]);

  // 扫码模式：跳转到扫描页面
  const handleScanUnsignedTransaction = () => {
    // 设置扫描配置到 store
    setScanConfig({
      scanType: ScanType.UNSIGNED_TRANSACTION,
      hint: '请将未签名交易二维码对准扫描框',
      returnPath: '/sign',
      returnMode: mode, // 记录当前的 tab 模式
    });
    // 跳转到扫描页面
    navigate('/scan-qr');
  };

  // 签名交易
  const handleSign = async () => {
    try {
      console.log('[签名开始] 当前链:', currentChain);
      console.log('[签名开始] form 对象:', form);
      console.log('[签名开始] 当前表单值:', form.getFieldsValue());

      // 表单验证 - 使用 getFieldsValue 直接获取值，然后手动验证
      // 因为 antd-mobile 的 validateFields 在某些情况下不会正确 resolve
      console.log('[开始表单验证] 使用 getFieldsValue 获取表单值');
      const values = form.getFieldsValue();
      console.log('[获取表单值] values:', values);

      // 手动触发验证，但不等待结果（因为验证器已经执行过了）
      // 如果验证失败，验证器会设置错误状态，我们通过检查错误来判断
      try {
        // 尝试调用 validateFields，但不等待它完成
        // 如果验证失败，会在 catch 中处理
        form.validateFields().catch(() => {
          // 忽略验证错误，因为我们会在下面手动检查
        });

        // 等待一小段时间，让验证器执行完成
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 检查是否有验证错误
        const errors = form.getFieldsError();
        const hasErrors = errors.some((error: any) => error.errors && error.errors.length > 0);

        if (hasErrors) {
          console.error('[表单验证失败] 发现错误:', errors);
          const firstError = errors.find((error: any) => error.errors && error.errors.length > 0);
          if (firstError?.errors?.[0]) {
            Toast.show({
              content: firstError.errors[0],
              position: 'top',
            });
          }
          return;
        }

        console.log('[表单验证通过] values:', values);
      } catch (validationError: any) {
        console.error('[表单验证失败] 错误类型:', typeof validationError);
        console.error('[表单验证失败] 错误对象:', validationError);
        console.error('[表单验证失败] errorFields:', validationError?.errorFields);
        console.error(
          '[表单验证失败] 错误字符串:',
          JSON.stringify(validationError, Object.getOwnPropertyNames(validationError), 2)
        );

        // 尝试多种方式获取错误信息
        let errorMessage = '表单验证失败，请检查输入';

        if (validationError?.errorFields && Array.isArray(validationError.errorFields)) {
          const firstErrorField = validationError.errorFields[0];
          if (
            firstErrorField?.errors &&
            Array.isArray(firstErrorField.errors) &&
            firstErrorField.errors.length > 0
          ) {
            errorMessage = firstErrorField.errors[0];
          }
        } else if (validationError?.message) {
          errorMessage = validationError.message;
        } else if (typeof validationError === 'string') {
          errorMessage = validationError;
        }

        console.log('[表单验证失败] 显示错误:', errorMessage);
        Toast.show({
          content: errorMessage,
          position: 'top',
        });
        return;
      }

      // 业务逻辑验证
      const validation = await validateFormValues(values, currentChain as ChainType, form);
      if (!validation.valid) {
        console.log('[业务验证失败]', validation.error);
        // 验证失败时，validateFormValues 已经设置了表单错误，这里不需要额外提示
        return;
      }
      console.log('[业务验证通过]');

      // 构建交易数据
      const txData = buildTransactionData(values, currentChain as ChainType);
      console.log('[构建交易数据完成] txData length:', txData.length);

      // 签名交易
      console.log('[调用签名接口] chain:', currentChain);
      const signed = await invoke<string>('sign_transaction', {
        chain: currentChain,
        mnemonic,
        txData,
      });

      console.log('[签名接口返回] signed length:', signed?.length);

      if (!signed) {
        throw new Error('签名返回为空');
      }

      console.log('[设置签名结果] signedTx:', signed.substring(0, 100));

      // 生成二维码数据
      let qrCodeData = '';
      try {
        const tx = JSON.parse(signed);
        const data: SignedTransactionQRCode = {
          type: QRCodeType.SIGNED_TRANSACTION,
          version: '1.0.0',
          timestamp: Date.now(),
          chain: currentChain,
          signedTx: signed,
          txHash: tx.transaction_hash || tx.txHash || '',
        };
        qrCodeData = QRCodeProtocol.encode(data);
      } catch (error) {
        console.error('[二维码生成失败]', error);
      }

      // 导航到签名成功页面
      navigate('/sign-success', {
        state: {
          signedTx: signed,
          qrCodeData,
          currentChain,
        },
      });
    } catch (error: any) {
      // 只有真正的业务错误才会到这里（如签名失败）
      console.error('[签名交易错误]', error);
      console.error('[错误详情]', {
        message: error?.message,
        stack: error?.stack,
        error,
      });

      // 显示错误提示
      const errorMessage = error?.message || error?.toString() || '未知错误';
      Toast.show({
        content: `签名失败: ${errorMessage}`,
        position: 'top',
      });
    }
  };

  const handleTabChange = (key: string) => {
    setMode(key as SignMode);
    setScannedData(null);
    setShowScannedInfo(false);
    form.resetFields();
  };

  const handleEdit = () => {
    setMode('manual');
    form.setFieldsValue(scannedData);
  };

  return (
    <PageLayout title="签名交易" onBack={() => navigate('/wallet')}>
      <StandardCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#1d1d1f' }}>
              签名交易
            </h2>
            <p style={{ marginTop: '8px', color: '#86868b', fontSize: '15px' }}>
              当前链: <strong style={{ color: '#1677ff' }}>{currentChain.toUpperCase()}</strong>
            </p>
          </div>

          <JumboTabs activeKey={mode} onChange={handleTabChange}>
            <JumboTabs.Tab title="扫描二维码" description="扫码观察端的二维码" key="scan">
              <div style={{ marginTop: '16px' }}>
                {!scannedData ? (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#f0f7ff',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#1677ff',
                        marginBottom: '12px',
                      }}
                    >
                      请扫描热钱包生成的未签名交易二维码
                    </p>
                    <Button color="primary" onClick={handleScanUnsignedTransaction}>
                      扫描二维码
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: '16px',
                          color: '#1677ff',
                          fontWeight: 600,
                          marginBottom: '4px',
                        }}
                      >
                        ✓ 交易信息验证成功
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#86868b' }}>
                        请查看交易信息并确认签名
                      </p>
                    </div>

                    <Grid columns={2} gap={8}>
                      <Grid.Item>
                        <Button
                          color="default"
                          block
                          onClick={handleEdit}
                          style={{ borderRadius: '8px' }}
                        >
                          编辑
                        </Button>
                      </Grid.Item>
                      <Grid.Item>
                        <PrimaryButton block onClick={handleSign} style={{ borderRadius: '8px' }}>
                          签名交易
                        </PrimaryButton>
                      </Grid.Item>
                    </Grid>

                    <div
                      style={{
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        onClick={() => setShowScannedInfo(!showScannedInfo)}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: '#fafafa',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1d1d1f' }}>
                          查看信息
                        </span>
                        <span style={{ fontSize: '12px', color: '#86868b' }}>
                          {showScannedInfo ? '▼' : '▶'}
                        </span>
                      </div>
                      {showScannedInfo && (
                        <div style={{ padding: '16px', backgroundColor: '#fff' }}>
                          <TransactionForm
                            chain={currentChain as ChainType}
                            form={form}
                            readOnly={true}
                            showEditButton={false}
                            showFooter={false}
                            onSubmit={handleSign}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </JumboTabs.Tab>
            <JumboTabs.Tab title="手动输入" description="专业模式手动输入" key="manual">
              <TransactionForm
                chain={currentChain as ChainType}
                form={form}
                readOnly={false}
                showEditButton={false}
                onSubmit={handleSign}
                returnMode={mode} // 传递当前的 tab 模式，用于扫描后恢复
              />
            </JumboTabs.Tab>
          </JumboTabs>
        </div>
      </StandardCard>
    </PageLayout>
  );
}

export default SignTransactionPage;
