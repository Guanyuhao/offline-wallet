import { Card, Space, Tag, SwipeAction, Dialog } from 'antd-mobile';
import { RightOutline } from 'antd-mobile-icons';
import { CHAIN_DISPLAY_NAMES } from '@offline-wallet/shared/config';
import type { WatchAddress } from '../stores/useAddressStore';
import { formatBalanceParts } from '../utils/format';

interface AddressCardProps {
  address: WatchAddress;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  deleteText?: string;
  confirmDeleteText?: string;
}

/**
 * 地址卡片组件
 * 显示观察地址的基本信息和余额
 * 支持滑动删除
 */
function AddressCard({
  address,
  onClick,
  onDelete,
  deleteText = '删除',
  confirmDeleteText = '确定删除此地址？',
}: AddressCardProps) {
  const formatAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  // 处理删除
  const handleDelete = () => {
    Dialog.confirm({
      content: confirmDeleteText,
      onConfirm: () => {
        onDelete?.(address.id);
      },
    });
  };

  const cardContent = (
    <Card
      onClick={onClick}
      style={{
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1 }}>
          <Space style={{ marginBottom: '8px' }}>
            <Tag
              color="primary"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '6px',
              }}
            >
              {CHAIN_DISPLAY_NAMES[address.chain]}
            </Tag>
            {address.label && (
              <span style={{ fontSize: '14px', color: 'var(--app-subtitle-color)' }}>
                {address.label}
              </span>
            )}
          </Space>

          <div
            style={{
              fontSize: '15px',
              fontFamily: 'monospace',
              color: 'var(--app-title-color)',
              marginBottom: '8px',
            }}
          >
            {formatAddress(address.address)}
          </div>

          {(() => {
            const parts = formatBalanceParts(address.balance);
            const isSmall = parseFloat(address.balance || '0') < 1;
            return (
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--adm-color-primary)' }}>
                {parts.int}
                {parts.dec && (
                  <span style={isSmall ? undefined : { fontSize: '14px' }}>.{parts.dec}</span>
                )}{' '}
                {CHAIN_DISPLAY_NAMES[address.chain]}
                {!address.balance && (
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--app-subtitle-color)',
                      marginLeft: '8px',
                    }}
                  >
                    (未查询)
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        <RightOutline fontSize={20} color="var(--app-subtitle-color)" />
      </div>
    </Card>
  );

  // 如果有删除回调，则包裹 SwipeAction
  if (onDelete) {
    return (
      <SwipeAction
        rightActions={[
          {
            key: 'delete',
            text: deleteText,
            color: 'danger',
            onClick: handleDelete,
          },
        ]}
      >
        {cardContent}
      </SwipeAction>
    );
  }

  return cardContent;
}

export default AddressCard;
