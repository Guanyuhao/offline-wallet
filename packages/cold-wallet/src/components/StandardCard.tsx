import { Card } from 'antd-mobile';
import { ReactNode } from 'react';

interface StandardCardProps {
  /**
   * 卡片内容
   */
  children: ReactNode;
  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
  /**
   * 卡片标题
   */
  title?: string;
}

/**
 * @Author liyongjie
 * 标准卡片组件（统一卡片样式）
 */
function StandardCard({ children, style, title }: StandardCardProps) {
  return (
    <Card
      title={title}
      style={{
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        ...style,
      }}
    >
      {children}
    </Card>
  );
}

export default StandardCard;
