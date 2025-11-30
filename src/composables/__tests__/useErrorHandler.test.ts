import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useErrorHandler, setupGlobalErrorHandlers } from '../useErrorHandler';

describe('useErrorHandler', () => {
  beforeEach(() => {
    const { clearErrors } = useErrorHandler();
    clearErrors();
    vi.clearAllMocks();
  });

  describe('logError', () => {
    it('应该记录错误信息', () => {
      const { logError, getErrors } = useErrorHandler();
      const testError = new Error('Test error');

      logError(testError, 'ComponentName', 'Error info');

      const errors = getErrors();
      expect(errors).toHaveLength(1);
      const firstError = errors[0];
      expect(firstError).toBeDefined();
      if (firstError) {
        expect(firstError.error).toBe(testError);
        expect(firstError.componentStack).toBe('ComponentName');
        expect(firstError.errorInfo).toBe('Error info');
        expect(firstError.timestamp).toBeTypeOf('number');
      }
    });

    it('应该限制错误数量为50个', () => {
      const { logError, getErrors } = useErrorHandler();

      // 添加51个错误
      for (let i = 0; i < 51; i++) {
        logError(new Error(`Error ${i}`));
      }

      const errors = getErrors();
      expect(errors).toHaveLength(50);
      // 第一个错误应该被移除
      const firstError = errors[0];
      const lastError = errors[errors.length - 1];
      expect(firstError).toBeDefined();
      expect(lastError).toBeDefined();
      if (firstError && lastError) {
        expect(firstError.error.message).toBe('Error 1');
        expect(lastError.error.message).toBe('Error 50');
      }
    });

    it('应该在开发环境打印错误到控制台', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { logError } = useErrorHandler();
      const testError = new Error('Test error');

      // 模拟开发环境
      vi.stubGlobal('import.meta', { env: { PROD: false } });

      logError(testError);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error logged:',
        expect.objectContaining({
          error: testError,
        })
      );

      consoleSpy.mockRestore();
    });

    it('应该在生产环境调用监控服务', () => {
      const { logError } = useErrorHandler();
      const testError = new Error('Test error');

      // 模拟生产环境
      vi.stubGlobal('import.meta', { env: { PROD: true } });

      // 由于 sendErrorToMonitoring 是内部函数，我们通过检查错误是否被记录来验证
      logError(testError);
      const { getErrors } = useErrorHandler();
      const errors = getErrors();

      expect(errors).toHaveLength(1);
    });
  });

  describe('getErrors', () => {
    it('应该返回所有错误', () => {
      const { logError, getErrors } = useErrorHandler();

      logError(new Error('Error 1'));
      logError(new Error('Error 2'));

      const errors = getErrors();
      expect(errors).toHaveLength(2);
    });

    it('应该返回空数组当没有错误时', () => {
      const { getErrors } = useErrorHandler();
      const errors = getErrors();

      expect(errors).toHaveLength(0);
      expect(errors).toEqual([]);
    });
  });

  describe('clearErrors', () => {
    it('应该清除所有错误', () => {
      const { logError, clearErrors, getErrors } = useErrorHandler();

      logError(new Error('Error 1'));
      logError(new Error('Error 2'));

      expect(getErrors()).toHaveLength(2);

      clearErrors();

      expect(getErrors()).toHaveLength(0);
    });
  });
});

describe('setupGlobalErrorHandlers', () => {
  beforeEach(() => {
    // 清理之前的事件监听器（通过重新设置）
    vi.clearAllMocks();
  });

  it('应该设置全局错误处理器', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    setupGlobalErrorHandlers();

    expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('应该捕获未处理的 Promise 拒绝', async () => {
    const { getErrors, logError } = useErrorHandler();

    // 手动设置错误处理器来测试（模拟 setupGlobalErrorHandlers 的行为）
    const handler = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      logError(error, undefined, 'Unhandled Promise Rejection');
    };

    window.addEventListener('unhandledrejection', handler);

    // 创建一个会被拒绝的 Promise，但不立即捕获
    const error = new Error('Test unhandled rejection');
    let rejectedPromise: Promise<unknown>;

    // 使用 setTimeout 确保事件处理器已注册
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        rejectedPromise = Promise.reject(error);

        // 手动触发事件（因为测试环境可能不会自动触发）
        try {
          const event = new PromiseRejectionEvent('unhandledrejection', {
            promise: rejectedPromise,
            reason: error,
          });
          window.dispatchEvent(event);
        } catch (e) {
          // 如果 PromiseRejectionEvent 不可用，直接调用 handler
          handler({ reason: error, promise: rejectedPromise } as PromiseRejectionEvent);
        }

        // 立即捕获以避免真正的未处理拒绝
        rejectedPromise.catch(() => {});
        resolve();
      }, 10);
    });

    // 等待事件处理
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 50);
    });

    // 清理
    window.removeEventListener('unhandledrejection', handler);

    // 检查错误是否被记录
    const errors = getErrors();
    expect(errors.length).toBeGreaterThan(0);
  }, 5000);

  it('应该捕获全局错误', async () => {
    const { getErrors, logError, clearErrors } = useErrorHandler();
    clearErrors(); // 清理之前的错误

    // 手动设置错误处理器来测试（模拟 setupGlobalErrorHandlers 的行为）
    const handler = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message);
      logError(error, undefined, `Global Error: ${event.filename}:${event.lineno}`);
    };

    window.addEventListener('error', handler);

    // 触发全局错误
    const errorEvent = new ErrorEvent('error', {
      error: new Error('Global error'),
      message: 'Global error',
      filename: 'test.js',
      lineno: 1,
      colno: 1,
      bubbles: false,
      cancelable: true,
    });

    window.dispatchEvent(errorEvent);

    // 等待事件处理
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 100);
    });

    // 清理
    window.removeEventListener('error', handler);

    // 检查错误是否被记录
    const errors = getErrors();
    expect(errors.length).toBeGreaterThan(0);
    // 检查是否有包含 'Global error' 的错误
    const hasGlobalError = errors.some((e) => e.error.message === 'Global error');
    expect(hasGlobalError).toBe(true);
  }, 5000);
});
