import { useState, useEffect } from 'react';
import { Button, Card, Input, Toast } from 'antd-mobile';
import { NavBar, SafeArea } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import useWalletStore from '../stores/useWalletStore';

function UnlockPage() {
  const navigate = useNavigate();
  const { setUnlocked, setMnemonic, setHasWallet } = useWalletStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasWallet, setHasWalletLocal] = useState(false);

  useEffect(() => {
    checkWalletExists();
  }, []);

  const checkWalletExists = async () => {
    try {
      const exists = await invoke<boolean>('has_encrypted_mnemonic');
      setHasWalletLocal(exists);
      setHasWallet(exists);
      if (!exists) {
        // 如果没有钱包，跳转到首页
        navigate('/');
      }
    } catch (error) {
      console.error('检查钱包失败:', error);
    }
  };

  const handleUnlock = async () => {
    if (!password) {
      Toast.show({
        content: '请输入密码',
        position: 'top',
      });
      return;
    }

    try {
      setLoading(true);
      // 验证密码并获取助记词
      const mnemonic = await invoke<string>('retrieve_encrypted_mnemonic', {
        password,
      });

      // 设置状态
      setMnemonic(mnemonic);
      setUnlocked(true);

      Toast.show({
        content: '解锁成功',
        position: 'top',
        icon: 'success',
      });

      navigate('/wallet');
    } catch (error) {
      Toast.show({
        content: '密码错误',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasWallet) {
    return null;
  }

  return (
    <div
      style={{
        height: '100vh',
        minHeight: '-webkit-fill-available',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <SafeArea position="top" />

      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: '64px',
            }}
          >
            🔒
          </div>
          <h1>解锁钱包</h1>
          <p style={{ color: '#666', textAlign: 'center' }}>请输入密码解锁您的钱包</p>

          <Input
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(val) => setPassword(val)}
            onEnterPress={handleUnlock}
            style={{ width: '100%' }}
          />

          <Button color="primary" block loading={loading} onClick={handleUnlock}>
            解锁
          </Button>
        </div>
      </Card>

      <SafeArea position="bottom" />
    </div>
  );
}

export default UnlockPage;
