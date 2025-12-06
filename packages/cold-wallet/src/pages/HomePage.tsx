import { useEffect, useState } from 'react';
import { Card, Button, Grid } from 'antd-mobile';
import { NavBar } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import useWalletStore from '../stores/useWalletStore';

function HomePage() {
  const navigate = useNavigate();
  const { setHasWallet } = useWalletStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkWallet = async () => {
    try {
      const exists = await invoke<boolean>('has_encrypted_mnemonic');
      setHasWallet(exists);
      if (exists) {
        // 使用 setTimeout 延迟导航，避免闪动
        setTimeout(() => {
          navigate('/unlock');
        }, 0);
      }
    } catch (error) {
      console.error('检查钱包失败:', error);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        检查中...
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f5f5f7',
      }}
    >
      {/* SafeArea 已在 AppLayout 中统一处理 */}
      <NavBar backArrow={false}>冷钱包</NavBar>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Card
          style={{
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
              alignItems: 'center',
              padding: '8px',
            }}
          >
            <div style={{ fontSize: '72px' }}>🔒</div>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600, color: '#1d1d1f' }}>
                冷钱包
              </h1>
              <p
                style={{
                  marginTop: '8px',
                  color: '#86868b',
                  fontSize: '17px',
                  lineHeight: '1.5',
                }}
              >
                完全离线的加密货币钱包
                <br />
                确保您的私钥绝对安全
              </p>
            </div>

            <Grid columns={2} gap={12} style={{ width: '100%' }}>
              <Grid.Item>
                <Button
                  color="primary"
                  block
                  size="large"
                  onClick={() => navigate('/create')}
                  style={{
                    borderRadius: '12px',
                    height: '50px',
                    fontSize: '17px',
                    fontWeight: 500,
                  }}
                >
                  创建钱包
                </Button>
              </Grid.Item>
              <Grid.Item>
                <Button
                  color="default"
                  block
                  size="large"
                  onClick={() => navigate('/import')}
                  style={{
                    borderRadius: '12px',
                    height: '50px',
                    fontSize: '17px',
                    fontWeight: 500,
                  }}
                >
                  导入钱包
                </Button>
              </Grid.Item>
            </Grid>

            <div
              style={{
                width: '100%',
                padding: '16px',
                background: '#f5f5f7',
                borderRadius: '12px',
                fontSize: '15px',
                color: '#86868b',
                lineHeight: '1.6',
              }}
            >
              <p style={{ margin: 0, fontWeight: 600, color: '#1d1d1f', marginBottom: '8px' }}>
                安全提示
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>完全离线，无网络权限</li>
                <li>私钥永不离开设备</li>
                <li>签名后立即清除内存</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default HomePage;
