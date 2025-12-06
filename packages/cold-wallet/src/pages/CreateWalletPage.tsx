import { useState } from 'react';
import { Toast, Radio, Checkbox, Button } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import useWalletStore from '../stores/useWalletStore';
import { copyToClipboard } from '../utils';
import PasswordInput from '../components/PasswordInput';
import PageLayout from '../components/PageLayout';
import StandardCard from '../components/StandardCard';
import PrimaryButton from '../components/PrimaryButton';

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
        content: `生成失败: ${error}`,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackupComplete = () => {
    if (!backupConfirmed) {
      Toast.show({
        content: '请确认已安全备份助记词',
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
        content: '已复制到剪贴板',
        position: 'top',
      });
    }
  };

  const handleCreateWallet = async () => {
    if (!password || password.length < 8) {
      Toast.show({
        content: '密码至少8位',
        position: 'top',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        content: '两次密码不一致',
        position: 'top',
      });
      return;
    }

    try {
      setLoading(true);
      // 存储加密的助记词
      await invoke('store_encrypted_mnemonic', {
        mnemonic,
        password,
      });

      // 设置钱包状态
      setHasWallet(true);
      setMnemonic(mnemonic);

      Toast.show({
        content: '钱包创建成功',
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
    <PageLayout title="创建钱包" onBack={() => navigate(-1)}>
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
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#1d1d1f' }}>
                创建新钱包
              </h2>
              <p
                style={{
                  marginTop: '8px',
                  color: '#86868b',
                  fontSize: '15px',
                  lineHeight: '1.5',
                }}
              >
                请选择助记词数量，请妥善保管，丢失将无法恢复
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
                  color: '#1d1d1f',
                  marginBottom: '8px',
                }}
              >
                助记词数量
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
                      background: wordCount === 12 ? '#f0f9ff' : '#f5f5f7',
                      border: wordCount === 12 ? '2px solid #1677ff' : '2px solid transparent',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <span style={{ fontSize: '17px', fontWeight: 500 }}>12 个助记词</span>
                      <span style={{ fontSize: '14px', color: '#86868b' }}>
                        推荐，更易备份和记忆
                      </span>
                    </div>
                  </Radio>
                  <Radio
                    value={24}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: wordCount === 24 ? '#f0f9ff' : '#f5f5f7',
                      border: wordCount === 24 ? '2px solid #1677ff' : '2px solid transparent',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <span style={{ fontSize: '17px', fontWeight: 500 }}>24 个助记词</span>
                      <span style={{ fontSize: '14px', color: '#86868b' }}>
                        更高安全性，适合大额资产
                      </span>
                    </div>
                  </Radio>
                </Radio.Group>
              </div>
            </div>

            <PrimaryButton loading={loading} onClick={handleGenerate} style={{ marginTop: '8px' }}>
              生成助记词
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
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#1d1d1f' }}>
                备份助记词
              </h2>
              <p
                style={{
                  marginTop: '8px',
                  color: '#ff3141',
                  fontSize: '15px',
                  lineHeight: '1.5',
                }}
              >
                ⚠️ 请用纸笔抄写，不要截图或复制到网络
              </p>
            </div>

            <div
              style={{
                background: '#f5f5f7',
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
                      background: '#ffffff',
                      borderRadius: '8px',
                    }}
                  >
                    <span
                      style={{
                        color: '#86868b',
                        fontSize: '14px',
                        minWidth: '24px',
                      }}
                    >
                      {index + 1}.
                    </span>
                    <span style={{ color: '#1d1d1f', fontWeight: 500 }}>{word}</span>
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
              复制助记词
            </Button>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                background: '#fff3cd',
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
                  color: '#856404',
                  lineHeight: '1.5',
                  cursor: 'pointer',
                  flex: 1,
                }}
                onClick={() => setBackupConfirmed(!backupConfirmed)}
              >
                我已安全备份助记词，理解丢失助记词将无法恢复钱包
              </label>
            </div>

            <PrimaryButton disabled={!backupConfirmed} onClick={handleBackupComplete}>
              我已备份完成
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
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#1d1d1f' }}>
                设置密码
              </h2>
              <p
                style={{
                  marginTop: '8px',
                  color: '#86868b',
                  fontSize: '15px',
                  lineHeight: '1.5',
                }}
              >
                密码用于加密存储助记词，请牢记。忘记密码将无法恢复钱包。
              </p>
            </div>

            <PasswordInput
              placeholder="请输入密码（至少8位）"
              value={password}
              onChange={(val) => setPassword(val)}
              style={{
                borderRadius: '12px',
                fontSize: '17px',
              }}
            />

            <PasswordInput
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={(val) => setConfirmPassword(val)}
              style={{
                borderRadius: '12px',
                fontSize: '17px',
              }}
            />

            <PrimaryButton loading={loading} onClick={handleCreateWallet}>
              创建钱包
            </PrimaryButton>
          </div>
        </StandardCard>
      )}
    </PageLayout>
  );
}

export default CreateWalletPage;
