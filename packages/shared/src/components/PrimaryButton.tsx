import { Button } from 'antd-mobile';
import type { ButtonProps } from 'antd-mobile/es/components/button';

export interface PrimaryButtonProps extends ButtonProps {
  /**
   * 按钮文本
   */
  children: React.ReactNode;
}

/**
 * @Author liyongjie
 * 主要按钮组件（统一按钮样式）
 */
function PrimaryButton({ children, style, ...props }: PrimaryButtonProps) {
  return (
    <Button
      {...props}
      color="primary"
      block
      style={{
        borderRadius: '12px',
        height: '50px',
        fontSize: '17px',
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </Button>
  );
}

export default PrimaryButton;
