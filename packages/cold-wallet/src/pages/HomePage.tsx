import { useEffect, useState } from 'react';
import { Card, Button, Grid } from 'antd-mobile';
import { NavBar, SafeArea } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import useWalletStore from '../stores/useWalletStore';

function HomePage() {
  const navigate = useNavigate();
  const { hasWallet, setHasWallet } = useWalletStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    try {
      const exists = await invoke<boolean>('has_encrypted_mnemonic');
      setHasWallet(exists);
      if (exists) {
        navigate('/unlock');
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
        height: '100vh',
        minHeight: '-webkit-fill-available',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <SafeArea position="top" />
      <NavBar style={{ background: 'transparent' }}>冷钱包</NavBar>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Card>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '64px' }}>🔒</div>
            <h1 style={{ margin: 0 }}>冷钱包</h1>
            <p style={{ color: '#666', textAlign: 'center' }}>
              完全离线的加密货币钱包
              <br />
              确保您的私钥绝对安全
            </p>

            <Grid columns={2} gap={12} style={{ width: '100%' }}>
              <Grid.Item>
                <Button color="primary" block size="large" onClick={() => navigate('/create')}>
                  ✨ 创建钱包
                </Button>
              </Grid.Item>
              <Grid.Item>
                <Button color="success" block size="large" onClick={() => navigate('/import')}>
                  📥 导入钱包
                </Button>
              </Grid.Item>
            </Grid>

            <div
              style={{
                marginTop: '24px',
                padding: '16px',
                background: '#f5f5f5',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#666',
              }}
            >
              <p style={{ margin: 0, fontWeight: 'bold' }}>安全提示：</p>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>完全离线，无网络权限</li>
                <li>私钥永不离开设备</li>
                <li>签名后立即清除内存</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <SafeArea position="bottom" />
    </div>
  );
}

export default HomePage;
