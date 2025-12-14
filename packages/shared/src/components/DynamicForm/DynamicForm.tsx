/**
 * @Author liyongjie
 * 元数据驱动的动态表单组件
 */

import { Form, Button, Skeleton } from 'antd-mobile';
import type { DynamicFormProps, FormFieldSchema } from './types';
import { DEFAULT_FORM_TEXTS } from './types';
import DynamicFormField from './DynamicFormField';

/**
 * 字段分组
 */
interface FieldGroup {
  title?: string;
  refreshable?: boolean;
  fields: FormFieldSchema[];
}

/**
 * 将字段按分组整理
 */
function groupFields(fields: FormFieldSchema[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  let currentGroup: FieldGroup | null = null;

  for (const field of fields) {
    if (field.groupTitle) {
      // 开始新分组
      currentGroup = {
        title: field.groupTitle,
        refreshable: field.groupRefreshable,
        fields: [field],
      };
      groups.push(currentGroup);
    } else if (currentGroup) {
      // 继续当前分组
      currentGroup.fields.push(field);
    } else {
      // 无分组的字段，创建默认分组
      groups.push({ fields: [field] });
    }
  }

  return groups;
}

/**
 * 动态表单组件
 */
function DynamicForm({
  schema,
  form,
  chain,
  readOnly = false,
  onPaste,
  onScan,
  onRefresh,
  onValuesChange,
  onSubmit,
  loading = false,
  refreshLoading = false,
  texts,
}: DynamicFormProps) {
  const mergedTexts = { ...DEFAULT_FORM_TEXTS, ...texts };

  // 过滤隐藏字段
  const visibleFields = schema.fields.filter((field) => {
    if (typeof field.hidden === 'function') {
      return !field.hidden(form.getFieldsValue(), chain);
    }
    return !field.hidden;
  });

  // 分组字段
  const fieldGroups = groupFields(visibleFields);

  // 渲染分组头部
  const renderGroupHeader = (group: FieldGroup) => {
    if (!group.title) return null;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--app-subtitle-color)' }}>{group.title}</span>
        {group.refreshable && onRefresh && (
          <Button size="mini" onClick={onRefresh} loading={refreshLoading}>
            {mergedTexts.refresh}
          </Button>
        )}
      </div>
    );
  };

  // 渲染字段
  const renderFields = (fields: FormFieldSchema[]) => {
    if (refreshLoading) {
      return <Skeleton.Paragraph lineCount={fields.length} animated />;
    }

    return fields.map((field) => (
      <DynamicFormField
        key={field.name}
        field={field}
        readOnly={readOnly}
        texts={mergedTexts}
        onPaste={onPaste}
        onScan={onScan}
      />
    ));
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={onValuesChange}
      footer={
        schema.showSubmit !== false && onSubmit ? (
          <Button
            block
            type="submit"
            color="primary"
            size="large"
            loading={loading}
            onClick={onSubmit}
            style={{ borderRadius: '12px', height: '50px', fontSize: '17px' }}
          >
            {schema.submitText || mergedTexts.submit}
          </Button>
        ) : null
      }
    >
      {fieldGroups.map((group, index) => (
        <div key={index}>
          {renderGroupHeader(group)}
          {renderFields(group.fields)}
        </div>
      ))}
    </Form>
  );
}

export default DynamicForm;
