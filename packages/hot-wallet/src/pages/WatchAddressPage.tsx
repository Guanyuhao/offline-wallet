import { useState, useCallback, useEffect } from 'react';
import { Button, Input, Form, Toast, Tabs, Tag, Space } from 'antd-mobile';
import { ScanningOutline, AddOutline, CheckCircleFill, TextOutline } from 'antd-mobile-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageLayout, StandardCard } from '@offline-wallet/shared/components';
import { CHAIN_DISPLAY_NAMES, type ChainType } from '@offline-wallet/shared/config';
import { QRCodeProtocol, QRCodeType } from '@offline-wallet/shared/types';
import { readFromClipboard } from '@offline-wallet/shared/utils';
import { useI18n } from '../hooks/useI18n';
import useAddressStore from '../stores/useAddressStore';
import useScanStore, { ScanType } from '../stores/useScanStore';
import { invoke } from '@tauri-apps/api/core';

function WatchAddressPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const t = useI18n();
  const { addAddress, addressExists } = useAddressStore();
  const { scanResult, scanSuccess, setScanConfig, clearScanState } = useScanStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedChain, setSelectedChain] = useState<ChainType | null>(null);
  const [detectedChains, setDetectedChains] = useState<ChainType[]>([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'manual');
  const [addressValidated, setAddressValidated] = useState(false);

  // 监听 URL 参数变化
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'qr' || tab === 'manual') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 处理扫描结果
  useEffect(() => {
    if (scanSuccess && scanResult) {
      try {
        // 解析二维码
        const parsed = QRCodeProtocol.decode(scanResult);

        // 验证是地址二维码
        if (parsed.type !== QRCodeType.ADDRESS) {
          Toast.show({
            content: t.watchAddress.invalidAddress,
            icon: 'fail',
          });
          clearScanState();
          return;
        }

        // 设置表单值
        form.setFieldsValue({
          address: parsed.address,
          label: parsed.label || '',
        });
        setSelectedChain(parsed.chain as ChainType);
        setDetectedChains([parsed.chain as ChainType]);
        setAddressValidated(true);

        // 切换到手动输入标签页（显示已填充的表单）
        setActiveTab('manual');

        Toast.show({
          content: '二维码扫描成功',
          icon: 'success',
        });

        // 清除扫描状态
        clearScanState();
      } catch (error) {
        console.error('解析二维码失败:', error);
        Toast.show({
          content: t.watchAddress.invalidAddress,
          icon: 'fail',
        });
        clearScanState();
      }
    }
  }, [scanSuccess, scanResult, form, t, clearScanState]);

  // 自动检测地址所属链
  const detectChainFromAddress = useCallback(
    async (address: string) => {
      if (!address || address.length < 10) {
        setDetectedChains([]);
        setSelectedChain(null);
        setAddressValidated(false);
        return;
      }

      try {
        const chains = await invoke<string[]>('detect_chain', { address });
        const validChains = chains as ChainType[];
        setDetectedChains(validChains);

        // 自动选择第一个匹配的链
        if (validChains.length > 0 && !selectedChain) {
          setSelectedChain(validChains[0]);
          setAddressValidated(true);
        } else if (validChains.length === 0) {
          setAddressValidated(false);
        } else {
          setAddressValidated(true);
        }
      } catch (error) {
        console.error('检测链失败:', error);
        setDetectedChains([]);
        setAddressValidated(false);
      }
    },
    [selectedChain]
  );

  // 地址输入变化时自动检测
  const handleAddressChange = (value: string) => {
    form.setFieldValue('address', value);
    detectChainFromAddress(value);
  };

  // 粘贴地址
  const handlePasteAddress = async () => {
    try {
      const clipboardText = await readFromClipboard();
      if (!clipboardText) {
        Toast.show({ content: t.send?.clipboardEmpty || '剪贴板为空', icon: 'fail' });
        return;
      }
      const trimmedText = clipboardText.trim();
      form.setFieldValue('address', trimmedText);
      detectChainFromAddress(trimmedText);
      Toast.show({ content: t.common.success, icon: 'success' });
    } catch (error) {
      console.error('粘贴失败:', error);
      Toast.show({ content: `${t.common.failed}: ${error}`, icon: 'fail' });
    }
  };

  // 扫描地址二维码（在手动输入 tab 中使用）
  const handleScanAddressInline = () => {
    setScanConfig({
      scanType: ScanType.ADDRESS,
      hint: t.watchAddress.scanHint,
      returnPath: '/watch-address',
    });
    navigate('/scan-qr', { replace: true });
  };

  // 扫描二维码（跳转到扫描页面，用于 QR tab）
  const handleScanQR = () => {
    setScanConfig({
      scanType: ScanType.ADDRESS,
      hint: t.watchAddress.scanHint,
      returnPath: '/watch-address',
    });
    navigate('/scan-qr', { replace: true });
  };

  // 选择链
  const handleSelectChain = (chain: ChainType) => {
    setSelectedChain(chain);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (!selectedChain) {
        Toast.show({
          content: t.watchAddress.selectChain,
          icon: 'fail',
        });
        return;
      }

      // 检查地址是否已存在
      if (addressExists(selectedChain, values.address)) {
        Toast.show({
          content: t.watchAddress.addressExists,
          icon: 'fail',
        });
        return;
      }

      // 验证地址格式
      const isValid = await invoke<boolean>('validate_address', {
        chain: selectedChain,
        address: values.address,
      });

      if (!isValid) {
        Toast.show({
          content: t.watchAddress.invalidAddress,
          icon: 'fail',
        });
        return;
      }

      // 添加地址
      addAddress({
        chain: selectedChain,
        address: values.address,
        label: values.label,
      });

      Toast.show({
        content: t.watchAddress.addSuccess,
        icon: 'success',
      });

      // 返回首页
      navigate('/');
    } catch (error) {
      console.error('添加失败:', error);
      Toast.show({
        content: `${t.watchAddress.addFailed}: ${error}`,
        icon: 'fail',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title={t.watchAddress.title} onBack={() => navigate('/')}>
      <StandardCard style={{ marginBottom: '16px' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ '--title-font-size': '16px' }}>
          <Tabs.Tab title={t.watchAddress.addManually} key="manual">
            <div style={{ padding: '20px 0' }}>
              <Form
                form={form}
                layout="vertical"
                footer={
                  <Button
                    block
                    type="submit"
                    color="primary"
                    size="large"
                    loading={loading}
                    disabled={!addressValidated || !selectedChain}
                    onClick={handleSubmit}
                    style={{ borderRadius: '12px', height: '50px', fontSize: '17px' }}
                  >
                    <AddOutline fontSize={20} style={{ marginRight: '8px' }} />
                    {t.home.addAddress}
                  </Button>
                }
              >
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
                      <span>{t.watchAddress.inputHint}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          size="mini"
                          onClick={handlePasteAddress}
                          style={{ fontSize: '12px', padding: '2px 8px' }}
                        >
                          <TextOutline style={{ marginRight: '2px' }} />
                          {t.send?.paste || '粘贴'}
                        </Button>
                        <Button
                          size="mini"
                          onClick={handleScanAddressInline}
                          style={{ fontSize: '12px', padding: '2px 8px' }}
                        >
                          <ScanningOutline style={{ marginRight: '2px' }} />
                          {t.send?.scan || '扫描'}
                        </Button>
                      </div>
                    </div>
                  }
                  name="address"
                  rules={[{ required: true, message: t.watchAddress.inputHint }]}
                >
                  <Input
                    placeholder={t.watchAddress.inputPlaceholder}
                    style={{ fontSize: '15px' }}
                    onChange={handleAddressChange}
                  />
                </Form.Item>

                {/* 自动检测到的网络 */}
                {detectedChains.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        fontSize: '14px',
                        color: 'var(--app-subtitle-color)',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircleFill color="var(--app-success-color)" fontSize={16} />
                      {detectedChains.length === 1
                        ? t.watchAddress.detectedNetwork
                        : t.watchAddress.selectNetwork}
                    </div>
                    <Space wrap>
                      {detectedChains.map((chain) => (
                        <Tag
                          key={chain}
                          color={selectedChain === chain ? 'primary' : 'default'}
                          onClick={() => handleSelectChain(chain)}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            borderRadius: '8px',
                          }}
                        >
                          {CHAIN_DISPLAY_NAMES[chain]}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* 地址无效提示 */}
                {form.getFieldValue('address') &&
                  form.getFieldValue('address').length > 10 &&
                  detectedChains.length === 0 && (
                    <div
                      style={{
                        marginBottom: '16px',
                        color: 'var(--app-error-color)',
                        fontSize: '14px',
                      }}
                    >
                      {t.watchAddress.invalidAddress}
                    </div>
                  )}

                <Form.Item label={t.watchAddress.label} name="label">
                  <Input
                    placeholder={t.watchAddress.labelPlaceholder}
                    style={{ fontSize: '15px' }}
                  />
                </Form.Item>
              </Form>
            </div>
          </Tabs.Tab>

          <Tabs.Tab title={t.watchAddress.addByQR} key="qr">
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ marginBottom: '24px', color: 'var(--app-subtitle-color)' }}>
                {t.watchAddress.scanHint}
              </div>
              <Button
                color="primary"
                size="large"
                onClick={handleScanQR}
                style={{
                  borderRadius: '12px',
                  height: '50px',
                  fontSize: '17px',
                  minWidth: '200px',
                }}
              >
                <ScanningOutline fontSize={20} style={{ marginRight: '8px' }} />
                {t.home.scanQRCode}
              </Button>
            </div>
          </Tabs.Tab>
        </Tabs>
      </StandardCard>
    </PageLayout>
  );
}

export default WatchAddressPage;
