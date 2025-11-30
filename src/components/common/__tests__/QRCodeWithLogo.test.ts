import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import QRCodeWithLogo from '../QRCodeWithLogo.vue';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('QRCodeWithLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('渲染', () => {
    it('应该正确渲染组件', () => {
      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
        },
      });

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.qr-code-container').exists()).toBe(true);
    });

    it('应该在加载时显示骨架屏', async () => {
      vi.mocked(invoke).mockImplementation(() => new Promise(() => {})); // 永不解析的 Promise

      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
        },
      });

      await nextTick();

      expect(wrapper.find('.qr-skeleton').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'NSkeleton' }).exists()).toBe(true);

      wrapper.unmount();
    });

    it('应该在生成成功时显示二维码图片', async () => {
      const mockImageData =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      vi.mocked(invoke).mockResolvedValueOnce(mockImageData);

      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
        },
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.find('.qr-code-image').exists()).toBe(true);
      const img = wrapper.find('.qr-code-image');
      expect(img.attributes('src')).toBe(mockImageData);
    });

    it('应该在生成失败时显示错误信息', async () => {
      vi.mocked(invoke)
        .mockRejectedValueOnce(new Error('Generation failed'))
        .mockRejectedValueOnce(new Error('Fallback also failed'));

      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
        },
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.find('.qr-error').exists()).toBe(true);
      expect(wrapper.text()).toContain('Generation failed');
    });
  });

  describe('二维码生成', () => {
    it('应该在挂载时调用生成函数', async () => {
      vi.mocked(invoke).mockResolvedValueOnce('data:image/png;base64,test');

      mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
        },
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(invoke).toHaveBeenCalledWith('generate_qrcode_with_logo_cmd', {
        data: 'test data',
        logoPath: null,
      });
    });

    it('应该使用带 logo 的生成方法', async () => {
      const mockImageData = 'data:image/png;base64,test';
      vi.mocked(invoke).mockResolvedValueOnce(mockImageData);

      mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
        },
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(invoke).toHaveBeenCalledWith('generate_qrcode_with_logo_cmd', {
        data: 'test data',
        logoPath: null,
      });
    });

    it('应该在带 logo 方法失败时回退到普通方法', async () => {
      const mockImageData = 'data:image/png;base64,test';
      vi.mocked(invoke)
        .mockRejectedValueOnce(new Error('Logo method failed'))
        .mockResolvedValueOnce(mockImageData);

      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
        },
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(invoke).toHaveBeenCalledWith('generate_qrcode_with_logo_cmd', {
        data: 'test data',
        logoPath: null,
      });
      expect(invoke).toHaveBeenCalledWith('generate_qrcode_cmd', {
        data: 'test data',
      });
      expect(wrapper.find('.qr-code-image').exists()).toBe(true);
    });

    it('应该在 value 变化时重新生成二维码', async () => {
      const mockImageData1 = 'data:image/png;base64,test1';
      const mockImageData2 = 'data:image/png;base64,test2';
      vi.mocked(invoke).mockResolvedValueOnce(mockImageData1).mockResolvedValueOnce(mockImageData2);

      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data 1',
        },
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.find('.qr-code-image').attributes('src')).toBe(mockImageData1);

      await wrapper.setProps({ value: 'test data 2' });
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(invoke).toHaveBeenCalledTimes(2);
      expect(wrapper.find('.qr-code-image').attributes('src')).toBe(mockImageData2);
    });

    it('应该在 value 为空时清除二维码', async () => {
      const mockImageData = 'data:image/png;base64,test';
      vi.mocked(invoke).mockResolvedValueOnce(mockImageData);

      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
        },
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.find('.qr-code-image').exists()).toBe(true);

      await wrapper.setProps({ value: '' });
      await nextTick();

      // 空值时应该清除图片
      expect(wrapper.find('.qr-code-image').exists()).toBe(false);
    });
  });

  describe('尺寸', () => {
    it('应该使用默认尺寸', () => {
      const mockImageData = 'data:image/png;base64,test';
      vi.mocked(invoke).mockResolvedValueOnce(mockImageData);

      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
        },
      });

      // 默认 size 应该是 280
      // 可以通过检查组件内部状态或渲染结果来验证
      expect(wrapper.props('size')).toBeUndefined(); // 使用默认值
    });

    it('应该使用自定义尺寸', async () => {
      const mockImageData = 'data:image/png;base64,test';
      vi.mocked(invoke).mockResolvedValueOnce(mockImageData);

      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
          size: 400,
        },
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const img = wrapper.find('.qr-code-image');
      expect(img.attributes('width')).toBe('400');
      expect(img.attributes('height')).toBe('400');
    });

    it('应该将尺寸传递给骨架屏', async () => {
      vi.mocked(invoke).mockImplementation(() => new Promise(() => {}));

      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
          size: 300,
        },
      });

      await nextTick();

      const skeleton = wrapper.findComponent({ name: 'NSkeleton' });
      expect(skeleton.props('width')).toBe(300);
      expect(skeleton.props('height')).toBe(300);
    });
  });

  describe('错误处理', () => {
    it('应该处理生成错误', async () => {
      vi.mocked(invoke)
        .mockRejectedValueOnce(new Error('Generation failed'))
        .mockRejectedValueOnce(new Error('Fallback failed'));

      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
        },
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.find('.qr-error').exists()).toBe(true);
      // 错误消息可能是第一个或第二个错误
      const errorText = wrapper.text();
      expect(errorText).toMatch(/Generation failed|Fallback failed/);
    });

    it('应该处理没有错误消息的情况', async () => {
      vi.mocked(invoke).mockRejectedValueOnce({}).mockRejectedValueOnce({});

      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
        },
      });

      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.find('.qr-error').exists()).toBe(true);
    });
  });

  describe('加载状态', () => {
    it('应该在生成过程中显示加载状态', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(invoke).mockReturnValueOnce(promise);

      const wrapper = mount(QRCodeWithLogo, {
        props: {
          value: 'test data',
        },
      });

      await nextTick();

      expect(wrapper.find('.qr-skeleton').exists()).toBe(true);

      resolvePromise!('data:image/png;base64,test');
      await promise;
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(wrapper.find('.qr-skeleton').exists()).toBe(false);
    });
  });
});
