/**
 * @Author liyongjie
 * 扫描框组件
 * 专业的二维码扫描框 UI，带扫描线动画
 */

import React from 'react';
import './ScanningFrame.css';

export interface ScanningFrameProps {
  /**
   * 扫描框尺寸（px）
   */
  size?: number;
  /**
   * 是否显示扫描线动画
   */
  showScanLine?: boolean;
  /**
   * 扫描线颜色
   */
  scanLineColor?: string;
  /**
   * 边框颜色
   */
  borderColor?: string;
  /**
   * 角装饰颜色
   */
  cornerColor?: string;
}

/**
 * 扫描框组件
 */
export default function ScanningFrame({
  size = 280,
  showScanLine = true,
  scanLineColor = '#1677ff',
  borderColor = '#fff',
  cornerColor = '#1677ff',
}: ScanningFrameProps) {
  return (
    <div
      className="scanning-frame"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
      }}
    >
      {/* 边框 */}
      <div
        className="scanning-frame-border"
        style={{
          width: '100%',
          height: '100%',
          border: `2px solid ${borderColor}`,
          borderRadius: '16px',
          position: 'relative',
          backgroundColor: 'transparent',
        }}
      >
        {/* 四个角的装饰 */}
        <div
          className="scanning-frame-corner scanning-frame-corner-tl"
          style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            width: '40px',
            height: '40px',
            borderTop: `4px solid ${cornerColor}`,
            borderLeft: `4px solid ${cornerColor}`,
            borderTopLeftRadius: '16px',
          }}
        />
        <div
          className="scanning-frame-corner scanning-frame-corner-tr"
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '40px',
            height: '40px',
            borderTop: `4px solid ${cornerColor}`,
            borderRight: `4px solid ${cornerColor}`,
            borderTopRightRadius: '16px',
          }}
        />
        <div
          className="scanning-frame-corner scanning-frame-corner-bl"
          style={{
            position: 'absolute',
            bottom: '-2px',
            left: '-2px',
            width: '40px',
            height: '40px',
            borderBottom: `4px solid ${cornerColor}`,
            borderLeft: `4px solid ${cornerColor}`,
            borderBottomLeftRadius: '16px',
          }}
        />
        <div
          className="scanning-frame-corner scanning-frame-corner-br"
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '40px',
            height: '40px',
            borderBottom: `4px solid ${cornerColor}`,
            borderRight: `4px solid ${cornerColor}`,
            borderBottomRightRadius: '16px',
          }}
        />

        {/* 扫描线动画 */}
        {showScanLine && (
          <div
            className="scanning-frame-line"
            style={{
              position: 'absolute',
              left: '0',
              right: '0',
              height: '2px',
              background: `linear-gradient(to bottom, transparent, ${scanLineColor}, transparent)`,
              animation: 'scanning-line 2s linear infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}
