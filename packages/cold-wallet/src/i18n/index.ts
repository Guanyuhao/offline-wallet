import { Locale } from '../stores/useI18nStore';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

export type Translations = typeof zhCN;

const translations: Record<Locale, Translations> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export const getTranslations = (locale: Locale): Translations => {
  return translations[locale] || translations['zh-CN'];
};

export { zhCN, enUS };
