/**
 * 表单验证器工具
 * 提供通用的验证逻辑，可在热钱包和冷钱包中复用
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ValidatorTexts {
  required?: string;
  invalid?: string;
  mustBePositive?: string;
  tooLarge?: string;
  precisionError?: string;
  formatError?: string;
  minimum?: string;
  maximum?: string;
}

/**
 * 金额验证器
 * @param value 金额值
 * @param texts 错误文本
 * @param options 验证选项
 */
export function validateAmount(
  value: string | number | undefined,
  texts: ValidatorTexts,
  options: {
    maxDecimals?: number;
    maxValue?: number;
  } = {}
): ValidationResult {
  const { maxDecimals = 18, maxValue = 1e9 } = options;

  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { valid: true }; // 空值由 required 规则处理
  }

  const valueStr = String(value).trim();

  // 格式验证：必须是数字格式
  const regex = new RegExp(`^\\d+(\\.\\d{1,${maxDecimals}})?$`);
  if (!regex.test(valueStr)) {
    return { valid: false, error: texts.invalid || '金额格式无效' };
  }

  const numValue = parseFloat(valueStr);
  if (isNaN(numValue)) {
    return { valid: false, error: texts.invalid || '金额格式无效' };
  }

  if (numValue <= 0) {
    return { valid: false, error: texts.mustBePositive || '金额必须大于0' };
  }

  // 检查精度
  const parts = valueStr.split('.');
  if (parts.length === 2 && parts[1].length > maxDecimals) {
    return { valid: false, error: texts.precisionError || `精度不能超过${maxDecimals}位小数` };
  }

  // 检查是否超出合理范围
  if (numValue > maxValue) {
    return { valid: false, error: texts.tooLarge || '金额过大' };
  }

  return { valid: true };
}

/**
 * Gas Price 验证器 (Gwei)
 */
export function validateGasPrice(
  value: string | number | undefined,
  texts: ValidatorTexts
): ValidationResult {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { valid: true };
  }

  const trimmedValue = String(value).trim();

  // 格式校验：不能以小数点开头或结尾
  if (trimmedValue.startsWith('.') || trimmedValue.endsWith('.')) {
    return { valid: false, error: texts.formatError || 'Gas Price 格式错误' };
  }

  // 格式校验：不能有多个小数点
  if ((trimmedValue.match(/\./g) || []).length > 1) {
    return { valid: false, error: texts.formatError || '不能有多个小数点' };
  }

  // 格式校验：必须是数字格式
  if (!/^(0|[1-9]\d*)(\.\d{1,9})?$/.test(trimmedValue)) {
    return { valid: false, error: texts.formatError || '格式错误' };
  }

  const numValue = parseFloat(trimmedValue);
  if (isNaN(numValue)) {
    return { valid: false, error: texts.invalid || 'Gas Price 无效' };
  }

  if (numValue <= 0) {
    return { valid: false, error: texts.mustBePositive || 'Gas Price 必须大于0' };
  }

  if (numValue < 0.000000001) {
    return { valid: false, error: texts.minimum || 'Gas Price 最小为 0.000000001 Gwei' };
  }

  if (numValue > 10000) {
    return { valid: false, error: texts.maximum || 'Gas Price 不能超过 10000 Gwei' };
  }

  // 精度检查：最多9位小数
  const parts = trimmedValue.split('.');
  if (parts.length === 2 && parts[1].length > 9) {
    return { valid: false, error: texts.precisionError || '精度不能超过9位小数' };
  }

  return { valid: true };
}

/**
 * Gas Limit 验证器
 */
export function validateGasLimit(
  value: string | number | undefined,
  texts: ValidatorTexts
): ValidationResult {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { valid: true };
  }

  const trimmedValue = String(value).trim();

  // 格式校验：必须是正整数
  if (!/^(0|[1-9]\d*)$/.test(trimmedValue)) {
    return { valid: false, error: texts.invalid || 'Gas Limit 必须是整数' };
  }

  const intValue = parseInt(trimmedValue, 10);
  if (isNaN(intValue)) {
    return { valid: false, error: texts.invalid || 'Gas Limit 无效' };
  }

  if (intValue < 21000) {
    return { valid: false, error: texts.minimum || 'Gas Limit 最小为 21000' };
  }

  if (intValue > 30000000) {
    return { valid: false, error: texts.maximum || 'Gas Limit 不能超过 30000000' };
  }

  return { valid: true };
}

/**
 * Nonce 验证器
 */
export function validateNonce(
  value: string | number | undefined,
  texts: ValidatorTexts
): ValidationResult {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { valid: true };
  }

  const valueStr = String(value).trim();

  // 检查是否为非负整数
  if (!/^\d+$/.test(valueStr)) {
    return { valid: false, error: texts.invalid || 'Nonce 必须是非负整数' };
  }

  const intValue = parseInt(valueStr, 10);
  if (isNaN(intValue)) {
    return { valid: false, error: texts.invalid || 'Nonce 无效' };
  }

  if (intValue < 0) {
    return { valid: false, error: texts.mustBePositive || 'Nonce 必须是非负整数' };
  }

  if (intValue > Number.MAX_SAFE_INTEGER) {
    return { valid: false, error: texts.maximum || 'Nonce 超出范围' };
  }

  return { valid: true };
}

/**
 * 创建 antd-mobile Form 验证器
 * 将 ValidationResult 转换为 Form 验证器格式
 */
export function createFormValidator(validateFn: (value: any) => ValidationResult) {
  return (_: any, value: any) => {
    const result = validateFn(value);
    if (!result.valid) {
      return Promise.reject(new Error(result.error));
    }
    return Promise.resolve();
  };
}
