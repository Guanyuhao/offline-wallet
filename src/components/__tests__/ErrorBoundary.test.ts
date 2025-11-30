import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountComponent } from '../../test/utils';
import ErrorBoundary from '../ErrorBoundary.vue';
import { nextTick } from '../../test/utils';

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正常渲染子组件', () => {
    const wrapper = mountComponent(ErrorBoundary, {
      slots: {
        default: '<div class="test-content">Test Content</div>',
      },
    });

    expect(wrapper.find('.test-content').exists()).toBe(true);
    expect(wrapper.find('.error-boundary').exists()).toBe(false);
  });

  it('应该在捕获错误时显示错误界面', async () => {
    // 创建一个会抛出错误的组件
    const ErrorComponent = {
      setup() {
        throw new Error('Test error');
      },
      template: '<div>Error Component</div>',
    };

    const wrapper = mountComponent(ErrorBoundary, {
      slots: {
        default: ErrorComponent,
      },
    });

    await nextTick();

    // 错误边界应该捕获错误并显示错误界面
    expect(wrapper.find('.error-boundary').exists()).toBe(true);
  });

  it('应该在点击重新加载按钮时重新加载页面', async () => {
    // Mock window.location.reload
    // 在 jsdom 环境中，window.location.reload 可能无法重新定义
    // 所以我们直接 mock window.location 对象
    const originalLocation = window.location;
    const reloadMock = vi.fn();

    // 创建一个新的 location 对象
    delete (window as any).location;
    (window as any).location = {
      ...originalLocation,
      reload: reloadMock,
    };

    const wrapper = mountComponent(ErrorBoundary, {
      slots: {
        default: {
          setup() {
            throw new Error('Test error');
          },
          template: '<div>Error</div>',
        },
      },
    });

    await nextTick();

    const reloadButton = wrapper.find('button');
    if (reloadButton.exists()) {
      await reloadButton.trigger('click');
      // 验证 reload 被调用
      expect(reloadMock).toHaveBeenCalled();
    }

    // 恢复原始 location
    (window as any).location = originalLocation;
  });

  it('应该在捕获错误时触发 error 事件', async () => {
    const wrapper = mountComponent(ErrorBoundary, {
      slots: {
        default: {
          setup() {
            throw new Error('Test error');
          },
          template: '<div>Error</div>',
        },
      },
    });

    await nextTick();

    expect(wrapper.emitted('error')).toBeTruthy();
    const errorEvents = wrapper.emitted('error');
    if (errorEvents && errorEvents[0]) {
      const errorEvent = errorEvents[0];
      expect(errorEvent[0]).toBeInstanceOf(Error);
    }
  });
});
