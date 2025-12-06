import { Button, Toast } from 'antd-mobile';
import { formatAddress } from '@offline-wallet/shared/utils';
import { copyToClipboard } from '../utils';

interface AddressDisplayProps {
  /**
   * 地址
   */
  address: string;
  /**
   * 地址显示格式（开始长度，结束长度）
   */
  startLength?: number;
  endLength?: number;
  /**
   * 是否显示复制按钮
   * @default true
   */
  showCopy?: boolean;
  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
}

/**
 * @Author liyongjie
 * 地址显示组件（支持格式化显示和复制功能）
 */
function AddressDisplay({
  address,
  startLength = 6,
  endLength = 4,
  showCopy = true,
  style,
}: AddressDisplayProps) {
  const handleCopy = async () => {
    const success = await copyToClipboard(address);
    if (success) {
      Toast.show({
        content: '已复制',
        position: 'top',
      });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          flex: 1,
          fontSize: '15px',
        }}
      >
        {formatAddress(address, startLength, endLength)}
      </span>
      {showCopy && (
        <Button size="small" onClick={handleCopy}>
          复制
        </Button>
      )}
    </div>
  );
}

export default AddressDisplay;
