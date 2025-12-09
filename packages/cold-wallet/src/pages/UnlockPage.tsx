import { useState, useEffect } from 'react';
import { Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import useWalletStore from '../stores/useWalletStore';
import PasswordInput from '../components/PasswordInput';
import StandardCard from '../components/StandardCard';
import PrimaryButton from '../components/PrimaryButton';
import PageLayout from '../components/PageLayout';
import { retrieveMnemonic, hasMnemonic } from '../utils/stronghold';
import { useI18n } from '../hooks/useI18n';

function UnlockPage() {
  const navigate = useNavigate();
  const { setUnlocked, setMnemonic, setHasWallet } = useWalletStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasWallet, setHasWalletLocal] = useState(false);
  const t = useI18n();

  useEffect(() => {
    checkWalletExists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkWalletExists = async () => {
    try {
      const exists = await hasMnemonic();
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
        content: t.unlock.enterPassword,
        position: 'top',
      });
      return;
    }

    try {
      setLoading(true);

      // 使用 Stronghold 验证密码并获取助记词
      const mnemonic = await retrieveMnemonic(password);

      // 设置状态
      setMnemonic(mnemonic);
      setUnlocked(true);

      Toast.show({
        content: t.unlock.unlockSuccess,
        position: 'top',
        icon: 'success',
      });

      navigate('/wallet');
    } catch (error) {
      console.error('解锁失败:', error);

      // 关闭加载提示
      Toast.clear();

      // 检查是否是密钥不匹配错误（BadFileKey）
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isBadFileKey =
        errorMessage.includes('BadFileKey') || errorMessage.includes('密钥不匹配');

      Toast.show({
        content: isBadFileKey ? t.unlock.keyMismatch : t.unlock.passwordError,
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
    <PageLayout showBack={false}>
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
              <h1
                style={{
                  margin: 0,
                  fontSize: '28px',
                  fontWeight: 600,
                  color: 'var(--app-title-color)',
                }}
              >
                {t.unlock.title}
              </h1>
              <p
                style={{
                  marginTop: '8px',
                  color: 'var(--app-subtitle-color)',
                  fontSize: '17px',
                }}
              >
                {t.unlock.enterPasswordPrompt}
              </p>
            </div>

            <PasswordInput
              placeholder={t.unlock.passwordPlaceholder}
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
              {t.unlock.unlockButton}
            </PrimaryButton>
          </div>
        </StandardCard>
      </div>
    </PageLayout>
  );
}

export default UnlockPage;
