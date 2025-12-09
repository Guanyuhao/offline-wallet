import { useState } from 'react';
import { TextArea, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import useWalletStore from '../stores/useWalletStore';
import PasswordInput from '../components/PasswordInput';
import PageLayout from '../components/PageLayout';
import StandardCard from '../components/StandardCard';
import PrimaryButton from '../components/PrimaryButton';
import { storeMnemonic } from '../utils/stronghold';
import { useI18n } from '../hooks/useI18n';

function ImportWalletPage() {
  const navigate = useNavigate();
  const { setHasWallet, setMnemonic } = useWalletStore();
  const [mnemonic, setMnemonicLocal] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const t = useI18n();

  const handleImport = async () => {
    // 验证助记词
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      Toast.show({
        content: t.importWallet.invalidWordCount,
        position: 'top',
      });
      return;
    }

    try {
      // 验证助记词格式
      const isValid = await invoke<boolean>('validate_mnemonic', {
        mnemonic: mnemonic.trim(),
      });

      if (!isValid) {
        Toast.show({
          content: t.importWallet.invalidMnemonic,
          position: 'top',
        });
        return;
      }
    } catch (error) {
      Toast.show({
        content: `${t.importWallet.verificationFailed} ${error}`,
        position: 'top',
      });
      return;
    }

    if (!password || password.length < 8) {
      Toast.show({
        content: t.createWallet.passwordTooShort,
        position: 'top',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        content: t.createWallet.passwordMismatch,
        position: 'top',
      });
      return;
    }

    try {
      setLoading(true);

      // 使用 Stronghold 存储加密的助记词
      await storeMnemonic(mnemonic.trim(), password);

      // 设置钱包状态
      setHasWallet(true);
      setMnemonic(mnemonic.trim());

      Toast.show({
        content: t.importWallet.importSuccess,
        position: 'top',
        icon: 'success',
      });

      navigate('/wallet');
    } catch (error) {
      console.error('导入失败:', error);
      Toast.show({
        content: `${t.importWallet.importFailed} ${error instanceof Error ? error.message : String(error)}`,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title={t.importWallet.title} onBack={() => navigate(-1)}>
      <StandardCard>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <h2>{t.importWallet.title}</h2>
          <p style={{ color: 'var(--app-subtitle-color)' }}>{t.importWallet.importDescription}</p>

          <TextArea
            placeholder={t.importWallet.mnemonicInputPlaceholder}
            value={mnemonic}
            onChange={(val) => setMnemonicLocal(val)}
            rows={4}
            style={{ fontFamily: 'monospace', borderRadius: '12px', fontSize: '17px' }}
          />

          <PasswordInput
            placeholder={t.importWallet.passwordInputPlaceholder}
            value={password}
            onChange={(val) => setPassword(val)}
            style={{
              borderRadius: '12px',
              fontSize: '17px',
            }}
          />

          <PasswordInput
            placeholder={t.createWallet.confirmPasswordInputPlaceholder}
            value={confirmPassword}
            onChange={(val) => setConfirmPassword(val)}
            style={{
              borderRadius: '12px',
              fontSize: '17px',
            }}
          />

          <PrimaryButton loading={loading} onClick={handleImport}>
            {t.importWallet.importButton}
          </PrimaryButton>
        </div>
      </StandardCard>
    </PageLayout>
  );
}

export default ImportWalletPage;
