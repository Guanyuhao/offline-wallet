import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/vue';
import '@testing-library/jest-dom/vitest';

// 清理每个测试后的 DOM
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (全局设置)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => {
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
        if (typeof handler === 'function') {
          listeners.push(handler);
        }
      },
      removeEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
        const index = listeners.indexOf(handler);
        if (index > -1) listeners.splice(index, 1);
      },
      addListener: (handler: (event: MediaQueryListEvent) => void) => {
        if (typeof handler === 'function') {
          listeners.push(handler);
        }
      }, // deprecated
      removeListener: (handler: (event: MediaQueryListEvent) => void) => {
        const index = listeners.indexOf(handler);
        if (index > -1) listeners.splice(index, 1);
      }, // deprecated
      dispatchEvent: vi.fn(),
    };
  },
});

// Mock CSS.supports
Object.defineProperty(window, 'CSS', {
  writable: true,
  value: {
    supports: vi.fn().mockReturnValue(false),
  },
});

// Mock Tauri APIs
if (typeof globalThis !== 'undefined') {
  // 确保 window 对象存在
  if (!globalThis.window) {
    // @ts-expect-error - Mock window for testing
    globalThis.window = globalThis;
  }

  // Mock Tauri internals
  if (globalThis.window) {
    // @ts-expect-error - Mock Tauri internals for testing
    globalThis.window.__TAURI_INTERNALS__ = {};
    // @ts-expect-error - Mock Tauri metadata
    globalThis.window.__TAURI_METADATA__ = {
      platform: 'desktop',
    };
  }

  // Mock console methods to reduce noise in tests
  const originalConsole = globalThis.console;
  globalThis.console = {
    ...originalConsole,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: originalConsole.error, // 保留 error 以便看到真实错误
  };
}
