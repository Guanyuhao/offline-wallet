/**
 * 链类型配置
 * 用于区分不同链的表单字段和交易结构
 */

export type ChainType = 'eth' | 'btc' | 'sol' | 'bnb' | 'tron' | 'kaspa';

export type ChainCategory = 'EVM' | 'UTXO' | 'BLOCKSEQ';

/**
 * 链分类配置
 */
export const CHAIN_CATEGORIES: Record<ChainType, ChainCategory> = {
  eth: 'EVM',
  bnb: 'EVM',
  btc: 'UTXO',
  sol: 'BLOCKSEQ',
  tron: 'EVM',
  kaspa: 'UTXO',
};

/**
 * 支持的链列表（自动从 CHAIN_CATEGORIES 生成）
 */
export const SUPPORTED_CHAINS: ChainType[] = Object.keys(CHAIN_CATEGORIES) as ChainType[];

/**
 * 链的显示名称配置
 */
export const CHAIN_DISPLAY_NAMES: Record<ChainType, string> = {
  eth: 'ETH',
  btc: 'BTC',
  sol: 'SOL',
  bnb: 'BNB',
  tron: 'TRON',
  kaspa: 'KASPA',
};

/**
 * 获取链的分类
 */
export function getChainCategory(chain: ChainType): ChainCategory {
  return CHAIN_CATEGORIES[chain] || 'BLOCKSEQ';
}

/**
 * 判断是否为 EVM 链
 */
export function isEVMChain(chain: ChainType): boolean {
  return getChainCategory(chain) === 'EVM';
}

/**
 * 判断是否为 UTXO 链
 */
export function isUTXOChain(chain: ChainType): boolean {
  return getChainCategory(chain) === 'UTXO';
}

/**
 * 表单字段配置
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'input' | 'textarea' | 'number';
  required: boolean;
  placeholder?: string;
  rules?: any[];
}

/**
 * 链的表单配置
 */
export interface ChainFormConfig {
  fields: FormFieldConfig[];
  initialValues?: Record<string, any>;
}

/**
 * EVM 链表单配置（ETH, BNB）
 */
const EVM_FORM_CONFIG: ChainFormConfig = {
  fields: [
    {
      name: 'to',
      label: '收款地址',
      type: 'input',
      required: true,
      placeholder: '支持手动输入、粘贴或扫描',
    },
    {
      name: 'value',
      label: '金额',
      type: 'number',
      required: true,
      placeholder: '0.0',
    },
    {
      name: 'gasPrice',
      label: 'Gas Price',
      type: 'number',
      required: true,
      placeholder: '20',
    },
    {
      name: 'gasLimit',
      label: 'Gas Limit',
      type: 'number',
      required: true,
      placeholder: '21000',
    },
    {
      name: 'nonce',
      label: 'Nonce',
      type: 'number',
      required: true,
      placeholder: '0',
    },
  ],
  initialValues: {
    gasPrice: '20',
    gasLimit: '21000',
    nonce: '0',
  },
};

/**
 * UTXO 链表单配置（BTC）
 */
const UTXO_FORM_CONFIG: ChainFormConfig = {
  fields: [
    {
      name: 'to',
      label: '收款地址',
      type: 'input',
      required: true,
      placeholder: '支持手动输入、粘贴或扫描',
    },
    {
      name: 'value',
      label: '金额',
      type: 'number',
      required: true,
      placeholder: '0.0',
    },
    {
      name: 'fee',
      label: '手续费',
      type: 'number',
      required: true,
      placeholder: '0.00001',
    },
    // UTXO 链没有 nonce，但需要管理 UTXO 输入
    // 注意：UTXO 输入管理通常需要更复杂的 UI，这里先提供基础字段
  ],
  initialValues: {
    fee: '0.00001',
  },
};

/**
 * 其他链表单配置（SOL, TRON, KASPA）
 */
const BLOCKSEQ_FORM_CONFIG: ChainFormConfig = {
  fields: [
    {
      name: 'to',
      label: '收款地址',
      type: 'input',
      required: true,
      placeholder: '支持手动输入、粘贴或扫描',
    },
    {
      name: 'value',
      label: '金额',
      type: 'number',
      required: true,
      placeholder: '0.0',
    },
    // 其他链根据实际情况配置
  ],
  initialValues: {},
};

/**
 * 获取链的表单配置
 */
export function getChainFormConfig(chain: ChainType): ChainFormConfig {
  const category = getChainCategory(chain);

  switch (category) {
    case 'EVM':
      return EVM_FORM_CONFIG;
    case 'UTXO':
      return UTXO_FORM_CONFIG;
    case 'BLOCKSEQ':
      return BLOCKSEQ_FORM_CONFIG;
    default:
      return EVM_FORM_CONFIG;
  }
}
