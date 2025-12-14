import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';
import { sharedZhCN, sharedEnUS, type Locale } from '@offline-wallet/shared';

// 合并 shared 的翻译
export type Translations = typeof zhCN;

const translations: Record<Locale, Translations> = {
  'zh-CN': { ...sharedZhCN, ...zhCN },
  'en-US': { ...sharedEnUS, ...enUS },
};

export const getTranslations = (locale: Locale): Translations => {
  return translations[locale] || translations['zh-CN'];
};

export { zhCN, enUS };
