import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';
import enUS from 'antd-mobile/es/locales/en-US';
import 'antd-mobile/es/global';
import App from './App';
import './styles/index.css';
import useI18nStore from './stores/useI18nStore';
import useThemeStore from './stores/useThemeStore';
import { getTranslations } from './i18n';

// 主题初始化组件
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, getEffectiveTheme } = useThemeStore();

  useEffect(() => {
    const updateTheme = () => {
      const effectiveTheme = getEffectiveTheme();
      const root = document.documentElement;

      if (effectiveTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.setAttribute('data-theme', 'light');
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    updateTheme();

    // 监听系统主题变化（仅在 auto 模式下）
    if (theme === 'auto' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();

      // 使用 addEventListener（现代浏览器）
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        // 兼容旧浏览器
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [theme, getEffectiveTheme]);

  return <>{children}</>;
}

// 国际化配置组件
function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useI18nStore((state) => state.locale);
  const antdLocale = locale === 'en-US' ? enUS : zhCN;

  // 更新页面标题
  useEffect(() => {
    const t = getTranslations(locale);
    document.title = `${t.home.title} - ${t.home.subtitle}`;
  }, [locale]);

  return <ConfigProvider locale={antdLocale}>{children}</ConfigProvider>;
}

const rootElement = document.getElementById('app');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);
