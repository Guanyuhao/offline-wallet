import { Button, Empty } from 'antd-mobile';
import { AddOutline, ScanningOutline, SetOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { PageLayout, StandardCard } from '@offline-wallet/shared/components';
import { useI18n } from '../hooks/useI18n';
import useAddressStore from '../stores/useAddressStore';
import AddressCard from '../components/AddressCard';

function HomePage() {
  const t = useI18n();
  const navigate = useNavigate();
  const { addresses, removeAddress } = useAddressStore();

  const handleAddAddress = () => {
    navigate('/watch-address');
  };

  const handleScanQRCode = () => {
    navigate('/watch-address?tab=qr');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleViewAddress = (id: string) => {
    navigate(`/address/${id}`);
  };

  return (
    <PageLayout
      title={t.home.title}
      showBack={false}
      right={<SetOutline fontSize={24} onClick={handleSettings} style={{ cursor: 'pointer' }} />}
      contentStyle={{
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '100px', // 为 footer 留空间
      }}
    >
      {/* 地址列表区域 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {addresses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onClick={() => handleViewAddress(addr.id)}
                onDelete={removeAddress}
                deleteText={t.common.delete || '删除'}
                confirmDeleteText={t.addressDetail.confirmRemove}
              />
            ))}
          </div>
        ) : (
          <StandardCard>
            <Empty
              style={{ padding: '60px 0' }}
              imageStyle={{ width: 128 }}
              description={
                <div>
                  <div style={{ marginBottom: '8px', fontWeight: 500 }}>{t.home.noAddress}</div>
                  <div style={{ fontSize: '13px', color: 'var(--app-subtitle-color)' }}>
                    {t.home.noAddressDesc}
                  </div>
                </div>
              }
            />
          </StandardCard>
        )}
      </div>

      {/* 固定底部 Footer */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 20px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          background: 'var(--adm-color-background)',
          borderTop: '1px solid var(--adm-color-border)',
          display: 'flex',
          gap: '12px',
        }}
      >
        <Button
          color="primary"
          block
          size="large"
          onClick={handleAddAddress}
          style={{ borderRadius: '12px', height: '50px', fontSize: '16px', flex: 1 }}
        >
          <AddOutline fontSize={18} style={{ marginRight: '6px' }} />
          {t.home.addAddress}
        </Button>
        <Button
          block
          size="large"
          onClick={handleScanQRCode}
          style={{ borderRadius: '12px', height: '50px', fontSize: '16px', flex: 1 }}
        >
          <ScanningOutline fontSize={18} style={{ marginRight: '6px' }} />
          {t.home.scanQRCode}
        </Button>
      </div>
    </PageLayout>
  );
}

export default HomePage;
