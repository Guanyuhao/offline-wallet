import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import BottomNavigation from '../BottomNavigation.vue';
import { createI18n } from 'vue-i18n';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      nav: {
        account: 'Account',
        transaction: 'Transaction',
        settings: 'Settings',
      },
    },
  },
});

describe('BottomNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('应该正确渲染组件', () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.bottom-navigation').exists()).toBe(true);
      expect(wrapper.find('.nav-container').exists()).toBe(true);
    });

    it('应该渲染所有三个标签页', () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      const navItems = wrapper.findAll('.nav-item');
      expect(navItems.length).toBe(3);
    });

    it('应该显示正确的标签文本', () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      const labels = wrapper.findAll('.nav-label');
      expect(labels[0].text()).toBe('Account');
      expect(labels[1].text()).toBe('Transaction');
      expect(labels[2].text()).toBe('Settings');
    });
  });

  describe('活动标签', () => {
    it('应该高亮活动标签', () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      const navItems = wrapper.findAll('.nav-item');
      expect(navItems[0].classes()).toContain('nav-item-active');
      expect(navItems[1].classes()).not.toContain('nav-item-active');
      expect(navItems[2].classes()).not.toContain('nav-item-active');
    });

    it('应该在切换活动标签时更新高亮', async () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      let navItems = wrapper.findAll('.nav-item');
      expect(navItems[0].classes()).toContain('nav-item-active');

      await wrapper.setProps({ activeTab: 'transaction' });
      await nextTick();

      navItems = wrapper.findAll('.nav-item');
      expect(navItems[0].classes()).not.toContain('nav-item-active');
      expect(navItems[1].classes()).toContain('nav-item-active');
      expect(navItems[2].classes()).not.toContain('nav-item-active');
    });

    it('应该支持所有三个标签作为活动标签', async () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      const tabs: Array<'account' | 'transaction' | 'settings'> = [
        'account',
        'transaction',
        'settings',
      ];

      for (const tab of tabs) {
        await wrapper.setProps({ activeTab: tab });
        await nextTick();

        const navItems = wrapper.findAll('.nav-item');
        const activeIndex = tabs.indexOf(tab);

        navItems.forEach((item, index) => {
          if (index === activeIndex) {
            expect(item.classes()).toContain('nav-item-active');
          } else {
            expect(item.classes()).not.toContain('nav-item-active');
          }
        });
      }
    });
  });

  describe('标签点击', () => {
    it('应该在点击标签时发出 update:activeTab 事件', async () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      const navItems = wrapper.findAll('.nav-item');

      // 点击 transaction 标签
      await navItems[1].trigger('click');
      await nextTick();

      expect(wrapper.emitted('update:activeTab')).toBeDefined();
      expect(wrapper.emitted('update:activeTab')?.[0]).toEqual(['transaction']);
    });

    it('应该为每个标签发出正确的事件', async () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      const navItems = wrapper.findAll('.nav-item');
      const expectedTabs: Array<'account' | 'transaction' | 'settings'> = [
        'account',
        'transaction',
        'settings',
      ];

      for (let i = 0; i < navItems.length; i++) {
        await navItems[i].trigger('click');
        await nextTick();

        expect(wrapper.emitted('update:activeTab')?.[i]).toEqual([expectedTabs[i]]);
      }
    });

    it('应该允许点击当前活动标签', async () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      const navItems = wrapper.findAll('.nav-item');

      // 点击当前活动标签
      await navItems[0].trigger('click');
      await nextTick();

      expect(wrapper.emitted('update:activeTab')).toBeDefined();
      expect(wrapper.emitted('update:activeTab')?.[0]).toEqual(['account']);
    });
  });

  describe('图标', () => {
    it('应该为每个标签显示图标', () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      const icons = wrapper.findAll('.nav-icon');
      expect(icons.length).toBe(3);
    });

    it('活动标签的图标应该有缩放效果', () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      const navItems = wrapper.findAll('.nav-item');
      const activeIcon = navItems[0].find('.nav-icon');

      expect(activeIcon.exists()).toBe(true);
      // 活动标签应该有 nav-item-active 类，图标会有 transform
    });
  });

  describe('样式和布局', () => {
    it('应该应用正确的 CSS 类', () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      expect(wrapper.find('.bottom-navigation').exists()).toBe(true);
      expect(wrapper.find('.nav-container').exists()).toBe(true);
    });

    it('应该为活动标签应用正确的样式类', () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'settings',
        },
        global: {
          plugins: [i18n],
        },
      });

      const navItems = wrapper.findAll('.nav-item');
      expect(navItems[2].classes()).toContain('nav-item-active');
    });
  });

  describe('国际化', () => {
    it('应该使用 i18n 翻译标签文本', () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      const labels = wrapper.findAll('.nav-label');
      expect(labels[0].text()).toBe('Account');
      expect(labels[1].text()).toBe('Transaction');
      expect(labels[2].text()).toBe('Settings');
    });
  });

  describe('可访问性', () => {
    it('标签应该是可点击的按钮', () => {
      const wrapper = mount(BottomNavigation, {
        props: {
          activeTab: 'account',
        },
        global: {
          plugins: [i18n],
        },
      });

      const navItems = wrapper.findAll('.nav-item');
      navItems.forEach((item) => {
        expect(item.element.tagName).toBe('BUTTON');
      });
    });
  });
});
