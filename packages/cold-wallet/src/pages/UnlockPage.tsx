import { useState, useEffect } from 'react';
import { Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import useWalletStore from '../stores/useWalletStore';
import PasswordInput from '../components/PasswordInput';
import StandardCard from '../components/StandardCard';
import PrimaryButton from '../components/PrimaryButton';
import PageLayout from '../components/PageLayout';

function UnlockPage() {
  const navigate = useNavigate();
  const { setUnlocked, setMnemonic, setHasWallet } = useWalletStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasWallet, setHasWalletLocal] = useState(false);

  useEffect(() => {
    checkWalletExists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <PageLayout
      showBack={false}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <StandardCard
          style={{
            width: '100%',
            maxWidth: '400px',
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
            <div
              style={{
                fontSize: '72px',
              }}
            >
              🔒
            </div>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600, color: '#1d1d1f' }}>
                解锁钱包
              </h1>
              <p
                style={{
                  marginTop: '8px',
                  color: '#86868b',
                  fontSize: '17px',
                }}
              >
                请输入密码解锁您的钱包
              </p>
            </div>

            <PasswordInput
              placeholder="请输入密码"
              value={password}
              onChange={(val) => setPassword(val)}
              onEnterPress={handleUnlock}
              style={{
                width: '100%',
                borderRadius: '12px',
                fontSize: '17px',
              }}
            />

            <PrimaryButton loading={loading} onClick={handleUnlock}>
              解锁
            </PrimaryButton>
          </div>
        </StandardCard>
      </div>
    </PageLayout>
  );
}

export default UnlockPage;
