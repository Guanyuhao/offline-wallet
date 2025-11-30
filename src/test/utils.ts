import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import type { Component } from 'vue';
import zhCN from '../i18n/locales/zh-CN';
import enUS from '../i18n/locales/en-US';

/**
 * 创建测试用的 i18n 实例
 */
export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'zh-CN',
    fallbackLocale: 'en-US',
    messages: {
      'zh-CN': zhCN,
      'en-US': enUS,
    },
  });
}

/**
 * 创建测试用的 Pinia 实例
 */
export function createTestPinia() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

/**
 * 测试工具函数：挂载组件并注入必要的依赖
 */
export function mountComponent(
  component: Component,
  options: {
    props?: Record<string, any>;
    slots?: Record<string, any>;
    global?: any;
  } = {}
) {
  const pinia = createTestPinia();
  const i18n = createTestI18n();

  return mount(component, {
    ...options,
    global: {
      plugins: [pinia, i18n],
      ...options.global,
    },
  });
}

/**
 * 等待下一个 tick
 */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * 模拟用户输入
 */
export async function typeInput(wrapper: VueWrapper<any>, selector: string, value: string) {
  const input = wrapper.find(selector);
  await input.setValue(value);
  await input.trigger('input');
  await nextTick();
}

/**
 * 模拟点击
 */
export async function clickElement(wrapper: VueWrapper<any>, selector: string) {
  const element = wrapper.find(selector);
  await element.trigger('click');
  await nextTick();
}
