/**
 * @Author liyongjie
 * 扫描内容区域组件
 *
 * 窗口模式实现原理：
 * 1. 扫描框区域（camera-hole）背景完全透明，作为"透明洞"
 * 2. 插件会把相机画面整页贴底（windowed: true）
 * 3. 只有透明区域才能看到相机画面，实现"挖空"效果
 * 4. 通过 CSS box-shadow 创建四周半透明遮罩
 * 5. ScanningFrame 显示在透明区域上方，作为视觉边框和装饰
 *
 * 注意：位置和大小完全由 CSS 控制，不需要传递给插件
 */

import React from 'react';
import ScanningFrame from '../ScanningFrame';
import { hintTextStyle } from './styles';
import ErrorMessage from './ErrorMessage';

export interface ScanContentProps {
  /**
   * 是否正在扫描
   */
  isScanning: boolean;
  /**
   * 提示文本
   */
  hint: string;
  /**
   * 错误消息
   */
  error?: string | null;
}

/**
 * 扫描内容区域组件
 */
const ScanContent: React.FC<ScanContentProps> = ({ isScanning, hint, error }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        maxWidth: '400px',
        width: '100%',
      }}
    >
      {/* 相机"透明洞"：这是唯一能看到相机画面的区域 */}
      <div
        className="camera-hole"
        style={{
          width: '280px',
          height: '280px',
          backgroundColor: 'transparent', // 关键：完全透明，让相机画面可见
          position: 'relative',
          // 使用 box-shadow 创建四周半透明遮罩（挖空效果）
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          borderRadius: '16px', // 可选：圆角
        }}
      >
        {/* 扫描框装饰：显示在透明区域上方 */}
        <ScanningFrame
          size={280}
          showScanLine={isScanning}
          scanLineColor="#1677ff"
          borderColor="#fff"
          cornerColor="#1677ff"
        />
      </div>

      {/* 提示文字 */}
      <div style={hintTextStyle}>{hint}</div>

      {/* 错误提示 */}
      {error && <ErrorMessage message={error} />}
    </div>
  );
};

export default ScanContent;
