import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/vue';
import '@testing-library/jest-dom/vitest';

// 清理每个测试后的 DOM
afterEach(() => {
  cleanup();
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
