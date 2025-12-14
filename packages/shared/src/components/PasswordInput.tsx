/**
 * @Author liyongjie
 * 密码输入组件（支持显示/隐藏切换）
 * 可在冷钱包和热钱包中复用
 */

import { useState } from 'react';
import { Input } from 'antd-mobile';
import { EyeOutline, EyeInvisibleOutline } from 'antd-mobile-icons';
import type { InputProps } from 'antd-mobile/es/components/input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  /**
   * 是否默认显示密码
   * @default false
   */
  defaultVisible?: boolean;
  /**
   * 回车键按下时的回调
   */
  onEnterPress?: () => void;
}

/**
 * 密码输入组件（支持显示/隐藏切换）
 */
function PasswordInput({
  defaultVisible = false,
  style,
  onEnterPress,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(defaultVisible);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onEnterPress) {
      onEnterPress();
    }
  };

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
        onKeyDown={handleKeyDown}
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
