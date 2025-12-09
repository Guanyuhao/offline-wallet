import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getEffectiveTheme: () => 'light' | 'dark'; // 根据 auto 模式计算实际主题
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'auto', // 默认跟随系统
      setTheme: (theme) => set({ theme }),
      getEffectiveTheme: () => {
        const { theme } = get();
        if (theme === 'auto') {
          // 检测系统主题
          if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
          return 'light';
        }
        return theme;
      },
    }),
    {
      name: 'theme-storage', // localStorage key
    }
  )
);

export default useThemeStore;
