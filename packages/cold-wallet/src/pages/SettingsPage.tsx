import { useState, useEffect } from 'react';
import { Button, Dialog, Toast, List, Picker } from 'antd-mobile';
import { LockOutline, CloseCircleFill, ExclamationTriangleOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { detectPlatform } from '@offline-wallet/shared/utils/platform';
import useWalletStore from '../stores/useWalletStore';
import useI18nStore, { Locale } from '../stores/useI18nStore';
import useThemeStore, { Theme } from '../stores/useThemeStore';
import PageLayout from '../components/PageLayout';
import StandardCard from '../components/StandardCard';
import { deleteMnemonic } from '../utils/stronghold';
import { useI18n } from '../hooks/useI18n';

function SettingsPage() {
  const navigate = useNavigate();
  const t = useI18n();
  const { clearMnemonic, setUnlocked, reset } = useWalletStore();
  const { locale, setLocale } = useI18nStore();
  const { theme, setTheme } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [languageVisible, setLanguageVisible] = useState(false);
  const [themeVisible, setThemeVisible] = useState(false);

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
      content: `${t.settings.lockWalletDesc}？${t.settings.lockWalletConfirm}`,
      onConfirm: () => {
        clearMnemonic();
        setUnlocked(false);
        navigate('/unlock');
      },
    });
  };

  const handleDeleteWallet = () => {
    Dialog.confirm({
      content: t.settings.deleteWalletDesc,
      confirmText: t.settings.confirmDelete,
      cancelText: t.common.cancel,
      onConfirm: async () => {
        try {
          setLoading(true);
          await deleteMnemonic();
          reset();
          Toast.show({
            content: t.settings.deleteSuccess,
            position: 'top',
            icon: 'success',
          });
          navigate('/');
        } catch (error) {
          console.error('删除失败:', error);
          Toast.show({
            content: `${t.settings.deleteFailed}: ${error instanceof Error ? error.message : String(error)}`,
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
      content: t.settings.confirmExit,
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
            content: t.settings.exitFailed,
            position: 'top',
          });
        }
      },
    });
  };

  // 语言选项
  const languageOptions = [
    { label: t.language.zhCN, value: 'zh-CN' },
    { label: t.language.enUS, value: 'en-US' },
  ];

  // 主题选项
  const themeOptions = [
    { label: t.theme.light, value: 'light' },
    { label: t.theme.dark, value: 'dark' },
    { label: t.theme.auto, value: 'auto' },
  ];

  return (
    <PageLayout title={t.settings.title} onBack={() => navigate(-1)}>
      <StandardCard>
        <List>
          {/* 语言设置 */}
          <List.Item
            onClick={() => setLanguageVisible(true)}
            arrow
            extra={
              <span style={{ color: 'var(--app-subtitle-color)' }}>
                {languageOptions.find((opt) => opt.value === locale)?.label}
              </span>
            }
          >
            {t.settings.language}
          </List.Item>
          <Picker
            visible={languageVisible}
            onClose={() => setLanguageVisible(false)}
            value={[locale]}
            columns={[languageOptions]}
            onConfirm={(value) => {
              setLocale(value[0] as Locale);
              setLanguageVisible(false);
            }}
          />

          {/* 主题设置 */}
          <List.Item
            onClick={() => setThemeVisible(true)}
            arrow
            extra={
              <span style={{ color: 'var(--app-subtitle-color)' }}>
                {themeOptions.find((opt) => opt.value === theme)?.label}
              </span>
            }
          >
            {t.settings.theme}
          </List.Item>
          <Picker
            visible={themeVisible}
            onClose={() => setThemeVisible(false)}
            value={[theme]}
            columns={[themeOptions]}
            onConfirm={(value) => {
              setTheme(value[0] as Theme);
              setThemeVisible(false);
            }}
          />

          <List.Item
            onClick={handleLock}
            arrow
            extra={
              <span style={{ color: 'var(--app-subtitle-color)' }}>
                {t.settings.lockWalletDesc}
              </span>
            }
            prefix={<LockOutline fontSize={20} style={{ color: 'var(--adm-color-primary)' }} />}
          >
            {t.settings.lockWallet}
          </List.Item>
          {/* 仅在桌面端显示退出应用选项 */}
          {!isMobile && (
            <List.Item
              onClick={handleExit}
              arrow
              extra={
                <span style={{ color: 'var(--app-subtitle-color)' }}>{t.settings.exitAppDesc}</span>
              }
              prefix={
                <CloseCircleFill fontSize={20} style={{ color: 'var(--adm-color-primary)' }} />
              }
            >
              {t.settings.exitApp}
            </List.Item>
          )}
        </List>
      </StandardCard>

      <StandardCard style={{ marginTop: '16px' }}>
        <div
          style={{
            padding: '16px',
            background: 'var(--app-warning-background)',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--app-warning-color)' }}>
            <ExclamationTriangleOutline /> {t.settings.dangerZone}
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--app-warning-color)' }}>
            {t.settings.dangerZoneDesc}
          </p>
        </div>
        <Button color="danger" block loading={loading} onClick={handleDeleteWallet}>
          {t.settings.deleteWallet}
        </Button>
      </StandardCard>

      <StandardCard style={{ marginTop: '16px' }}>
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            color: 'var(--app-subtitle-color)',
            fontSize: '12px',
          }}
        >
          <p style={{ margin: 0 }}>{t.settings.appVersion}</p>
          <p style={{ margin: '8px 0 0 0' }}>{t.settings.appSlogan}</p>
        </div>
      </StandardCard>
    </PageLayout>
  );
}

export default SettingsPage;
