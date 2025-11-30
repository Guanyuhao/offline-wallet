import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { usePlatform } from '../usePlatform';

describe('usePlatform', () => {
  let originalUserAgent: string;
  let originalInnerWidth: number;

  beforeEach(() => {
    originalUserAgent = navigator.userAgent;
    originalInnerWidth = window.innerWidth;
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      configurable: true,
    });
    delete (window as any).__TAURI_METADATA__;
  });

  describe('平台检测', () => {
    it('应该检测桌面平台', async () => {
      // 先设置属性（必须在调用 usePlatform 之前设置）
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
        writable: true,
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        configurable: true,
        writable: true,
      });

      // 确保属性设置生效
      await new Promise((resolve) => setTimeout(resolve, 10));

      const wrapper = mount({
        setup() {
          // usePlatform 在调用时立即执行 detectPlatform()
          const { platform, isDesktop, isMobile } = usePlatform();
          return { platform, isDesktop, isMobile };
        },
        template: '<div></div>',
      });

      await nextTick();
      // 等待 detectPlatform 执行完成
      await new Promise((resolve) => setTimeout(resolve, 100));

      // usePlatform 返回的是共享的 platform ref
      // 在 Vue 3 测试中，ref 会被自动解包，但 platform 可能需要在 setup 中正确返回
      // 我们主要测试 isDesktop 和 isMobile 函数，它们依赖于 platform.value
      expect(wrapper.vm.isDesktop()).toBe(true);
      expect(wrapper.vm.isMobile()).toBe(false);

      // 如果 platform 被正确暴露，也测试它
      if (wrapper.vm.platform !== undefined) {
        const platformValue =
          typeof wrapper.vm.platform === 'object' && 'value' in wrapper.vm.platform
            ? wrapper.vm.platform.value
            : wrapper.vm.platform;
        expect(platformValue).toBe('desktop');
      }

      wrapper.unmount();
    });

    it('应该检测移动平台（通过 User Agent）', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
        writable: true,
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        configurable: true,
        writable: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      const wrapper = mount({
        setup() {
          const { platform, isDesktop, isMobile } = usePlatform();
          return { platform, isDesktop, isMobile };
        },
        template: '<div></div>',
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.vm.isDesktop()).toBe(false);
      expect(wrapper.vm.isMobile()).toBe(true);

      if (wrapper.vm.platform !== undefined) {
        const platformValue =
          typeof wrapper.vm.platform === 'object' && 'value' in wrapper.vm.platform
            ? wrapper.vm.platform.value
            : wrapper.vm.platform;
        expect(platformValue).toBe('mobile');
      }

      wrapper.unmount();
    });

    it('应该检测移动平台（通过屏幕尺寸）', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
        writable: true,
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 600,
        configurable: true,
        writable: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      const wrapper = mount({
        setup() {
          const { platform, isDesktop, isMobile } = usePlatform();
          return { platform, isDesktop, isMobile };
        },
        template: '<div></div>',
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.vm.isMobile()).toBe(true);

      if (wrapper.vm.platform !== undefined) {
        const platformValue =
          typeof wrapper.vm.platform === 'object' && 'value' in wrapper.vm.platform
            ? wrapper.vm.platform.value
            : wrapper.vm.platform;
        expect(platformValue).toBe('mobile');
      }

      wrapper.unmount();
    });

    it('应该优先使用 Tauri 元数据检测平台', async () => {
      (window as any).__TAURI_METADATA__ = {
        platform: 'ios',
      };

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
        writable: true,
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        configurable: true,
        writable: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      const wrapper = mount({
        setup() {
          const { platform, isMobile } = usePlatform();
          return { platform, isMobile };
        },
        template: '<div></div>',
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.vm.isMobile()).toBe(true);

      if (wrapper.vm.platform !== undefined) {
        const platformValue =
          typeof wrapper.vm.platform === 'object' && 'value' in wrapper.vm.platform
            ? wrapper.vm.platform.value
            : wrapper.vm.platform;
        expect(platformValue).toBe('mobile');
      }

      wrapper.unmount();
    });

    it('应该检测 Android 平台', async () => {
      (window as any).__TAURI_METADATA__ = {
        platform: 'android',
      };

      await new Promise((resolve) => setTimeout(resolve, 0));

      const wrapper = mount({
        setup() {
          const { platform, isMobile } = usePlatform();
          return { platform, isMobile };
        },
        template: '<div></div>',
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.vm.isMobile()).toBe(true);

      if (wrapper.vm.platform !== undefined) {
        const platformValue =
          typeof wrapper.vm.platform === 'object' && 'value' in wrapper.vm.platform
            ? wrapper.vm.platform.value
            : wrapper.vm.platform;
        expect(platformValue).toBe('mobile');
      }

      wrapper.unmount();
    });

    it('应该处理各种移动设备 User Agent', async () => {
      const mobileUserAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (Linux; Android 10; SM-G973F)',
        'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (BlackBerry; U; BlackBerry 9800; en)',
        'Mozilla/5.0 (webOS/1.4.0; U; en-US)',
        'Opera/9.80 (Android; Opera Mini/7.5.33361/31.1448; U; en) Presto/2.8.119 Version/11.1010',
      ];

      for (const ua of mobileUserAgents) {
        Object.defineProperty(navigator, 'userAgent', {
          value: ua,
          configurable: true,
          writable: true,
        });
        Object.defineProperty(window, 'innerWidth', {
          value: 1920,
          configurable: true,
          writable: true,
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        const wrapper = mount({
          setup() {
            const { platform, isMobile } = usePlatform();
            return { platform, isMobile };
          },
          template: '<div></div>',
        });

        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(wrapper.vm.isMobile()).toBe(true);

        if (wrapper.vm.platform !== undefined) {
          const platformValue =
            typeof wrapper.vm.platform === 'object' && 'value' in wrapper.vm.platform
              ? wrapper.vm.platform.value
              : wrapper.vm.platform;
          expect(platformValue).toBe('mobile');
        }

        wrapper.unmount();
      }
    });
  });

  describe('窗口大小变化监听', () => {
    it('应该监听窗口大小变化', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const wrapper = mount({
        setup() {
          usePlatform();
          return {};
        },
        template: '<div></div>',
      });

      await nextTick();

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      wrapper.unmount();
    });

    it('应该在窗口大小变化时重新检测平台', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
        writable: true,
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        configurable: true,
        writable: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      const wrapper = mount({
        setup() {
          const { platform } = usePlatform();
          return { platform };
        },
        template: '<div></div>',
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 初始应该是桌面
      const { isDesktop, isMobile } = usePlatform();
      expect(isDesktop()).toBe(true);
      expect(isMobile()).toBe(false);

      // 改变窗口大小
      Object.defineProperty(window, 'innerWidth', {
        value: 600,
        configurable: true,
        writable: true,
      });

      window.dispatchEvent(new Event('resize'));

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 改变后应该是移动端
      expect(isMobile()).toBe(true);
      expect(isDesktop()).toBe(false);

      wrapper.unmount();
    });
  });

  describe('错误处理', () => {
    it('应该在检测失败时使用屏幕尺寸判断', async () => {
      // Mock 抛出错误的情况
      const originalUserAgent = Object.getOwnPropertyDescriptor(navigator, 'userAgent');
      Object.defineProperty(navigator, 'userAgent', {
        get: () => {
          throw new Error('Cannot access userAgent');
        },
        configurable: true,
      });

      Object.defineProperty(window, 'innerWidth', {
        value: 600,
        configurable: true,
        writable: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      const wrapper = mount({
        setup() {
          const { platform, isMobile } = usePlatform();
          return { platform, isMobile };
        },
        template: '<div></div>',
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.vm.isMobile()).toBe(true);

      if (wrapper.vm.platform !== undefined) {
        const platformValue =
          typeof wrapper.vm.platform === 'object' && 'value' in wrapper.vm.platform
            ? wrapper.vm.platform.value
            : wrapper.vm.platform;
        expect(platformValue).toBe('mobile');
      }

      wrapper.unmount();

      // 恢复
      if (originalUserAgent) {
        Object.defineProperty(navigator, 'userAgent', originalUserAgent);
      }
    });
  });

  describe('立即检测', () => {
    it('应该在创建时立即检测平台（不等待 mounted）', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
        writable: true,
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        configurable: true,
        writable: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      const { platform } = usePlatform();

      // 即使没有挂载，也应该已经检测了平台
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(platform.value).toBe('mobile');
    });
  });
});
