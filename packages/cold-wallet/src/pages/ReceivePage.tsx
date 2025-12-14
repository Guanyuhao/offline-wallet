/**
 * @Author
 * 收款页面
 */

import { useEffect } from 'react';
import { Button, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import {
  PageLayout,
  StandardCard,
  QRCodeCard,
  AddressDisplay,
} from '@offline-wallet/shared/components';
import { createAddressQRCode, copyToClipboard } from '@offline-wallet/shared/utils';
import useWalletStore from '../stores/useWalletStore';
import { useI18n } from '../hooks/useI18n';

// 计算响应式二维码尺寸（收款地址数据量小，可以稍小）
function getQRCodeSize() {
  const screenWidth = window.innerWidth;
  const maxSize = Math.min(screenWidth - 100, 260);
  return Math.max(maxSize, 180); // 最小 180px，最大 260px
}

function ReceivePage() {
  const navigate = useNavigate();
  const { isUnlocked, mnemonic, currentChain, address } = useWalletStore();
  const t = useI18n();
  const qrSize = getQRCodeSize();

  useEffect(() => {
    if (!isUnlocked || !mnemonic) {
      navigate('/unlock');
      return;
    }
  }, [isUnlocked, mnemonic, navigate]);

  if (!address) {
    return null;
  }

  const qrCodeData = createAddressQRCode(address);

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(address);
    if (success) {
      Toast.show({
        content: t.receive.addressCopied,
        position: 'top',
        icon: 'success',
      });
    }
  };

  return (
    <PageLayout title={t.receive.title} onBack={() => navigate(-1)}>
      <StandardCard>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          <QRCodeCard
            data={qrCodeData}
            size={qrSize}
            title={t.receive.receiveTitle}
            description={currentChain.toUpperCase()}
            variant="simple"
          />

          <div
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--adm-color-fill-content)',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--app-subtitle-color)',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              {t.receive.addressLabel}
            </p>
            <AddressDisplay address={address} />
          </div>

          <Button
            color="primary"
            block
            onClick={handleCopyAddress}
            style={{
              borderRadius: '12px',
              height: '50px',
              fontSize: '17px',
              fontWeight: 500,
            }}
          >
            {t.receive.copyAddress}
          </Button>
        </div>
      </StandardCard>
    </PageLayout>
  );
}

export default ReceivePage;
