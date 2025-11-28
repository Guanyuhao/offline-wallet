import { createI18n } from 'vue-i18n';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

// 从 localStorage 获取用户偏好的语言
const getPreferredLanguage = (): string => {
  try {
    const stored = localStorage.getItem('app-language');
    if (stored) return stored;
  } catch (e) {
    // localStorage 可能不可用（SSR 或某些环境）
    console.warn('localStorage not available:', e);
  }
  
  // 检测浏览器语言
  try {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) return 'zh-CN';
  } catch (e) {
    console.warn('navigator.language not available:', e);
  }
  
  return 'en-US';
};

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getPreferredLanguage(),
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
  globalInjection: true,
});

export default i18n;

// 切换语言的辅助函数
export const setLanguage = (lang: string) => {
  i18n.global.locale.value = lang as any;
  try {
    localStorage.setItem('app-language', lang);
    document.documentElement.lang = lang;
  } catch (e) {
    console.warn('Failed to save language preference:', e);
  }
};

// 获取当前语言
export const getCurrentLanguage = () => i18n.global.locale.value;

// 可用语言列表
export const availableLanguages = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
];

