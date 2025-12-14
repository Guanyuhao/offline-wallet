import { useState } from 'react';
import { Toast, Radio, Checkbox, Button } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { PageLayout, StandardCard, PrimaryButton } from '@offline-wallet/shared/components';
import { copyToClipboard } from '@offline-wallet/shared/utils';
import useWalletStore from '../stores/useWalletStore';
import PasswordInput from '../components/PasswordInput';
import { storeMnemonic } from '../utils/stronghold';
import { useI18n } from '../hooks/useI18n';

function CreateWalletPage() {
  const navigate = useNavigate();
  const { setHasWallet, setMnemonic } = useWalletStore();
  const [step, setStep] = useState<'generate' | 'backup' | 'password'>('generate');
  const [mnemonic, setMnemonicLocal] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const t = useI18n();

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const generated = await invoke<string>('generate_mnemonic', {
        wordCount,
      });
      setMnemonicLocal(generated);
      setStep('backup');
    } catch (error) {
      Toast.show({
        content: `${t.createWallet.generateFailed} ${error}`,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackupComplete = () => {
    if (!backupConfirmed) {
      Toast.show({
        content: t.createWallet.confirmBackup,
        position: 'top',
      });
      return;
    }
    setStep('password');
  };

  const handleCopyMnemonic = async () => {
    const success = await copyToClipboard(mnemonic);
    if (success) {
      Toast.show({
        content: t.createWallet.copiedToClipboard,
        position: 'top',
      });
    }
  };

  const handleCreateWallet = async () => {
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
      await storeMnemonic(mnemonic, password);

      // 设置钱包状态
      setHasWallet(true);
      setMnemonic(mnemonic);

      Toast.show({
        content: t.createWallet.createSuccess,
        position: 'top',
        icon: 'success',
      });

      navigate('/wallet');
    } catch (error) {
      Toast.show({
        content: `创建失败: ${error}`,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title={t.createWallet.title} onBack={() => navigate(-1)}>
      {step === 'generate' && (
        <StandardCard>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'var(--app-title-color)',
                }}
              >
                {t.createWallet.createNewWallet}
              </h2>
              <p
                style={{
                  marginTop: '8px',
                  color: 'var(--app-subtitle-color)',
                  fontSize: '15px',
                  lineHeight: '1.5',
                }}
              >
                {t.createWallet.selectWordCount}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: 'var(--app-title-color)',
                  marginBottom: '8px',
                }}
              >
                {t.createWallet.wordCount}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <Radio.Group value={wordCount} onChange={(val) => setWordCount(val as 12 | 24)}>
                  <Radio
                    value={12}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background:
                        wordCount === 12
                          ? 'var(--app-highlight-background)'
                          : 'var(--adm-color-fill-content)',
                      border:
                        wordCount === 12
                          ? '2px solid var(--adm-color-primary)'
                          : '2px solid transparent',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <span style={{ fontSize: '17px', fontWeight: 500 }}>
                        {t.createWallet.wordCount12}
                      </span>
                      <span style={{ fontSize: '14px', color: 'var(--app-subtitle-color)' }}>
                        {t.createWallet.wordCount12Desc}
                      </span>
                    </div>
                  </Radio>
                  <Radio
                    value={24}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background:
                        wordCount === 24
                          ? 'var(--app-highlight-background)'
                          : 'var(--adm-color-fill-content)',
                      border:
                        wordCount === 24
                          ? '2px solid var(--adm-color-primary)'
                          : '2px solid transparent',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <span style={{ fontSize: '17px', fontWeight: 500 }}>
                        {t.createWallet.wordCount24}
                      </span>
                      <span style={{ fontSize: '14px', color: 'var(--app-subtitle-color)' }}>
                        {t.createWallet.wordCount24Desc}
                      </span>
                    </div>
                  </Radio>
                </Radio.Group>
              </div>
            </div>

            <PrimaryButton loading={loading} onClick={handleGenerate} style={{ marginTop: '8px' }}>
              {t.createWallet.generateMnemonic}
            </PrimaryButton>
          </div>
        </StandardCard>
      )}

      {step === 'backup' && (
        <StandardCard>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'var(--app-title-color)',
                }}
              >
                {t.createWallet.backupMnemonic}
              </h2>
              <p
                style={{
                  marginTop: '8px',
                  color: 'var(--adm-color-danger)',
                  fontSize: '15px',
                  lineHeight: '1.5',
                }}
              >
                {t.createWallet.backupWarning}
              </p>
            </div>

            <div
              style={{
                background: 'var(--adm-color-fill-content)',
                padding: '20px',
                borderRadius: '12px',
                fontFamily: 'monospace',
                fontSize: '16px',
                lineHeight: '2',
                wordBreak: 'break-word',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: wordCount === 12 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                  gap: '12px',
                }}
              >
                {mnemonic.split(' ').map((word, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      background: 'var(--adm-color-box)',
                      borderRadius: '8px',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--app-subtitle-color)',
                        fontSize: '14px',
                        minWidth: '24px',
                      }}
                    >
                      {index + 1}.
                    </span>
                    <span style={{ color: 'var(--app-title-color)', fontWeight: 500 }}>{word}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              color="default"
              block
              onClick={handleCopyMnemonic}
              style={{
                borderRadius: '12px',
                height: '44px',
                fontSize: '16px',
              }}
            >
              {t.createWallet.copyMnemonic}
            </Button>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                background: 'var(--app-warning-background)',
                borderRadius: '12px',
              }}
            >
              <Checkbox
                checked={backupConfirmed}
                onChange={(checked) => setBackupConfirmed(checked)}
                style={{
                  marginTop: '2px',
                }}
              />
              <label
                style={{
                  fontSize: '15px',
                  color: 'var(--app-warning-color)',
                  lineHeight: '1.5',
                  cursor: 'pointer',
                  flex: 1,
                }}
                onClick={() => setBackupConfirmed(!backupConfirmed)}
              >
                {t.createWallet.backupConfirmation}
              </label>
            </div>

            <PrimaryButton disabled={!backupConfirmed} onClick={handleBackupComplete}>
              {t.createWallet.backupCompleted}
            </PrimaryButton>
          </div>
        </StandardCard>
      )}

      {step === 'password' && (
        <StandardCard>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'var(--app-title-color)',
                }}
              >
                {t.createWallet.setPassword}
              </h2>
              <p
                style={{
                  marginTop: '8px',
                  color: 'var(--app-subtitle-color)',
                  fontSize: '15px',
                  lineHeight: '1.5',
                }}
              >
                {t.createWallet.passwordDescription}
              </p>
            </div>

            <PasswordInput
              placeholder={t.createWallet.passwordInputPlaceholder}
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

            <PrimaryButton loading={loading} onClick={handleCreateWallet}>
              {t.createWallet.title}
            </PrimaryButton>
          </div>
        </StandardCard>
      )}
    </PageLayout>
  );
}

export default CreateWalletPage;
