import { useState, useEffect } from 'react';
import { Button, Card, Grid, Toast, Dialog } from 'antd-mobile';
import { NavBar, SafeArea, TabBar } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { AppOutline, PayCircleOutline, UserOutline } from 'antd-mobile-icons';
import useWalletStore from '../stores/useWalletStore';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { formatAddress, createAddressQRCode, copyToClipboard } from '../utils';

function WalletPage() {
  const navigate = useNavigate();
  const { isUnlocked, mnemonic, currentChain, address, setAddress, setUnlocked, clearMnemonic } =
    useWalletStore();
  const [showQRCode, setShowQRCode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isUnlocked || !mnemonic) {
      navigate('/unlock');
      return;
    }
    loadAddress();
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
        content: `获取地址失败: ${error}`,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLock = () => {
    Dialog.confirm({
      content: '确定要锁定钱包吗？',
      onConfirm: () => {
        clearMnemonic();
        setUnlocked(false);
        navigate('/unlock');
      },
    });
  };

  const handleShowQRCode = () => {
    if (!address) return;
    setShowQRCode(true);
  };

  const qrCodeData = address ? createAddressQRCode(currentChain, address) : '';

  return (
    <div
      style={{
        height: '100vh',
        minHeight: '-webkit-fill-available',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SafeArea position="top" />
      <NavBar
        right={
          <Button size="small" color="danger" onClick={handleLock}>
            锁定
          </Button>
        }
      >
        我的钱包
      </NavBar>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        {/* 地址卡片 */}
        <Card style={{ marginBottom: '16px' }}>
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
              <span style={{ color: '#666' }}>当前链</span>
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
                  <span style={{ color: '#666' }}>地址</span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        flex: 1,
                      }}
                    >
                      {formatAddress(address)}
                    </span>
                    <Button
                      size="small"
                      onClick={async () => {
                        const success = await copyToClipboard(address);
                        if (success) {
                          Toast.show({
                            content: '已复制',
                            position: 'top',
                          });
                        }
                      }}
                    >
                      复制
                    </Button>
                  </div>
                </div>

                <Grid columns={2} gap={8}>
                  <Grid.Item>
                    <Button color="primary" block onClick={handleShowQRCode}>
                      显示二维码
                    </Button>
                  </Grid.Item>
                  <Grid.Item>
                    <Button color="success" block onClick={() => navigate('/sign')}>
                      签名交易
                    </Button>
                  </Grid.Item>
                </Grid>
              </>
            )}

            {loading && <div style={{ textAlign: 'center', color: '#999' }}>加载中...</div>}
          </div>
        </Card>

        {/* 链选择 */}
        <Card title="选择链">
          <Grid columns={3} gap={8}>
            {(['eth', 'btc', 'sol', 'bnb', 'tron'] as const).map((chain) => (
              <Grid.Item key={chain}>
                <Button
                  color={currentChain === chain ? 'primary' : 'default'}
                  block
                  onClick={() => {
                    useWalletStore.getState().setCurrentChain(chain);
                  }}
                >
                  {chain.toUpperCase()}
                </Button>
              </Grid.Item>
            ))}
          </Grid>
        </Card>
      </div>

      {/* 二维码弹窗 */}
      {showQRCode && address && (
        <Dialog
          visible={showQRCode}
          content={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
              }}
            >
              <h3>地址二维码</h3>
              <QRCodeDisplay data={qrCodeData} size={256} />
              <p style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>{address}</p>
            </div>
          }
          closeOnAction
          onClose={() => setShowQRCode(false)}
          actions={[
            {
              key: 'close',
              text: '关闭',
            },
          ]}
        />
      )}

      <SafeArea position="bottom" />
    </div>
  );
}

export default WalletPage;
