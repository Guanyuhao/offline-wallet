import React, { useCallback } from 'react';
import { Toast } from 'antd-mobile';
import { ContentOutline, LinkOutline } from 'antd-mobile-icons';

export interface AddressDisplayProps {
  /** 地址字符串 */
  address: string;
  /** 是否全量显示，默认 false（省略显示） */
  full?: boolean;
  /** 省略模式：'middle' 中间省略, 'end' 末尾省略，默认 'middle' */
  ellipsisMode?: 'middle' | 'end';
  /** 省略时前面保留的字符数，默认 6 */
  startLength?: number;
  /** 省略时后面保留的字符数（仅 middle 模式），默认 4 */
  endLength?: number;
  /** 兼容旧 API：chars 等同于 startLength */
  chars?: number;
  /** 是否显示复制图标，默认 true */
  copyable?: boolean;
  /** 兼容旧 API：showCopy 等同于 copyable */
  showCopy?: boolean;
  /** 复制成功的提示文本 */
  copySuccessText?: string;
  /** 字体大小，默认 14 */
  fontSize?: number;
  /** 是否使用等宽字体，默认 true */
  monospace?: boolean;
  /** 是否显示地址图标，默认 false */
  showIcon?: boolean;
  /** 单行显示，超出省略，默认 true */
  singleLine?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 点击地址文本的回调 */
  onClick?: () => void;
}

/**
 * 地址显示组件
 * 支持全量/省略显示、复制功能、单行省略等
 */
function AddressDisplay({
  address,
  full = false,
  ellipsisMode = 'middle',
  startLength,
  endLength,
  chars,
  copyable,
  showCopy,
  copySuccessText = '已复制',
  fontSize = 14,
  monospace = true,
  showIcon = false,
  singleLine = true,
  style,
  className,
  onClick,
}: AddressDisplayProps) {
  // 兼容旧 API
  const start = startLength ?? chars ?? 6;
  const end = endLength ?? 4;
  const showCopyIcon = copyable ?? showCopy ?? true;

  // 格式化显示的地址
  const displayAddress = useCallback(() => {
    if (full || !address) return address;

    const minLength = ellipsisMode === 'middle' ? start + end + 3 : start + 3;
    if (address.length <= minLength) return address;

    if (ellipsisMode === 'middle') {
      return `${address.slice(0, start)}...${address.slice(-end)}`;
    } else {
      return `${address.slice(0, start)}...`;
    }
  }, [address, full, ellipsisMode, start, end]);

  // 复制地址到剪贴板
  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      try {
        await navigator.clipboard.writeText(address);
        Toast.show({
          content: copySuccessText,
          icon: 'success',
          duration: 1500,
        });
      } catch {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = address;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          Toast.show({
            content: copySuccessText,
            icon: 'success',
            duration: 1500,
          });
        } catch {
          Toast.show({
            content: '复制失败',
            icon: 'fail',
          });
        }
        document.body.removeChild(textArea);
      }
    },
    [address, copySuccessText]
  );

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    maxWidth: '100%',
    ...style,
  };

  const textStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    fontFamily: monospace ? 'monospace' : 'inherit',
    lineHeight: 1.5,
    color: 'var(--app-title-color, #333)',
    cursor: onClick ? 'pointer' : 'default',
    ...(singleLine && full
      ? {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
        }
      : {
          wordBreak: full ? 'break-all' : 'normal',
        }),
  };

  const iconStyle: React.CSSProperties = {
    cursor: 'pointer',
    color: 'var(--app-subtitle-color, #999)',
    flexShrink: 0,
    transition: 'color 0.2s',
  };

  const addressIconStyle: React.CSSProperties = {
    color: 'var(--adm-color-primary, #1677ff)',
    flexShrink: 0,
  };

  return (
    <div className={className} style={containerStyle}>
      {showIcon && <LinkOutline fontSize={fontSize} style={addressIconStyle} />}
      <span style={textStyle} onClick={onClick} title={address}>
        {displayAddress()}
      </span>
      {showCopyIcon && (
        <ContentOutline fontSize={fontSize} style={iconStyle} onClick={handleCopy} />
      )}
    </div>
  );
}

export default AddressDisplay;
