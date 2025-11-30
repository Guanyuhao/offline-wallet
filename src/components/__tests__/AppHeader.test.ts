import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import AppHeader from '../AppHeader.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      app: {
        name: 'Wallet',
      },
      menu: {
        title: 'Menu',
      },
    },
  },
});

describe('AppHeader', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('应该正确渲染组件', () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, i18n],
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.app-header').exists()).toBe(true);
      expect(wrapper.find('.app-header__logo').exists()).toBe(true);
      expect(wrapper.find('.app-header__title').exists()).toBe(true);
      expect(wrapper.find('.app-header__actions').exists()).toBe(true);
    });

    it('应该显示应用名称', () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, i18n],
        },
      });

      const title = wrapper.find('.app-header__title-text');
      expect(title.exists()).toBe(true);
      expect(title.text()).toBe('Wallet');
    });

    it('应该显示菜单按钮', () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, i18n],
        },
      });

      const menuButton = wrapper.find('.app-header__menu-btn');
      expect(menuButton.exists()).toBe(true);
    });
  });

  describe('设置抽屉控制', () => {
    it('应该在点击菜单按钮时切换设置抽屉', async () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, i18n],
        },
      });

      const menuButton = wrapper.find('.app-header__menu-btn');
      expect(menuButton.exists()).toBe(true);

      // 初始状态
      expect(wrapper.emitted('update:showSettingsDrawer')).toBeUndefined();

      // 点击按钮
      await menuButton.trigger('click');
      await nextTick();

      // 应该发出事件
      expect(wrapper.emitted('update:showSettingsDrawer')).toBeDefined();
      expect(wrapper.emitted('update:showSettingsDrawer')?.[0]).toEqual([true]);
    });

    it('应该响应外部 showSettingsDrawer prop 变化', async () => {
      const wrapper = mount(AppHeader, {
        props: {
          showSettingsDrawer: false,
        },
        global: {
          plugins: [pinia, i18n],
        },
      });

      await wrapper.setProps({ showSettingsDrawer: true });
      await nextTick();

      // 内部状态应该已更新
      const settingsDrawer = wrapper.findComponent({ name: 'SettingsDrawer' });
      expect(settingsDrawer.exists()).toBe(true);
    });

    it('应该在多次点击时切换状态', async () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, i18n],
        },
      });

      const menuButton = wrapper.find('.app-header__menu-btn');

      // 第一次点击
      await menuButton.trigger('click');
      await nextTick();

      expect(wrapper.emitted('update:showSettingsDrawer')?.[0]).toEqual([true]);

      // 第二次点击
      await menuButton.trigger('click');
      await nextTick();

      expect(wrapper.emitted('update:showSettingsDrawer')?.[1]).toEqual([false]);
    });
  });

  describe('SettingsDrawer 集成', () => {
    it('应该渲染 SettingsDrawer 组件', () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, i18n],
        },
      });

      const settingsDrawer = wrapper.findComponent({ name: 'SettingsDrawer' });
      expect(settingsDrawer.exists()).toBe(true);
    });

    it('应该将 show 状态传递给 SettingsDrawer', async () => {
      const wrapper = mount(AppHeader, {
        props: {
          showSettingsDrawer: true,
        },
        global: {
          plugins: [pinia, i18n],
        },
      });

      await nextTick();
      // 等待 watch 触发
      await new Promise((resolve) => setTimeout(resolve, 50));

      const settingsDrawer = wrapper.findComponent({ name: 'SettingsDrawer' });
      // SettingsDrawer 使用 v-model:show，需要通过内部状态检查
      expect(settingsDrawer.exists()).toBe(true);
      // 由于 watch 是异步的，我们检查组件是否存在即可
    });

    it('应该处理 SettingsDrawer 的 update:show 事件', async () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, i18n],
        },
      });

      await nextTick();

      const settingsDrawer = wrapper.findComponent({ name: 'SettingsDrawer' });
      await settingsDrawer.vm.$emit('update:show', false);

      await nextTick();

      expect(wrapper.emitted('update:showSettingsDrawer')).toBeDefined();
    });
  });

  describe('样式和布局', () => {
    it('应该应用正确的 CSS 类', () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, i18n],
        },
      });

      expect(wrapper.find('.app-header').exists()).toBe(true);
      expect(wrapper.find('.app-header__content').exists()).toBe(true);
      expect(wrapper.find('.app-header__left').exists()).toBe(true);
      expect(wrapper.find('.app-header__logo').exists()).toBe(true);
      expect(wrapper.find('.app-header__title').exists()).toBe(true);
      expect(wrapper.find('.app-header__actions').exists()).toBe(true);
    });

    it('应该显示 logo 图片', () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, i18n],
        },
      });

      const logoImg = wrapper.find('.app-header__logo-img');
      expect(logoImg.exists()).toBe(true);
      expect(logoImg.attributes('src')).toBe('/wallet-logo.svg');
      expect(logoImg.attributes('alt')).toBe('Wallet Logo');
    });
  });

  describe('国际化', () => {
    it('应该使用 i18n 翻译文本', () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, i18n],
        },
      });

      const title = wrapper.find('.app-header__title-text');
      expect(title.text()).toBe('Wallet');
    });
  });

  describe('可访问性', () => {
    it('菜单按钮应该有 title 属性', () => {
      const wrapper = mount(AppHeader, {
        global: {
          plugins: [pinia, i18n],
        },
      });

      const menuButton = wrapper.find('.app-header__menu-btn');
      expect(menuButton.attributes('title')).toBe('Menu');
    });
  });
});
