/**
 * @Author liyongjie
 * 动态表单字段组件
 */

import { Form, Input, Button } from 'antd-mobile';
import { ScanningOutline, TextOutline } from 'antd-mobile-icons';
import type { FormFieldSchema, DynamicFormTexts, FieldAction } from './types';
import { DEFAULT_FORM_TEXTS } from './types';

interface DynamicFormFieldProps {
  field: FormFieldSchema;
  readOnly?: boolean;
  texts?: DynamicFormTexts;
  onPaste?: (fieldName: string) => void;
  onScan?: (fieldName: string) => void;
  onMax?: (fieldName: string) => void;
}

/**
 * 渲染字段动作按钮
 */
function FieldActions({
  actions,
  fieldName,
  texts,
  onPaste,
  onScan,
  onMax,
}: {
  actions: FieldAction[];
  fieldName: string;
  texts: DynamicFormTexts;
  onPaste?: (fieldName: string) => void;
  onScan?: (fieldName: string) => void;
  onMax?: (fieldName: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {actions.includes('paste') && onPaste && (
        <Button
          size="mini"
          onClick={() => onPaste(fieldName)}
          style={{ fontSize: '12px', padding: '2px 8px' }}
        >
          <TextOutline style={{ marginRight: '2px' }} />
          {texts.paste}
        </Button>
      )}
      {actions.includes('scan') && onScan && (
        <Button
          size="mini"
          onClick={() => onScan(fieldName)}
          style={{ fontSize: '12px', padding: '2px 8px' }}
        >
          <ScanningOutline style={{ marginRight: '2px' }} />
          {texts.scan}
        </Button>
      )}
      {actions.includes('max') && onMax && (
        <Button
          size="mini"
          onClick={() => onMax(fieldName)}
          style={{ fontSize: '12px', padding: '2px 8px' }}
        >
          {texts.max}
        </Button>
      )}
    </div>
  );
}

/**
 * 动态表单字段
 */
function DynamicFormField({
  field,
  readOnly = false,
  texts = DEFAULT_FORM_TEXTS,
  onPaste,
  onScan,
  onMax,
}: DynamicFormFieldProps) {
  const mergedTexts = { ...DEFAULT_FORM_TEXTS, ...texts };
  const hasActions = field.actions && field.actions.length > 0 && !readOnly;

  // 构建 label
  const renderLabel = () => {
    if (!hasActions) {
      return field.suffix ? `${field.label} (${field.suffix})` : field.label;
    }

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <span>{field.suffix ? `${field.label} (${field.suffix})` : field.label}</span>
        <FieldActions
          actions={field.actions!}
          fieldName={field.name}
          texts={mergedTexts}
          onPaste={onPaste}
          onScan={onScan}
          onMax={onMax}
        />
      </div>
    );
  };

  // 构建输入组件
  const renderInput = () => {
    const baseStyle = { fontSize: '14px' };
    const isReadOnly = readOnly || field.readOnly;

    switch (field.type) {
      case 'address':
      case 'text':
        return <Input placeholder={field.placeholder} style={baseStyle} readOnly={isReadOnly} />;

      case 'amount':
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            style={baseStyle}
            readOnly={isReadOnly}
          />
        );

      case 'textarea':
        return (
          <Input
            placeholder={field.placeholder}
            style={{ ...baseStyle, minHeight: '80px' }}
            readOnly={isReadOnly}
          />
        );

      default:
        return <Input placeholder={field.placeholder} style={baseStyle} readOnly={isReadOnly} />;
    }
  };

  // 构建验证规则
  const rules = field.required
    ? [{ required: true, message: field.requiredMessage || `请输入${field.label}` }]
    : [];

  return (
    <Form.Item label={renderLabel()} name={field.name} rules={rules}>
      {renderInput()}
    </Form.Item>
  );
}

export default DynamicFormField;
