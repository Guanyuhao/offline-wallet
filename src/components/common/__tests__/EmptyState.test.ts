import { describe, it, expect } from 'vitest';
import { mountComponent } from '../../../test/utils';
import EmptyState from '../EmptyState.vue';

describe('EmptyState', () => {
  it('应该渲染空状态', () => {
    const wrapper = mountComponent(EmptyState);

    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });

  it('应该显示自定义标题', () => {
    const wrapper = mountComponent(EmptyState, {
      props: {
        title: '没有数据',
      },
    });

    expect(wrapper.text()).toContain('没有数据');
  });

  it('应该显示自定义描述', () => {
    const wrapper = mountComponent(EmptyState, {
      props: {
        description: '暂无内容',
      },
    });

    expect(wrapper.text()).toContain('暂无内容');
  });

  it('应该在 showAction 为 true 时显示操作按钮', () => {
    const wrapper = mountComponent(EmptyState, {
      props: {
        showAction: true,
        actionText: '创建',
      },
    });

    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.text()).toContain('创建');
  });

  it('应该在 showAction 为 false 时不显示操作按钮', () => {
    const wrapper = mountComponent(EmptyState, {
      props: {
        showAction: false,
      },
    });

    const button = wrapper.find('button');
    expect(button.exists()).toBe(false);
  });

  it('应该在点击操作按钮时触发 action 事件', async () => {
    const wrapper = mountComponent(EmptyState, {
      props: {
        showAction: true,
        actionText: '创建',
      },
    });

    const button = wrapper.find('button');
    await button.trigger('click');

    expect(wrapper.emitted('action')).toBeTruthy();
    expect(wrapper.emitted('action')).toHaveLength(1);
  });
});
