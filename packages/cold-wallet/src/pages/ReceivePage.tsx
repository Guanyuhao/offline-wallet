/**
 * @Author
 * 收款页面
 */

import { useEffect } from 'react';
import { Button, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import useWalletStore from '../stores/useWalletStore';
import QRCodeCard from '../components/QRCodeCard';
import { createAddressQRCode } from '@offline-wallet/shared/utils';
import { copyToClipboard } from '../utils';
import PageLayout from '../components/PageLayout';
import StandardCard from '../components/StandardCard';
import AddressDisplay from '../components/AddressDisplay';

function ReceivePage() {
  const navigate = useNavigate();
  const { isUnlocked, mnemonic, currentChain, address } = useWalletStore();

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
        content: '地址已复制',
        position: 'top',
        icon: 'success',
      });
    }
  };

  return (
    <PageLayout title="收款" onBack={() => navigate(-1)}>
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
            size={240}
            title="收款地址"
            description={currentChain.toUpperCase()}
            variant="simple"
          />

          <div
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#f5f5f7',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: '#86868b',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              地址
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
            复制地址
          </Button>
        </div>
      </StandardCard>
    </PageLayout>
  );
}

export default ReceivePage;
