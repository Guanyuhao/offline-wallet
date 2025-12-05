import { useState } from 'react';
import { Button, Card, Input, Toast, Dialog } from 'antd-mobile';
import { NavBar, SafeArea } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import useWalletStore from '../stores/useWalletStore';
import { copyToClipboard } from '../utils';

function CreateWalletPage() {
  const navigate = useNavigate();
  const { setHasWallet, setMnemonic } = useWalletStore();
  const [step, setStep] = useState<'generate' | 'backup' | 'password'>('generate');
  const [mnemonic, setMnemonicLocal] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const generated = await invoke<string>('generate_mnemonic', {
        wordCount: 12,
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
    <div
      style={{
        height: '100vh',
        minHeight: '-webkit-fill-available',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SafeArea position="top" />
      <NavBar onBack={() => navigate(-1)}>创建钱包</NavBar>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        {step === 'generate' && (
          <Card>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h2>创建新钱包</h2>
              <p style={{ color: '#666' }}>将生成12个助记词，请妥善保管，丢失将无法恢复</p>
              <Button color="primary" block loading={loading} onClick={handleGenerate}>
                生成助记词
              </Button>
            </div>
          </Card>
        )}

        {step === 'backup' && (
          <Card>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h2>备份助记词</h2>
              <p style={{ color: '#ff6b6b', fontSize: '14px' }}>⚠️ 请用纸笔抄写，不要截图或复制</p>

              <div
                style={{
                  background: '#f5f5f5',
                  padding: '16px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  lineHeight: '1.8',
                  wordBreak: 'break-word',
                }}
              >
                {mnemonic.split(' ').map((word, index) => (
                  <span key={index} style={{ marginRight: '8px' }}>
                    {index + 1}. {word}
                  </span>
                ))}
              </div>

              <Button
                color="default"
                block
                onClick={async () => {
                  const success = await copyToClipboard(mnemonic);
                  if (success) {
                    Toast.show({
                      content: '已复制到剪贴板',
                      position: 'top',
                    });
                  }
                }}
              >
                复制助记词
              </Button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="checkbox"
                  checked={backupConfirmed}
                  onChange={(e) => setBackupConfirmed(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
                <label style={{ fontSize: '14px' }}>我已安全备份助记词</label>
              </div>

              <Button
                color="primary"
                block
                disabled={!backupConfirmed}
                onClick={handleBackupComplete}
              >
                我已备份完成
              </Button>
            </div>
          </Card>
        )}

        {step === 'password' && (
          <Card>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h2>设置密码</h2>
              <p style={{ color: '#666' }}>密码用于加密存储助记词，请牢记</p>

              <Input
                type="password"
                placeholder="请输入密码（至少8位）"
                value={password}
                onChange={(val) => setPassword(val)}
              />

              <Input
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(val) => setConfirmPassword(val)}
              />

              <Button color="primary" block loading={loading} onClick={handleCreateWallet}>
                创建钱包
              </Button>
            </div>
          </Card>
        )}
      </div>

      <SafeArea position="bottom" />
    </div>
  );
}

export default CreateWalletPage;
