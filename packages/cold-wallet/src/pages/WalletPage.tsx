import { useState, useEffect } from 'react';
import { Button, Grid, Toast, Dialog, Space } from 'antd-mobile';
import {
  ReceivePaymentOutline,
  HandPayCircleOutline,
  LockOutline,
  SetOutline,
} from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { PageLayout, StandardCard, AddressDisplay } from '@offline-wallet/shared/components';
import useWalletStore from '../stores/useWalletStore';
import { ChainType, SUPPORTED_CHAINS, CHAIN_DISPLAY_NAMES } from '../config/chainConfig';
import { useI18n } from '../hooks/useI18n';

function WalletPage() {
  const navigate = useNavigate();
  const { isUnlocked, mnemonic, currentChain, address, setAddress, setUnlocked, clearMnemonic } =
    useWalletStore();
  const [loading, setLoading] = useState(false);
  const t = useI18n();

  useEffect(() => {
    if (!isUnlocked || !mnemonic) {
      navigate('/unlock');
      return;
    }
    loadAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked, mnemonic, currentChain]);

  const loadAddress = async () => {
    if (!mnemonic) return;

    try {
      setLoading(true);
      const addr = await invoke<string>('derive_address', {
        chain: currentChain,
        mnemonic,
        derivationPath: null,
      });
      setAddress(addr);
    } catch (error) {
      Toast.show({
        content: `${t.wallet.getAddressFailed} ${error}`,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChainChange = (chain: ChainType) => {
    // 如果选择的是当前链，直接返回，避免不必要的更新
    if (chain === currentChain) {
      return;
    }
    // 直接更新状态，React 会自动批处理更新
    useWalletStore.getState().setCurrentChain(chain);
  };

  const handleLock = () => {
    Dialog.confirm({
      content: t.wallet.confirmLock,
      onConfirm: () => {
        clearMnemonic();
        setUnlocked(false);
        navigate('/unlock');
      },
    });
  };

  const handleShowQRCode = () => {
    if (!address) return;
    navigate('/receive');
  };

  return (
    <PageLayout
      title={t.wallet.myWallet}
      showBack={false}
      navBarProps={{
        right: (
          <Button size="small" color="warning" onClick={handleLock}>
            <Space>
              <LockOutline fontSize={16} />
              <span>{t.wallet.lock}</span>
            </Space>
          </Button>
        ),
      }}
    >
      {/* 地址卡片 */}
      <StandardCard
        style={{
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#666' }}>{t.wallet.currentChain}</span>
            <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{currentChain}</span>
          </div>

          {address && (
            <>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <span style={{ color: 'var(--app-subtitle-color)', fontSize: '15px' }}>
                  {t.wallet.address}
                </span>
                <AddressDisplay address={address} />
              </div>

              <Grid columns={2} gap={8}>
                <Grid.Item>
                  <Button
                    color="primary"
                    block
                    onClick={handleShowQRCode}
                    style={{
                      borderRadius: '12px',
                      height: '44px',
                      fontSize: '16px',
                    }}
                  >
                    <Space>
                      <ReceivePaymentOutline />
                      <span>{t.wallet.receivePayment}</span>
                    </Space>
                  </Button>
                </Grid.Item>
                <Grid.Item>
                  <Button
                    color="default"
                    block
                    onClick={() => navigate('/sign')}
                    style={{
                      borderRadius: '12px',
                      height: '44px',
                      fontSize: '16px',
                    }}
                  >
                    <Space>
                      <HandPayCircleOutline />
                      <span>{t.wallet.signTransaction}</span>
                    </Space>
                  </Button>
                </Grid.Item>
              </Grid>
            </>
          )}

          {loading && <div style={{ textAlign: 'center', color: '#999' }}>{t.wallet.loading}</div>}
        </div>
      </StandardCard>

      {/* 链选择 */}
      <StandardCard
        title={t.wallet.selectChain}
        style={{
          marginTop: '16px',
        }}
      >
        <Grid columns={3} gap={8}>
          {SUPPORTED_CHAINS.map((chain) => (
            <Grid.Item key={chain}>
              <Button
                color={currentChain === chain ? 'primary' : 'default'}
                block
                onClick={() => handleChainChange(chain)}
                style={{
                  borderRadius: '8px',
                  height: '44px',
                  fontSize: '14px',
                  fontWeight: currentChain === chain ? '600' : '400',
                }}
              >
                {CHAIN_DISPLAY_NAMES[chain]}
              </Button>
            </Grid.Item>
          ))}
        </Grid>
      </StandardCard>

      {/* 设置入口 */}
      <StandardCard
        style={{
          marginTop: '16px',
        }}
      >
        <Button
          block
          onClick={() => navigate('/settings')}
          style={{
            borderRadius: '12px',
            height: '50px',
            fontSize: '18px',
          }}
        >
          <Space>
            <SetOutline />
            <span>{t.wallet.settings}</span>
          </Space>
        </Button>
      </StandardCard>
    </PageLayout>
  );
}

export default WalletPage;
