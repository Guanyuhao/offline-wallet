/**
 * @Author liyongjie
 * 签名交易表单组件
 * 支持编辑和只读两种状态
 */

import { useEffect } from 'react';
import { Form, Input, Button, Toast } from 'antd-mobile';
import { ScanningOutline, TextOutline } from 'antd-mobile-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { QRCodeProtocol, QRCodeType } from '@shared/types/qrcode';
import { readFromClipboard } from '../utils';
import { getChainFormConfig, isEVMChain, type ChainType } from '../config/chainConfig';
import PrimaryButton from './PrimaryButton';
import useScanStore, { ScanType } from '../stores/useScanStore';
import { useI18n } from '../hooks/useI18n';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormInstance = ReturnType<typeof Form.useForm>[0];

interface TransactionFormProps {
  /**
   * 当前链类型
   */
  chain: ChainType;
  /**
   * 表单实例（由外部管理）
   */
  form: FormInstance;
  /**
   * 是否只读模式
   */
  readOnly?: boolean;
  /**
   * 是否显示开启编辑按钮（仅在只读模式下有效）
   */
  showEditButton?: boolean;
  /**
   * 开启编辑按钮点击回调
   */
  onEnableEdit?: () => void;
  /**
   * 表单提交回调
   */
  onSubmit?: () => void;
  /**
   * 是否显示提交按钮（footer）
   */
  showFooter?: boolean;
  /**
   * 返回时需要恢复的 tab 模式（用于 SignTransactionPage）
   */
  returnMode?: 'scan' | 'manual';
}

/**
 * 签名交易表单组件
 */
function TransactionForm({
  chain,
  form,
  readOnly = false,
  showEditButton = false,
  onEnableEdit,
  onSubmit,
  showFooter = true,
  returnMode,
}: TransactionFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { scanResult, scanSuccess, scanType, setScanConfig, clearScanState } = useScanStore();
  const currentChain = chain;
  const t = useI18n();

  // 处理从扫描页面返回的结果（从 store 中读取）
  useEffect(() => {
    // 只处理地址类型的扫描结果
    if (scanSuccess && scanResult && scanType === ScanType.ADDRESS) {
      handleScanSuccess(scanResult);
      // 清除扫描状态，避免重复处理
      clearScanState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanSuccess, scanResult, scanType]);

  /**
   * 粘贴地址
   */
  const handlePasteAddress = async () => {
    try {
      const clipboardText = await readFromClipboard();

      if (!clipboardText) {
        Toast.show({
          content: t.transactionForm.clipboardEmpty,
          position: 'top',
        });
        return;
      }

      let address = clipboardText.trim();

      // 尝试解析二维码协议数据（如果是协议格式）
      try {
        const qrData = QRCodeProtocol.decode(address);
        if (qrData.type === QRCodeType.ADDRESS && 'address' in qrData) {
          address = qrData.address;
        }
      } catch {
        // 如果不是协议格式，直接使用剪贴板内容（可能是纯地址字符串）
      }

      // 验证地址格式（安全验证，使用详细验证 API）
      try {
        const result = await invoke<{ is_valid: boolean; error_message?: string }>(
          'validate_address_with_message',
          {
            chain: currentChain,
            address,
          }
        );

        if (!result.is_valid) {
          console.error('[地址验证失败]', result.error_message, '地址:', address);
          Toast.show({
            content: t.transactionForm.addressInvalid,
            position: 'top',
          });
          return;
        }
      } catch (error: unknown) {
        const err = error as Error;
        console.error('[地址验证失败]', err?.message, '地址:', address, error);
        Toast.show({
          content: t.transactionForm.addressInvalid,
          position: 'top',
        });
        return;
      }

      // 设置地址到表单，并清除错误状态
      form.setFieldsValue({
        to: address,
      });
      // 清除错误状态并强制更新
      form.setFields([
        {
          name: 'to',
          errors: [],
        },
      ]);
      Toast.show({
        content: t.transactionForm.addressPasted,
        position: 'top',
        icon: 'success',
      });
    } catch (error: unknown) {
      const err = error as Error;
      const errorMessage = err?.message || String(error);
      Toast.show({
        content: `${t.transactionForm.pasteFailed} ${errorMessage}`,
        position: 'top',
      });
    }
  };

  /**
   * 扫描地址：跳转到扫描页面
   */
  const handleScanAddress = () => {
    // 设置扫描配置到 store
    setScanConfig({
      scanType: ScanType.ADDRESS,
      hint: t.transactionForm.scanAddressHint,
      returnPath: location.pathname, // 返回当前页面
      returnMode, // 传递返回时需要恢复的 tab 模式
    });
    // 跳转到扫描页面
    navigate('/scan-qr');
  };

  /**
   * 处理扫描成功
   */
  const handleScanSuccess = async (scannedText: string) => {
    try {
      let scannedAddress = scannedText.trim();

      // 尝试解析二维码协议数据（如果是协议格式）
      try {
        const qrData = QRCodeProtocol.decode(scannedAddress);
        if (qrData.type === QRCodeType.ADDRESS && 'address' in qrData) {
          scannedAddress = qrData.address;
        }
      } catch {
        // 如果不是协议格式，直接使用扫描结果（可能是纯地址字符串）
      }

      // 验证地址格式（安全验证，使用详细验证 API）
      try {
        const result = await invoke<{ is_valid: boolean; error_message?: string }>(
          'validate_address_with_message',
          {
            chain: currentChain,
            address: scannedAddress,
          }
        );

        if (!result.is_valid) {
          console.error('[地址验证失败]', result.error_message, '地址:', scannedAddress);
          Toast.show({
            content: t.transactionForm.addressInvalid,
            position: 'top',
          });
          return;
        }
      } catch (error: unknown) {
        const err = error as Error;
        console.error('[地址验证失败]', err?.message, '地址:', scannedAddress, error);
        Toast.show({
          content: t.transactionForm.addressInvalid,
          position: 'top',
        });
        return;
      }

      // 设置地址到表单，并清除错误状态
      form.setFieldsValue({
        to: scannedAddress,
      });
      // 清除错误状态并强制更新
      form.setFields([
        {
          name: 'to',
          errors: [],
        },
      ]);
      Toast.show({
        content: t.transactionForm.addressScanned,
        position: 'top',
        icon: 'success',
      });
    } catch (error: unknown) {
      const err = error as Error;
      const errorMessage = err?.message || String(error);

      // 如果是用户取消扫描，不显示错误
      if (
        errorMessage.includes('cancel') ||
        errorMessage.includes('取消') ||
        errorMessage.includes('User cancelled')
      ) {
        return;
      }

      // 桌面端可能不支持扫描，提示手动输入
      if (
        errorMessage.includes('not supported') ||
        errorMessage.includes('不支持') ||
        errorMessage.includes('not available') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('Cannot find module') ||
        errorMessage.includes('Failed to resolve')
      ) {
        Toast.show({
          content: t.transactionForm.scanNotSupportedManual,
          position: 'top',
        });
        return;
      }

      // 其他错误
      Toast.show({
        content: `${t.signTransaction.scanFailed} ${errorMessage}`,
        position: 'top',
      });
    }
  };

  return (
    <div>
      {/* 只读模式下的开启编辑按钮 */}
      {readOnly && showEditButton && (
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <Button
            color="primary"
            onClick={onEnableEdit}
            style={{
              borderRadius: '8px',
            }}
          >
            {t.transactionForm.enableEditMode}
          </Button>
          <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--app-subtitle-color)' }}>
            {t.transactionForm.editModeHint}
          </p>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={getChainFormConfig(currentChain).initialValues}
        footer={
          showFooter ? (
            <PrimaryButton onClick={onSubmit} style={{ marginTop: '8px' }}>
              {t.signTransaction.sign}
            </PrimaryButton>
          ) : null
        }
      >
        <Form.Item
          label={t.transactionForm.recipientAddress}
          name="to"
          rules={[
            { required: true, message: t.transactionForm.recipientAddressRequired },
            {
              validator: async (_, value) => {
                // required 规则已经处理了空值，这里只验证非空值
                if (!value || typeof value !== 'string') {
                  return; // 空值由 required 规则处理
                }

                const trimmedValue = value.trim();
                if (!trimmedValue) {
                  return; // 空值由 required 规则处理
                }

                console.log('[表单验证器] 开始验证地址:', trimmedValue, '链:', currentChain);

                // 使用详细的地址验证 API，添加超时处理
                try {
                  const validationPromise = invoke<{ is_valid: boolean; error_message?: string }>(
                    'validate_address_with_message',
                    {
                      chain: currentChain,
                      address: trimmedValue,
                    }
                  );

                  const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => {
                      reject(new Error(t.transactionForm.addressTimeout));
                    }, 5000); // 5秒超时
                  });

                  const result = await Promise.race([validationPromise, timeoutPromise]);
                  console.log('[表单验证器] 地址验证结果:', result);

                  if (!result.is_valid) {
                    console.error('[地址验证失败]', result.error_message, '地址:', trimmedValue);
                    return Promise.reject(new Error(t.transactionForm.addressInvalid));
                  }

                  console.log('[表单验证器] 地址验证通过');
                } catch (error: unknown) {
                  const err = error as Error;
                  console.error('[地址验证失败]', err?.message, '地址:', trimmedValue, error);
                  return Promise.reject(new Error(t.transactionForm.addressInvalid));
                }
              },
            },
          ]}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Form.Item noStyle name="to">
              <Input
                placeholder={t.transactionForm.inputPlaceholder}
                style={{ flex: 1 }}
                readOnly={readOnly}
              />
            </Form.Item>
            {!readOnly && (
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                }}
              >
                <Button
                  onClick={handlePasteAddress}
                  size="small"
                  style={{
                    padding: '8px 12px',
                    minWidth: 'auto',
                    borderRadius: '8px',
                  }}
                >
                  <TextOutline />
                </Button>
                <Button
                  onClick={handleScanAddress}
                  size="small"
                  style={{
                    padding: '8px 12px',
                    minWidth: 'auto',
                    borderRadius: '8px',
                  }}
                >
                  <ScanningOutline />
                </Button>
              </div>
            )}
          </div>
        </Form.Item>

        <Form.Item
          label={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>{t.transactionForm.amount}</span>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--app-subtitle-color)',
                  fontWeight: 'normal',
                }}
              >
                {t.transactionForm.amountUnit}: {currentChain.toUpperCase()}
              </span>
            </div>
          }
          name="value"
          rules={[
            { required: true, message: t.transactionForm.amountRequired },
            {
              validator: (_, value) => {
                console.log('[金额验证器] 开始验证金额:', value);
                // required 规则已经处理了空值，这里只验证非空值
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                  console.log('[金额验证器] 空值，跳过验证');
                  return; // 空值由 required 规则处理
                }

                // 格式验证：必须是数字格式
                if (!/^\d+(\.\d{1,18})?$/.test(String(value))) {
                  console.log('[金额验证器] 格式验证失败');
                  return Promise.reject(new Error(t.transactionForm.amountInvalid));
                }

                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                  console.log('[金额验证器] 数字解析失败');
                  return Promise.reject(new Error(t.transactionForm.amountInvalid));
                }

                if (numValue <= 0) {
                  console.log('[金额验证器] 金额必须大于0');
                  return Promise.reject(new Error(t.transactionForm.amountMustBePositive));
                }

                // 检查精度（ETH 最多18位小数）
                const valueStr = String(value);
                const parts = valueStr.split('.');
                if (parts.length === 2 && parts[1].length > 18) {
                  console.log('[金额验证器] 精度超过18位');
                  return Promise.reject(new Error(t.transactionForm.amountPrecisionError));
                }

                // 检查是否超出合理范围（防止输入过大）
                if (numValue > 1e9) {
                  console.log('[金额验证器] 金额过大');
                  return Promise.reject(new Error(t.transactionForm.amountTooLarge));
                }

                console.log('[金额验证器] 验证通过');
              },
            },
          ]}
        >
          <Input
            type="number"
            placeholder="0.0"
            readOnly={readOnly}
            style={{
              borderRadius: '12px',
              fontSize: '17px',
            }}
          />
        </Form.Item>

        {/* Gas Price 字段：仅 EVM 链显示 */}
        {isEVMChain(currentChain) && (
          <Form.Item
            label={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>{t.transactionForm.gasPrice}</span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--app-subtitle-color)',
                    fontWeight: 'normal',
                  }}
                >
                  {t.transactionForm.gasPriceUnit}
                </span>
              </div>
            }
            name="gasPrice"
            rules={[
              { required: true, message: t.transactionForm.gasPriceRequired },
              {
                validator: (_, value) => {
                  // required 规则已经处理了空值，这里只验证非空值
                  if (!value || (typeof value === 'string' && value.trim() === '')) {
                    return; // 空值由 required 规则处理
                  }

                  const trimmedValue = String(value).trim();

                  // 格式校验：不能以小数点开头或结尾
                  if (trimmedValue.startsWith('.') || trimmedValue.endsWith('.')) {
                    return Promise.reject(new Error(t.transactionForm.gasPriceFormatError));
                  }

                  // 格式校验：不能有多个小数点
                  if ((trimmedValue.match(/\./g) || []).length > 1) {
                    return Promise.reject(new Error(t.transactionForm.gasPriceMultipleDecimal));
                  }

                  // 格式校验：必须是数字格式（不能以0开头，除非是0或0.xxx）
                  if (!/^(0|[1-9]\d*)(\.\d{1,9})?$/.test(trimmedValue)) {
                    return Promise.reject(new Error(t.transactionForm.gasPriceLeadingZero));
                  }

                  const numValue = parseFloat(trimmedValue);
                  if (isNaN(numValue)) {
                    return Promise.reject(new Error(t.transactionForm.gasPriceInvalid));
                  }

                  // 最小值检查：必须大于 0.000000001 Gwei（1 Wei）
                  if (numValue <= 0) {
                    return Promise.reject(new Error(t.transactionForm.gasPriceMustBePositive));
                  }

                  if (numValue < 0.000000001) {
                    return Promise.reject(new Error(t.transactionForm.gasPriceMinimum));
                  }

                  // 最大值检查：不超过 10000 Gwei
                  if (numValue > 10000) {
                    return Promise.reject(new Error(t.transactionForm.gasPriceMaximum));
                  }

                  // 精度检查：最多9位小数
                  const parts = trimmedValue.split('.');
                  if (parts.length === 2 && parts[1].length > 9) {
                    return Promise.reject(new Error(t.transactionForm.gasPricePrecisionError));
                  }
                },
              },
            ]}
          >
            <Input
              type="number"
              placeholder="20"
              readOnly={readOnly}
              style={{
                borderRadius: '12px',
                fontSize: '17px',
              }}
            />
          </Form.Item>
        )}

        {/* Gas Limit 字段：仅 EVM 链显示 */}
        {isEVMChain(currentChain) && (
          <Form.Item
            label={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>{t.transactionForm.gasLimit}</span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--app-subtitle-color)',
                    fontWeight: 'normal',
                  }}
                >
                  {t.transactionForm.gasLimitSuggestion}
                </span>
              </div>
            }
            name="gasLimit"
            rules={[
              { required: true, message: t.transactionForm.gasLimitRequired },
              {
                validator: (_, value) => {
                  // required 规则已经处理了空值，这里只验证非空值
                  if (!value || (typeof value === 'string' && value.trim() === '')) {
                    return; // 空值由 required 规则处理
                  }

                  const trimmedValue = String(value).trim();

                  // 格式校验：必须是正整数（不能以0开头，除非是0）
                  if (!/^(0|[1-9]\d*)$/.test(trimmedValue)) {
                    return Promise.reject(new Error(t.transactionForm.gasLimitInvalid));
                  }

                  const intValue = parseInt(trimmedValue, 10);
                  if (isNaN(intValue)) {
                    return Promise.reject(new Error(t.transactionForm.gasLimitInvalid));
                  }

                  // 最小值检查：必须至少 21000（普通转账的最低要求）
                  if (intValue <= 0) {
                    return Promise.reject(new Error(t.transactionForm.gasLimitMustBePositive));
                  }

                  if (intValue < 21000) {
                    return Promise.reject(new Error(t.transactionForm.gasLimitMustBePositive));
                  }

                  // 最大值检查：不超过 30000000
                  if (intValue > 30000000) {
                    return Promise.reject(new Error(t.transactionForm.gasLimitMaximum));
                  }
                },
              },
            ]}
          >
            <Input
              type="number"
              placeholder="21000"
              readOnly={readOnly}
              style={{
                borderRadius: '12px',
                fontSize: '17px',
              }}
            />
          </Form.Item>
        )}

        {/* Nonce 字段：仅 EVM 链显示 */}
        {isEVMChain(currentChain) && (
          <Form.Item
            label={t.transactionForm.nonce}
            name="nonce"
            rules={[
              { required: true, message: t.transactionForm.nonceRequired },
              {
                validator: (_, value) => {
                  // required 规则已经处理了空值，这里只验证非空值
                  if (!value || (typeof value === 'string' && value.trim() === '')) {
                    return; // 空值由 required 规则处理
                  }

                  const valueStr = String(value);

                  // 检查是否为非负整数
                  if (!/^\d+$/.test(valueStr)) {
                    return Promise.reject(new Error(t.transactionForm.nonceMustBeNonNegative));
                  }

                  const intValue = parseInt(valueStr, 10);
                  if (isNaN(intValue)) {
                    return Promise.reject(new Error(t.transactionForm.nonceInvalid));
                  }

                  if (intValue < 0) {
                    return Promise.reject(new Error(t.transactionForm.nonceMustBeNonNegative));
                  }

                  // 合理范围检查（通常 0 - 2^64-1，但实际使用中不会这么大）
                  if (intValue > Number.MAX_SAFE_INTEGER) {
                    return Promise.reject(new Error(t.transactionForm.nonceMaximum));
                  }
                },
              },
            ]}
          >
            <Input
              type="number"
              placeholder="0"
              readOnly={readOnly}
              style={{
                borderRadius: '12px',
                fontSize: '17px',
              }}
            />
          </Form.Item>
        )}
      </Form>
    </div>
  );
}

export default TransactionForm;
