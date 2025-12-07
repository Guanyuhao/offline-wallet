import { useState, useEffect } from 'react';
import { Button, Dialog, Toast, List } from 'antd-mobile';
import { LockOutline, CloseCircleFill, ExclamationTriangleOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { detectPlatform } from '@offline-wallet/shared/utils/platform';
import useWalletStore from '../stores/useWalletStore';
import PageLayout from '../components/PageLayout';
import StandardCard from '../components/StandardCard';

function SettingsPage() {
  const navigate = useNavigate();
  const { clearMnemonic, setUnlocked, reset } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测平台
  useEffect(() => {
    const checkPlatform = async () => {
      const platform = await detectPlatform();
      setIsMobile(platform === 'ios' || platform === 'android');
    };
    checkPlatform();
  }, []);

  const handleLock = () => {
    Dialog.confirm({
      content: '确定要锁定钱包吗？锁定后需要重新输入密码解锁。',
      onConfirm: () => {
        clearMnemonic();
        setUnlocked(false);
        navigate('/unlock');
      },
    });
  };

  const handleDeleteWallet = () => {
    Dialog.confirm({
      content: '删除钱包将清除所有数据，此操作不可恢复！请确保已备份助记词。',
      confirmText: '确定删除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          setLoading(true);
          await invoke('delete_encrypted_mnemonic');
          reset();
          Toast.show({
            content: '钱包已删除',
            position: 'top',
            icon: 'success',
          });
          navigate('/');
        } catch (error) {
          Toast.show({
            content: `删除失败: ${error}`,
            position: 'top',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleExit = () => {
    Dialog.confirm({
      content: '确定要退出应用吗？',
      onConfirm: async () => {
        try {
          // 清除内存中的敏感数据
          clearMnemonic();

          // 桌面端：关闭应用窗口
          const appWindow = getCurrentWindow();
          await appWindow.close();
        } catch (error) {
          console.error('退出应用失败:', error);
          Toast.show({
            content: '退出失败，请手动关闭应用',
            position: 'top',
          });
        }
      },
    });
  };

  return (
    <PageLayout title="设置" onBack={() => navigate(-1)}>
      <StandardCard>
        <List>
          <List.Item
            onClick={handleLock}
            arrow
            extra={<span style={{ color: '#999' }}>锁定钱包</span>}
            prefix={<LockOutline fontSize={20} style={{ color: '#1677ff' }} />}
          >
            锁定钱包
          </List.Item>
          {/* 仅在桌面端显示退出应用选项 */}
          {!isMobile && (
            <List.Item
              onClick={handleExit}
              arrow
              extra={<span style={{ color: '#999' }}>退出应用</span>}
              prefix={<CloseCircleFill fontSize={20} style={{ color: '#1677ff' }} />}
            >
              退出应用
            </List.Item>
          )}
        </List>
      </StandardCard>

      <StandardCard style={{ marginTop: '16px' }}>
        <div
          style={{
            padding: '16px',
            background: '#fff3cd',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#856404' }}>
            <ExclamationTriangleOutline /> 危险操作
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
            删除钱包将永久清除所有数据，请确保已备份助记词。
          </p>
        </div>
        <Button color="danger" block loading={loading} onClick={handleDeleteWallet}>
          删除钱包
        </Button>
      </StandardCard>

      <StandardCard style={{ marginTop: '16px' }}>
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            color: '#999',
            fontSize: '12px',
          }}
        >
          <p style={{ margin: 0 }}>冷钱包 v0.1.0</p>
          <p style={{ margin: '8px 0 0 0' }}>完全离线，安全第一</p>
        </div>
      </StandardCard>
    </PageLayout>
  );
}

export default SettingsPage;
