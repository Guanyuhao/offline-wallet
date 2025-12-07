/**
 * @Author liyongjie
 * 扫描器头部组件
 */

import React from 'react';
import { Button } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { headerStyle } from './styles';

export interface ScannerHeaderProps {
  /**
   * 取消回调
   */
  onCancel: () => void;
  /**
   * 背景色（移动端需要半透明背景）
   */
  backgroundColor?: string;
}

/**
 * 扫描器头部组件
 */
const ScannerHeader: React.FC<ScannerHeaderProps> = ({
  onCancel,
  backgroundColor = 'transparent',
}) => {
  return (
    <div style={{ ...headerStyle, backgroundColor }}>
      <Button
        fill="none"
        style={{ padding: '8px', minWidth: '44px', minHeight: '44px' }}
        onClick={onCancel}
      >
        <LeftOutline fontSize={26} color="#fff" />
      </Button>
    </div>
  );
};

export default ScannerHeader;
