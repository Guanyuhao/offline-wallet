/**
 * 测试工具函数
 * 提供统一的测试辅助函数和 mock 设置
 */

import { createPinia, setActivePinia, type Pinia } from 'pinia';
import { createI18n, type I18n } from 'vue-i18n';
import { vi } from 'vitest';

/**
 * 创建测试用的 Pinia 实例
 */
export function createTestPinia(): Pinia {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

/**
 * 创建测试用的 i18n 实例
 */
export function createTestI18n(): I18n {
  return createI18n({
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
        nav: {
          account: 'Account',
          transaction: 'Transaction',
          settings: 'Settings',
        },
        messages: {
          walletImported: 'Wallet imported',
          walletCreated: 'Wallet created',
        },
        security: {
          forgotPasswordDesc: 'Forgot password description',
        },
        theme: {
          system: 'System',
          light: 'Light',
          dark: 'Dark',
        },
      },
    },
  });
}

/**
 * 设置全局测试环境
 */
export function setupTestEnvironment() {
  // Mock window.matchMedia (如果还没有设置)
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
}
