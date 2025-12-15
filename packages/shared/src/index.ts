/**
 * Shared package exports
 */

// Components
export * from './components';

// Utils
export * from './utils';

// Types
export * from './types';

// Stores
export { default as useI18nStore } from './stores/useI18nStore';
export { default as useThemeStore } from './stores/useThemeStore';
export type { Locale, I18nState } from './stores/useI18nStore';
export type { Theme, ThemeState } from './stores/useThemeStore';

// Config
export * from './config/chainConfig';

// i18n locales
export { default as sharedZhCN } from './i18n/locales/common';
export { default as sharedEnUS } from './i18n/locales/common-en';
