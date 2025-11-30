import { describe, it, expect } from 'vitest';
import { mountComponent } from '../../../test/utils';
import ErrorState from '../ErrorState.vue';

describe('ErrorState', () => {
  it('应该渲染错误状态', () => {
    const wrapper = mountComponent(ErrorState);

    expect(wrapper.find('.error-state').exists()).toBe(true);
  });

  it('应该显示自定义标题', () => {
    const wrapper = mountComponent(ErrorState, {
      props: {
        title: '出错了',
      },
    });

    expect(wrapper.text()).toContain('出错了');
  });

  it('应该显示自定义描述', () => {
    const wrapper = mountComponent(ErrorState, {
      props: {
        description: '发生了未知错误',
      },
    });

    expect(wrapper.text()).toContain('发生了未知错误');
  });

  it('应该在 showRetry 为 true 时显示重试按钮', () => {
    const wrapper = mountComponent(ErrorState, {
      props: {
        showRetry: true,
      },
    });

    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.text()).toContain('重试');
  });

  it('应该在 showRetry 为 false 时不显示重试按钮', () => {
    const wrapper = mountComponent(ErrorState, {
      props: {
        showRetry: false,
      },
    });

    const button = wrapper.find('button');
    expect(button.exists()).toBe(false);
  });

  it('应该在点击重试按钮时触发 retry 事件', async () => {
    const wrapper = mountComponent(ErrorState, {
      props: {
        showRetry: true,
      },
    });

    const button = wrapper.find('button');
    await button.trigger('click');

    expect(wrapper.emitted('retry')).toBeTruthy();
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });
});
