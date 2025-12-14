/**
 * @Author liyongjie
 * 预定义表单 Schema 配置
 */

import type { FormSchema, FormFieldSchema } from './types';
import type { ChainType } from '../../config/chainConfig';
import { isEVMChain } from '../../config/chainConfig';

/**
 * 地址输入字段（支持粘贴、扫描）
 */
export const addressField = (options?: Partial<FormFieldSchema>): FormFieldSchema => ({
  name: 'address',
  type: 'address',
  label: '地址',
  placeholder: '输入地址，自动识别网络',
  required: true,
  requiredMessage: '请输入地址',
  actions: ['paste', 'scan'],
  ...options,
});

/**
 * 接收地址字段
 */
export const toAddressField = (options?: Partial<FormFieldSchema>): FormFieldSchema => ({
  name: 'toAddress',
  type: 'address',
  label: '接收地址',
  placeholder: '输入接收地址',
  required: true,
  requiredMessage: '请输入接收地址',
  actions: ['paste', 'scan'],
  ...options,
});

/**
 * 金额字段
 */
export const amountField = (
  chainSymbol?: string,
  options?: Partial<FormFieldSchema>
): FormFieldSchema => ({
  name: 'amount',
  type: 'amount',
  label: '金额',
  placeholder: '0.0',
  required: true,
  requiredMessage: '请输入金额',
  suffix: chainSymbol,
  ...options,
});

/**
 * Gas Price 字段
 */
export const gasPriceField = (options?: Partial<FormFieldSchema>): FormFieldSchema => ({
  name: 'gasPrice',
  type: 'number',
  label: 'Gas Price',
  placeholder: '20',
  required: true,
  requiredMessage: '请输入 Gas Price',
  suffix: 'Gwei',
  groupTitle: 'Gas 参数',
  groupRefreshable: true,
  ...options,
});

/**
 * Gas Limit 字段
 */
export const gasLimitField = (options?: Partial<FormFieldSchema>): FormFieldSchema => ({
  name: 'gasLimit',
  type: 'number',
  label: 'Gas Limit',
  placeholder: '21000',
  required: true,
  requiredMessage: '请输入 Gas Limit',
  ...options,
});

/**
 * Nonce 字段
 */
export const nonceField = (options?: Partial<FormFieldSchema>): FormFieldSchema => ({
  name: 'nonce',
  type: 'number',
  label: 'Nonce',
  placeholder: '0',
  required: true,
  requiredMessage: '请输入 Nonce',
  ...options,
});

/**
 * 备注字段
 */
export const memoField = (options?: Partial<FormFieldSchema>): FormFieldSchema => ({
  name: 'memo',
  type: 'text',
  label: '备注',
  placeholder: '可选',
  required: false,
  ...options,
});

/**
 * 标签字段
 */
export const labelField = (options?: Partial<FormFieldSchema>): FormFieldSchema => ({
  name: 'label',
  type: 'text',
  label: '标签',
  placeholder: '给地址起个名字（可选）',
  required: false,
  ...options,
});

// ============ 预定义 Schema ============

/**
 * 添加观察地址表单 Schema
 */
export const watchAddressSchema: FormSchema = {
  fields: [addressField(), labelField()],
  submitText: '添加地址',
  showSubmit: true,
};

/**
 * 生成发送交易表单 Schema
 */
export function createSendTransactionSchema(
  chain: ChainType,
  chainSymbol: string,
  texts?: {
    to?: string;
    toPlaceholder?: string;
    toRequired?: string;
    amount?: string;
    amountRequired?: string;
    memo?: string;
    memoPlaceholder?: string;
    submit?: string;
  }
): FormSchema {
  const isEVM = isEVMChain(chain);

  const fields: FormFieldSchema[] = [
    toAddressField({
      label: texts?.to || '接收地址',
      placeholder: texts?.toPlaceholder || '输入接收地址',
      requiredMessage: texts?.toRequired || '请输入接收地址',
    }),
    amountField(chainSymbol, {
      label: texts?.amount || '金额',
      requiredMessage: texts?.amountRequired || '请输入金额',
    }),
  ];

  // EVM 链添加 Gas 参数
  if (isEVM) {
    fields.push(gasPriceField(), gasLimitField(), nonceField());
  }

  // 添加备注字段
  fields.push(
    memoField({
      label: texts?.memo || '备注',
      placeholder: texts?.memoPlaceholder || '可选',
    })
  );

  return {
    fields,
    submitText: texts?.submit || '构建交易',
    showSubmit: true,
  };
}

/**
 * 生成签名交易表单 Schema（冷钱包用）
 */
export function createSignTransactionSchema(
  chain: ChainType,
  texts?: {
    to?: string;
    value?: string;
    gasPrice?: string;
    gasLimit?: string;
    nonce?: string;
  }
): FormSchema {
  const isEVM = isEVMChain(chain);

  const fields: FormFieldSchema[] = [
    {
      name: 'to',
      type: 'address',
      label: texts?.to || '收款地址',
      placeholder: '支持手动输入、粘贴或扫描',
      required: true,
      requiredMessage: '请输入收款地址',
      actions: ['paste', 'scan'],
    },
    {
      name: 'value',
      type: 'amount',
      label: texts?.value || '金额',
      placeholder: '0.0',
      required: true,
      requiredMessage: '请输入金额',
    },
  ];

  // EVM 链添加 Gas 参数
  if (isEVM) {
    fields.push(
      {
        name: 'gasPrice',
        type: 'number',
        label: texts?.gasPrice || 'Gas Price',
        placeholder: '20',
        required: true,
        requiredMessage: '请输入 Gas Price',
        suffix: 'Gwei',
      },
      {
        name: 'gasLimit',
        type: 'number',
        label: texts?.gasLimit || 'Gas Limit',
        placeholder: '21000',
        required: true,
        requiredMessage: '请输入 Gas Limit',
      },
      {
        name: 'nonce',
        type: 'number',
        label: texts?.nonce || 'Nonce',
        placeholder: '0',
        required: true,
        requiredMessage: '请输入 Nonce',
      }
    );
  }

  return {
    fields,
    showSubmit: false,
  };
}
