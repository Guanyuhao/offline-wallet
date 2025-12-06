import { useState } from 'react';
import { TextArea, Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import useWalletStore from '../stores/useWalletStore';
import PasswordInput from '../components/PasswordInput';
import PageLayout from '../components/PageLayout';
import StandardCard from '../components/StandardCard';
import PrimaryButton from '../components/PrimaryButton';

function ImportWalletPage() {
  const navigate = useNavigate();
  const { setHasWallet, setMnemonic } = useWalletStore();
  const [mnemonic, setMnemonicLocal] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    // 验证助记词
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      Toast.show({
        content: '助记词应为12或24个单词',
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
          content: '助记词格式无效',
          position: 'top',
        });
        return;
      }
    } catch (error) {
      Toast.show({
        content: `验证失败: ${error}`,
        position: 'top',
      });
      return;
    }

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
        mnemonic: mnemonic.trim(),
        password,
      });

      // 设置钱包状态
      setHasWallet(true);
      setMnemonic(mnemonic.trim());

      Toast.show({
        content: '钱包导入成功',
        position: 'top',
        icon: 'success',
      });

      navigate('/wallet');
    } catch (error) {
      Toast.show({
        content: `导入失败: ${error}`,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="导入钱包" onBack={() => navigate(-1)}>
      <StandardCard>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <h2>导入钱包</h2>
          <p style={{ color: '#666' }}>输入您的12或24个助记词</p>

          <TextArea
            placeholder="请输入助记词，用空格分隔"
            value={mnemonic}
            onChange={(val) => setMnemonicLocal(val)}
            rows={4}
            style={{ fontFamily: 'monospace', borderRadius: '12px', fontSize: '17px' }}
          />

          <PasswordInput
            placeholder="设置密码（至少8位）"
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

          <PrimaryButton loading={loading} onClick={handleImport}>
            导入钱包
          </PrimaryButton>
        </div>
      </StandardCard>
    </PageLayout>
  );
}

export default ImportWalletPage;
