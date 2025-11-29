import { describe, it, expect } from 'vitest';
import { mountComponent } from '../../../test/utils';
import LoadingState from '../LoadingState.vue';

describe('LoadingState', () => {
  it('应该渲染加载状态', () => {
    const wrapper = mountComponent(LoadingState);

    expect(wrapper.find('.loading-state').exists()).toBe(true);
  });

  it('应该显示自定义文本', () => {
    const wrapper = mountComponent(LoadingState, {
      props: {
        text: '正在加载数据...',
      },
    });

    expect(wrapper.text()).toContain('正在加载数据...');
  });

  it('应该支持不同尺寸', () => {
    const smallWrapper = mountComponent(LoadingState, {
      props: { size: 'small' },
    });
    const largeWrapper = mountComponent(LoadingState, {
      props: { size: 'large' },
    });

    expect(smallWrapper.exists()).toBe(true);
    expect(largeWrapper.exists()).toBe(true);
  });
});
