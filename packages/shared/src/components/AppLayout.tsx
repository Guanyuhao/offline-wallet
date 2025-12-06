/**
 * @Author liyongjie
 * 应用级布局组件
 * 统一处理 SafeArea，所有页面自动适配安全区域
 */

import { ReactNode } from 'react';
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
    <div
      style={{
        width: '100%',
        height: '100%', // 继承父容器高度（#app 的 100%）
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // 防止整体滚动
      }}
    >
      {/* 顶部安全区域 */}
      <SafeArea position="top" />

      {/* 页面内容 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0, // 确保 flex 子元素可以正确收缩
        }}
      >
        {children}
      </div>

      {/* 底部安全区域 */}
      <SafeArea position="bottom" />
    </div>
  );
}
