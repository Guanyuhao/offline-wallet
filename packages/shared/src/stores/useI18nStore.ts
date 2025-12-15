import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'zh-CN' | 'en-US';

export interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'zh-CN', // 默认中文
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'i18n-storage', // localStorage key
    }
  )
);

export default useI18nStore;
