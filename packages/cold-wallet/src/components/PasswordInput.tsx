import { useState } from 'react';
import { Input } from 'antd-mobile';
import { EyeOutline, EyeInvisibleOutline } from 'antd-mobile-icons';
import type { InputProps } from 'antd-mobile/es/components/input';

interface PasswordInputProps extends Omit<InputProps, 'type'> {
  /**
   * 是否默认显示密码
   * @default false
   */
  defaultVisible?: boolean;
}

/**
 * @Author liyongjie
 * 密码输入组件（支持显示/隐藏切换）
 */

/**
 * 密码输入组件（支持显示/隐藏切换）
 */
function PasswordInput({ defaultVisible = false, style, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(defaultVisible);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        style={{
          ...style,
          paddingRight: '40px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          color: 'var(--app-subtitle-color)',
        }}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOutline fontSize={20} /> : <EyeInvisibleOutline fontSize={20} />}
      </div>
    </div>
  );
}

export default PasswordInput;
