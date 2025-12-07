import { ReactNode } from 'react';
import { NavBar } from 'antd-mobile';
import type { NavBarProps } from 'antd-mobile/es/components/nav-bar';

interface PageLayoutProps {
  /**
   * 页面标题
   */
  title?: string;
  /**
   * NavBar 的配置（支持自定义右侧按钮等）
   */
  navBarProps?: NavBarProps;
  /**
   * 是否显示返回按钮
   * @default true
   */
  showBack?: boolean;
  /**
   * 是否显示 NavBar
   * @default true（如果有 title 则显示，否则不显示）
   */
  showNavBar?: boolean;
  /**
   * 返回按钮点击事件
   */
  onBack?: () => void;
  /**
   * 页面内容
   */
  children: ReactNode;
  /**
   * 内容区域样式
   */
  contentStyle?: React.CSSProperties;
  /**
   * 返回按钮图标
   */
  backIcon?: React.ReactNode;
}

/**
 * @Author liyongjie
 * 页面布局组件（统一页面结构）
 */
function PageLayout({
  title,
  navBarProps,
  showBack = true,
  showNavBar,
  onBack,
  children,
  contentStyle,
}: PageLayoutProps) {
  // 如果明确指定了 showNavBar，则使用该值；否则根据是否有 title 来决定
  const shouldShowNavBar = showNavBar !== undefined ? showNavBar : !!title;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* SafeArea 已在 AppLayout 中统一处理，这里不再需要 */}
      {shouldShowNavBar && title && (
        <NavBar backIcon={showBack} onBack={onBack} {...navBarProps}>
          {title}
        </NavBar>
      )}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
          background: '#f5f5f7',
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PageLayout;
