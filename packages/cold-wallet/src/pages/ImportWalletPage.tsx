import { useState } from 'react';
import { Button, Card, TextArea, Toast } from 'antd-mobile';
import { NavBar, SafeArea } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import useWalletStore from '../stores/useWalletStore';

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
    <div
      style={{
        height: '100vh',
        minHeight: '-webkit-fill-available',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SafeArea position="top" />
      <NavBar onBack={() => navigate(-1)}>导入钱包</NavBar>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        <Card>
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
              style={{ fontFamily: 'monospace' }}
            />

            <input
              type="password"
              placeholder="设置密码（至少8位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            />

            <input
              type="password"
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
              }}
            />

            <Button color="primary" block loading={loading} onClick={handleImport}>
              导入钱包
            </Button>
          </div>
        </Card>
      </div>

      <SafeArea position="bottom" />
    </div>
  );
}

export default ImportWalletPage;
