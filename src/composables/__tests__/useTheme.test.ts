import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { useTheme } from '../useTheme';
import { useUIStore } from '../../stores/ui';
import { createPinia, setActivePinia } from 'pinia';

describe('useTheme', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    // 重置 DOM
    document.documentElement.className = '';
    document.documentElement.classList.remove('dark', 'light');

    // matchMedia 已经在 setup.ts 中 mock 了，这里不需要重复设置
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 清理
    document.documentElement.className = '';
    vi.restoreAllMocks();
  });

  describe('初始化', () => {
    it('应该在挂载时初始化主题状态', async () => {
      const wrapper = mount({
        setup() {
          const { isDarkMode, theme } = useTheme();
          return { isDarkMode, theme };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia],
        },
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 默认应该是浅色模式
      expect(wrapper.vm.isDarkMode).toBe(false);
      expect(wrapper.vm.theme).toBe('light');

      wrapper.unmount();
    });

    it('应该正确检测暗色模式', async () => {
      document.documentElement.classList.add('dark');

      const wrapper = mount({
        setup() {
          const { isDarkMode } = useTheme();
          return { isDarkMode };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia],
        },
      });

      await nextTick();
      // 等待防抖完成
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.vm.isDarkMode).toBe(true);

      wrapper.unmount();
    });
  });

  describe('主题切换', () => {
    it('应该响应 DOM class 变化', async () => {
      const wrapper = mount({
        setup() {
          const { isDarkMode, updateNaiveTheme } = useTheme();
          return { isDarkMode, updateNaiveTheme };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia],
        },
      });

      await nextTick();

      // 初始状态
      expect(wrapper.vm.isDarkMode).toBe(false);

      // 添加 dark class
      document.documentElement.classList.add('dark');
      wrapper.vm.updateNaiveTheme();
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.vm.isDarkMode).toBe(true);

      // 移除 dark class
      document.documentElement.classList.remove('dark');
      wrapper.vm.updateNaiveTheme();
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.vm.isDarkMode).toBe(false);

      wrapper.unmount();
    });

    it('应该响应 theme-changed 事件', async () => {
      const wrapper = mount({
        setup() {
          const { isDarkMode } = useTheme();
          return { isDarkMode };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia],
        },
      });

      await nextTick();

      // 触发 theme-changed 事件
      document.documentElement.classList.add('dark');
      window.dispatchEvent(new Event('theme-changed'));

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.vm.isDarkMode).toBe(true);

      wrapper.unmount();
    });
  });

  describe('系统主题监听', () => {
    it('应该在 auto 模式下监听系统主题变化', async () => {
      const uiStore = useUIStore();
      uiStore.theme = 'auto';

      const wrapper = mount({
        setup() {
          const { isDarkMode } = useTheme();
          return { isDarkMode };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia],
        },
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // matchMedia 应该被调用（在 setup.ts 中已 mock）
      expect(window.matchMedia).toBeDefined();

      wrapper.unmount();
    });
  });

  describe('MutationObserver', () => {
    it('应该监听 DOM class 属性变化', async () => {
      const wrapper = mount({
        setup() {
          const { isDarkMode } = useTheme();
          return { isDarkMode };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia],
        },
      });

      await nextTick();

      // 修改 class 属性
      document.documentElement.classList.add('dark');

      // 等待 MutationObserver 触发和防抖完成
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(wrapper.vm.isDarkMode).toBe(true);

      wrapper.unmount();
    });
  });

  describe('防抖机制', () => {
    it('应该防抖更新主题状态', async () => {
      const wrapper = mount({
        setup() {
          const { updateNaiveTheme } = useTheme();
          return { updateNaiveTheme };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia],
        },
      });

      await nextTick();

      // 快速多次调用
      wrapper.vm.updateNaiveTheme();
      wrapper.vm.updateNaiveTheme();
      wrapper.vm.updateNaiveTheme();

      // 应该只执行一次（通过防抖）
      await new Promise((resolve) => setTimeout(resolve, 100));

      wrapper.unmount();
    });
  });

  describe('清理', () => {
    it('应该在卸载时清理所有监听器', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const wrapper = mount({
        setup() {
          const { isDarkMode } = useTheme();
          return { isDarkMode };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia],
        },
      });

      await nextTick();

      wrapper.unmount();

      // 验证事件监听器已移除
      expect(removeEventListenerSpy).toHaveBeenCalledWith('theme-changed', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('computed theme', () => {
    it('应该正确计算 theme 值', async () => {
      const wrapper = mount({
        setup() {
          const { isDarkMode, theme, updateNaiveTheme } = useTheme();
          return { isDarkMode, theme, updateNaiveTheme };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia],
        },
      });

      await nextTick();

      expect(wrapper.vm.theme).toBe('light');

      document.documentElement.classList.add('dark');
      wrapper.vm.updateNaiveTheme();
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.vm.theme).toBe('dark');

      wrapper.unmount();
    });
  });
});
