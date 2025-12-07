/**
 * @Author liyongjie
 * 应用级布局组件
 * 统一处理 SafeArea，所有页面自动适配安全区域
 */

import { ReactNode, Fragment } from 'react';
import { SafeArea } from 'antd-mobile';

export interface AppLayoutProps {
  /**
   * 子组件内容
   */
  children: ReactNode;
}

/**
 * 应用级布局组件
 * 在 App 级别统一处理 SafeArea，确保所有页面都能正确适配安全区域
 */
export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <Fragment>
      {/* 顶部安全区域 */}
      <SafeArea position="top" />

      {/* 页面内容 */}
      <div
        className="layout-content"
        style={{
          overflow: 'hidden',
          height: '100%',
          width: '100%',
          position: 'relative',
        }}
      >
        {children}
      </div>

      {/* 底部安全区域 */}
      <SafeArea position="bottom" />
    </Fragment>
  );
}
