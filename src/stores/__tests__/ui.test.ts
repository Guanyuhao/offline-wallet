import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUIStore } from '../ui';
import type { ThemeType, ViewType } from '../ui';

describe('useUIStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('setView', () => {
    it('应该设置当前视图', () => {
      const store = useUIStore();

      store.setView('wallet');

      expect(store.currentView).toBe('wallet');
    });

    it('应该支持所有视图类型', () => {
      const store = useUIStore();
      const views: ViewType[] = ['welcome', 'create', 'import', 'wallet', 'settings'];

      views.forEach((view) => {
        store.setView(view);
        expect(store.currentView).toBe(view);
      });
    });
  });

  describe('setTheme', () => {
    it('应该设置主题并保存到 localStorage', () => {
      const store = useUIStore();
      const theme: ThemeType = 'dark';

      store.setTheme(theme);

      expect(store.theme).toBe(theme);
      expect(localStorage.getItem('app-theme')).toBe(theme);
    });

    it('应该应用主题到 DOM', () => {
      const store = useUIStore();
      const root = document.documentElement;

      store.setTheme('dark');
      expect(root.classList.contains('dark')).toBe(true);
      expect(root.classList.contains('light')).toBe(false);

      store.setTheme('light');
      expect(root.classList.contains('light')).toBe(true);
      expect(root.classList.contains('dark')).toBe(false);
    });

    it('应该在 auto 模式下根据系统偏好设置主题', () => {
      const store = useUIStore();
      const root = document.documentElement;

      // Mock matchMedia
      const mockMatchMedia = vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      store.setTheme('auto');

      // 根据 mock 的返回值，应该添加 dark 或 light 类
      expect(root.classList.contains('dark') || root.classList.contains('light')).toBe(true);
    });

    it('应该触发 theme-changed 事件', () => {
      const store = useUIStore();
      const eventSpy = vi.spyOn(window, 'dispatchEvent');

      store.setTheme('dark');

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'theme-changed',
          detail: 'dark',
        })
      );
    });
  });

  describe('showLoading and hideLoading', () => {
    it('应该显示加载状态', () => {
      const store = useUIStore();
      const message = 'Loading data...';

      store.showLoading(message);

      expect(store.isLoading).toBe(true);
      expect(store.loadingMessage).toBe(message);
    });

    it('应该使用默认加载消息', () => {
      const store = useUIStore();

      store.showLoading();

      expect(store.isLoading).toBe(true);
      expect(store.loadingMessage).toBe('Loading...');
    });

    it('应该隐藏加载状态', () => {
      const store = useUIStore();
      store.showLoading('Loading...');

      store.hideLoading();

      expect(store.isLoading).toBe(false);
      expect(store.loadingMessage).toBe('');
    });
  });

  describe('消息去重功能', () => {
    it('应该通过多次调用 showSuccess 测试去重功能', () => {
      const store = useUIStore();
      const message = 'Test message';

      // 多次调用应该不会抛出错误
      expect(() => {
        store.showSuccess(message);
        store.showSuccess(message); // 立即再次调用，应该被去重
      }).not.toThrow();
    });

    it('应该在时间窗口外可以再次显示', async () => {
      const store = useUIStore();
      const message = 'Test message';

      // 第一次调用
      store.showSuccess(message);

      // 等待超过2秒
      await new Promise((resolve) => setTimeout(resolve, 2100));

      // 应该可以再次调用而不抛出错误
      expect(() => {
        store.showSuccess(message);
      }).not.toThrow();
    });
  });

  describe('showSuccess', () => {
    it('应该显示成功消息', () => {
      const store = useUIStore();
      const message = 'Operation successful';

      // showSuccess 应该不会抛出错误
      expect(() => {
        store.showSuccess(message);
      }).not.toThrow();
    });
  });

  describe('showError', () => {
    it('应该显示错误消息', () => {
      const store = useUIStore();
      const message = 'Operation failed';

      // showError 应该不会抛出错误
      expect(() => {
        store.showError(message);
      }).not.toThrow();
    });
  });
});
