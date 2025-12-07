/**
 * @Author liyongjie
 * 二维码扫描组件公共样式
 */

import type { CSSProperties } from 'react';

export const containerStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  width: '100%',
  height: '100%',
};

export const headerStyle: CSSProperties = {
  padding: '12px 16px',
  zIndex: 10002,
  position: 'relative',
};

export const contentStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const scanAreaStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  maxWidth: '400px',
};

export const hintTextStyle: CSSProperties = {
  marginTop: '32px',
  color: '#fff',
  fontSize: '16px',
  textAlign: 'center',
  fontWeight: 500,
  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
};

export const errorMessageStyle: CSSProperties = {
  marginTop: '20px',
  padding: '12px 16px',
  backgroundColor: 'rgba(255, 77, 79, 0.2)',
  borderRadius: '8px',
  color: '#ff4d4f',
  fontSize: '14px',
  textAlign: 'center',
  border: '1px solid rgba(255, 77, 79, 0.3)',
  maxWidth: '320px',
};
