/**
 * @Author liyongjie
 * 元数据驱动表单 - 类型定义
 */

import type { ChainType } from '../../config/chainConfig';

/**
 * 表单字段类型
 */
export type FieldType =
  | 'address' // 地址输入（支持粘贴、扫描）
  | 'amount' // 金额输入
  | 'number' // 数字输入
  | 'text' // 文本输入
  | 'textarea' // 多行文本
  | 'select' // 下拉选择
  | 'chain'; // 链选择

/**
 * 字段动作类型
 */
export type FieldAction = 'paste' | 'scan' | 'refresh' | 'max';

/**
 * 表单字段 Schema
 */
export interface FormFieldSchema {
  /** 字段名 */
  name: string;
  /** 字段类型 */
  type: FieldType;
  /** 字段标签 */
  label: string;
  /** 占位符 */
  placeholder?: string;
  /** 是否必填 */
  required?: boolean;
  /** 必填错误提示 */
  requiredMessage?: string;
  /** 支持的动作（粘贴、扫描等） */
  actions?: FieldAction[];
  /** 是否只读 */
  readOnly?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 后缀（如单位） */
  suffix?: string;
  /** 是否隐藏（根据条件） */
  hidden?: boolean | ((values: any, chain?: ChainType) => boolean);
  /** 验证规则 */
  rules?: Array<{
    pattern?: RegExp;
    message?: string;
    validator?: (value: any) => Promise<boolean> | boolean;
  }>;
  /** 分组标题（用于字段分组） */
  groupTitle?: string;
  /** 分组是否可刷新 */
  groupRefreshable?: boolean;
}

/**
 * 表单 Schema
 */
export interface FormSchema {
  /** 表单字段列表 */
  fields: FormFieldSchema[];
  /** 提交按钮文本 */
  submitText?: string;
  /** 是否显示提交按钮 */
  showSubmit?: boolean;
}

/**
 * 动态表单 Props
 */
export interface DynamicFormProps {
  /** 表单 Schema */
  schema: FormSchema;
  /** 表单实例 */
  form: any;
  /** 当前链类型 */
  chain?: ChainType;
  /** 是否只读 */
  readOnly?: boolean;
  /** 粘贴回调 */
  onPaste?: (fieldName: string) => void;
  /** 扫描回调 */
  onScan?: (fieldName: string) => void;
  /** 刷新回调（用于 Gas 参数等） */
  onRefresh?: () => void;
  /** 表单值变化回调 */
  onValuesChange?: (changedValues: any, allValues: any) => void;
  /** 提交回调 */
  onSubmit?: (values: any) => void;
  /** 是否正在加载 */
  loading?: boolean;
  /** 刷新是否正在加载 */
  refreshLoading?: boolean;
  /** 国际化文本 */
  texts?: DynamicFormTexts;
}

/**
 * 国际化文本
 */
export interface DynamicFormTexts {
  paste?: string;
  scan?: string;
  refresh?: string;
  max?: string;
  submit?: string;
}

/**
 * 默认国际化文本
 */
export const DEFAULT_FORM_TEXTS: DynamicFormTexts = {
  paste: '粘贴',
  scan: '扫描',
  refresh: '刷新',
  max: '最大',
  submit: '提交',
};
