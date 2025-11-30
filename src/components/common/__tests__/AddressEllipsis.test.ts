import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import AddressEllipsis from '../AddressEllipsis.vue';

describe('AddressEllipsis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('应该正确渲染组件', () => {
      const wrapper = mount(AddressEllipsis, {
        props: {
          address: '0x1234567890123456789012345678901234567890',
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.address-ellipsis-text').exists()).toBe(true);
    });

    it('应该显示完整的短地址', () => {
      const shortAddress = '0x1234';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address: shortAddress,
        },
      });

      expect(wrapper.text()).toBe(shortAddress);
    });

    it('应该显示省略的长地址', () => {
      const longAddress = '0x1234567890123456789012345678901234567890';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address: longAddress,
        },
      });

      const text = wrapper.text();
      expect(text).toContain('...');
      expect(text.length).toBeLessThan(longAddress.length);
    });
  });

  describe('地址省略逻辑', () => {
    it('应该使用默认的前缀和后缀长度', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
        },
      });

      const text = wrapper.text();
      // 默认 prefixLength=6, suffixLength=4
      expect(text).toMatch(/^0x1234\.\.\.[0-9a-f]{4}$/i);
    });

    it('应该使用自定义的前缀长度', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
          prefixLength: 10,
        },
      });

      const text = wrapper.text();
      expect(text.startsWith('0x12345678')).toBe(true);
    });

    it('应该使用自定义的后缀长度', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
          suffixLength: 6,
        },
      });

      const text = wrapper.text();
      expect(text.endsWith('67890')).toBe(true);
    });

    it('应该正确处理空地址', () => {
      const wrapper = mount(AddressEllipsis, {
        props: {
          address: '',
        },
      });

      expect(wrapper.text()).toBe('');
    });

    it('对于长度不超过 prefix+suffix+3 的地址应该显示完整地址', () => {
      const address = '0x1234567890'; // 11 字符，小于 6+4+3=13
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
        },
      });

      expect(wrapper.text()).toBe(address);
    });
  });

  describe('Popover 功能', () => {
    it('对于长地址应该显示 Popover', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
        },
      });

      const popover = wrapper.findComponent({ name: 'NPopover' });
      expect(popover.exists()).toBe(true);
    });

    it('对于短地址不应该显示 Popover', () => {
      const address = '0x1234';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
        },
      });

      const popover = wrapper.findComponent({ name: 'NPopover' });
      expect(popover.exists()).toBe(false);
    });

    it('Popover 应该显示完整地址', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
        },
      });

      const popover = wrapper.findComponent({ name: 'NPopover' });
      const fullAddress = popover.find('.address-full');
      expect(fullAddress.exists()).toBe(true);
      expect(fullAddress.text()).toBe(address);
    });
  });

  describe('复制功能', () => {
    it('在 copyable 为 true 时应该发出 copy 事件', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
          copyable: true,
        },
      });

      const textElement = wrapper.find('.address-ellipsis-text');
      await textElement.trigger('click');
      await nextTick();

      expect(wrapper.emitted('copy')).toBeDefined();
      expect(wrapper.emitted('copy')?.[0]).toEqual([address]);
    });

    it('在 copyable 为 false 时不应该发出 copy 事件', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
          copyable: false,
        },
      });

      const textElement = wrapper.find('.address-ellipsis-text');
      await textElement.trigger('click');
      await nextTick();

      expect(wrapper.emitted('copy')).toBeUndefined();
    });

    it('在 copyable 为 true 时应该应用可复制样式', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
          copyable: true,
        },
      });

      const textElement = wrapper.find('.address-ellipsis-text');
      expect(textElement.classes()).toContain('is-copyable');
    });

    it('在 copyable 为 false 时不应该应用可复制样式', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
          copyable: false,
        },
      });

      const textElement = wrapper.find('.address-ellipsis-text');
      expect(textElement.classes()).not.toContain('is-copyable');
    });

    it('在地址为空时不应该发出 copy 事件', async () => {
      const wrapper = mount(AddressEllipsis, {
        props: {
          address: '',
          copyable: true,
        },
      });

      const textElement = wrapper.find('.address-ellipsis-text');
      await textElement.trigger('click');
      await nextTick();

      expect(wrapper.emitted('copy')).toBeUndefined();
    });
  });

  describe('边界情况', () => {
    it('应该处理非常长的地址', () => {
      const veryLongAddress = `0x${'1'.repeat(100)}`;
      const wrapper = mount(AddressEllipsis, {
        props: {
          address: veryLongAddress,
        },
      });

      const text = wrapper.text();
      expect(text).toContain('...');
      expect(text.length).toBeLessThan(veryLongAddress.length);
    });

    it('应该处理特殊字符', () => {
      const addressWithSpecialChars = '0x1234567890123456789012345678901234567890!@#';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address: addressWithSpecialChars,
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('应该处理 Unicode 字符', () => {
      const addressWithUnicode = '0x1234567890123456789012345678901234567890测试';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address: addressWithUnicode,
        },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('样式', () => {
    it('应该应用正确的 CSS 类', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
        },
      });

      expect(wrapper.find('.address-ellipsis-text').exists()).toBe(true);
    });

    it('在可复制时应该应用 is-copyable 类', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const wrapper = mount(AddressEllipsis, {
        props: {
          address,
          copyable: true,
        },
      });

      const textElement = wrapper.find('.address-ellipsis-text');
      expect(textElement.classes()).toContain('is-copyable');
    });
  });
});
