import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { useAppLayout } from '../useAppLayout';

describe('useAppLayout', () => {
  beforeEach(() => {
    // 确保 CSS.supports 被 mock
    if (!window.CSS) {
      Object.defineProperty(window, 'CSS', {
        writable: true,
        value: {
          supports: vi.fn().mockReturnValue(false),
        },
      });
    }
  });

  describe('返回值', () => {
    it('应该返回 headerStyle 和 footerHeight', async () => {
      const wrapper = mount({
        setup() {
          const { headerStyle, footerHeight } = useAppLayout();
          return { headerStyle, footerHeight };
        },
        template: '<div></div>',
      });

      await nextTick();

      expect(wrapper.vm.headerStyle).toBeDefined();
      expect(wrapper.vm.footerHeight).toBeDefined();
    });

    it('headerStyle 应该是计算属性', async () => {
      const wrapper = mount({
        setup() {
          const { headerStyle } = useAppLayout();
          return { headerStyle };
        },
        template: '<div></div>',
      });

      await nextTick();

      expect(wrapper.vm.headerStyle).toBeDefined();
      expect(typeof wrapper.vm.headerStyle).toBe('object');
      expect(wrapper.vm.headerStyle.height).toBe('64px');
      expect(wrapper.vm.headerStyle.paddingTop).toBe('env(safe-area-inset-top, 0)');
    });

    it('footerHeight 应该是常量值', async () => {
      const wrapper = mount({
        setup() {
          const { footerHeight } = useAppLayout();
          return { footerHeight };
        },
        template: '<div></div>',
      });

      await nextTick();
      expect(wrapper.vm.footerHeight).toBe(56);
    });
  });

  describe('headerStyle 计算', () => {
    it('应该返回正确的样式对象', async () => {
      const wrapper = mount({
        setup() {
          const { headerStyle } = useAppLayout();
          return { headerStyle };
        },
        template: '<div></div>',
      });

      await nextTick();

      const style = wrapper.vm.headerStyle;
      expect(style.height).toBe('64px');
      expect(style.paddingTop).toBe('env(safe-area-inset-top, 0)');
    });

    it('headerStyle 应该是响应式的', async () => {
      const wrapper = mount({
        setup() {
          const { headerStyle } = useAppLayout();
          return { headerStyle };
        },
        template: '<div></div>',
      });

      await nextTick();

      const initialStyle = wrapper.vm.headerStyle;
      expect(initialStyle.height).toBe('64px');

      // 即使多次访问，值应该保持一致
      await nextTick();
      expect(wrapper.vm.headerStyle.height).toBe('64px');
    });
  });

  describe('常量值', () => {
    it('HEADER_HEIGHT 应该是 64', async () => {
      // 通过 headerStyle 验证
      const wrapper = mount({
        setup() {
          const { headerStyle } = useAppLayout();
          return { headerStyle };
        },
        template: '<div></div>',
      });

      await nextTick();
      expect(wrapper.vm.headerStyle.height).toBe('64px');
    });

    it('FOOTER_HEIGHT 应该是 56', async () => {
      const wrapper = mount({
        setup() {
          const { footerHeight } = useAppLayout();
          return { footerHeight };
        },
        template: '<div></div>',
      });

      await nextTick();
      expect(wrapper.vm.footerHeight).toBe(56);
    });
  });
});
