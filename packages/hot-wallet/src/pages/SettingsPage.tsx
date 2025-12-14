import { useState, useEffect } from 'react';
import { Dialog, Toast, List, Picker } from 'antd-mobile';
import { CloseCircleFill } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { detectPlatform } from '@offline-wallet/shared/utils';
import { PageLayout, StandardCard } from '@offline-wallet/shared/components';
import { useI18nStore, useThemeStore, type Locale, type Theme } from '@offline-wallet/shared';
import { useI18n } from '../hooks/useI18n';
import useAddressStore from '../stores/useAddressStore';

function SettingsPage() {
  const navigate = useNavigate();
  const t = useI18n();
  const { clearAll } = useAddressStore();
  const { locale, setLocale } = useI18nStore();
  const { theme, setTheme } = useThemeStore();
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

  // 清除所有数据
  const handleClearData = () => {
    Dialog.confirm({
      content: t.settings.confirmClear,
      onConfirm: () => {
        clearAll();
        Toast.show({
          content: t.settings.clearSuccess,
          icon: 'success',
        });
        navigate('/');
      },
    });
  };

  // 退出应用（仅桌面端）
  const handleExit = () => {
    Dialog.confirm({
      content: t.settings.confirmExit || '确定退出应用？',
      onConfirm: async () => {
        try {
          const appWindow = getCurrentWindow();
          await appWindow.close();
        } catch (error) {
          console.error('退出应用失败:', error);
        }
      },
    });
  };

  // 语言选项
  const languageOptions = [
    { label: t.language?.zhCN || '简体中文', value: 'zh-CN' },
    { label: t.language?.enUS || 'English', value: 'en-US' },
  ];

  // 主题选项
  const themeOptions = [
    { label: t.theme?.light || '浅色', value: 'light' },
    { label: t.theme?.dark || '深色', value: 'dark' },
    { label: t.theme?.auto || '跟随系统', value: 'auto' },
  ];

  return (
    <PageLayout title={t.settings.title || '设置'} onBack={() => navigate(-1)}>
      <StandardCard style={{ marginBottom: '16px' }}>
        <List style={{ '--border-top': 'none', '--border-bottom': 'none' }}>
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
            {t.settings.language || '语言'}
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
            {t.settings.theme || '主题'}
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

          {/* 清除数据 */}
          <List.Item
            onClick={handleClearData}
            arrow
            extra={
              <span style={{ color: 'var(--app-subtitle-color)' }}>
                {t.settings.clearCacheDesc}
              </span>
            }
          >
            {t.settings.clearCache}
          </List.Item>

          {/* 退出应用（仅桌面端） */}
          {!isMobile && (
            <List.Item
              onClick={handleExit}
              arrow
              prefix={
                <CloseCircleFill fontSize={20} style={{ color: 'var(--adm-color-danger)' }} />
              }
            >
              {t.settings.exitApp || '退出应用'}
            </List.Item>
          )}
        </List>
      </StandardCard>

      {/* 关于 */}
      <StandardCard>
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--app-subtitle-color)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔥</div>
          <p
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 500,
              color: 'var(--app-title-color)',
            }}
          >
            {t.settings.version}
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>{t.settings.slogan}</p>
        </div>
      </StandardCard>
    </PageLayout>
  );
}

export default SettingsPage;
