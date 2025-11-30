import { ref, onErrorCaptured } from 'vue';

export interface ErrorInfo {
  error: Error;
  componentStack?: string | undefined;
  errorInfo?: string | undefined;
  timestamp: number;
}

const errors = ref<ErrorInfo[]>([]);
const maxErrors = 50; // 最多保存50个错误

/**
 * 错误处理 composable
 * 用于统一处理应用中的错误
 */
export function useErrorHandler() {
  /**
   * 记录错误
   */
  function logError(error: Error, componentStack?: string, errorInfo?: string) {
    const errorInfoObj: ErrorInfo = {
      error,
      componentStack,
      errorInfo,
      timestamp: Date.now(),
    };

    errors.value.push(errorInfoObj);

    // 限制错误数量
    if (errors.value.length > maxErrors) {
      errors.value.shift();
    }

    // 发送到错误监控服务（可以集成 Sentry, LogRocket 等）
    if (import.meta.env.PROD) {
      // 生产环境发送错误
      sendErrorToMonitoring(errorInfoObj);
    } else {
      // 开发环境打印到控制台
      console.error('Error logged:', errorInfoObj);
    }
  }

  /**
   * 发送错误到监控服务
   */
  function sendErrorToMonitoring(_errorInfo: ErrorInfo) {
    // TODO: 集成错误监控服务
    // 例如: Sentry.captureException(errorInfo.error, { extra: errorInfo });

    // 临时实现：发送到后端（如果有）
    try {
      // fetch('/api/errors', {
      //   method: 'POST',
      //   body: JSON.stringify(errorInfo),
      // });
    } catch (e) {
      console.error('Failed to send error to monitoring:', e);
    }
  }

  /**
   * 获取所有错误
   */
  function getErrors(): ErrorInfo[] {
    return errors.value;
  }

  /**
   * 清除所有错误
   */
  function clearErrors() {
    errors.value = [];
  }

  /**
   * Vue 错误捕获钩子
   */
  function setupErrorCapture() {
    onErrorCaptured((err: Error, instance: any, info: string) => {
      logError(err, instance?.$?.type?.__name, info);
      return false; // 阻止错误继续传播
    });
  }

  return {
    logError,
    getErrors,
    clearErrors,
    setupErrorCapture,
  };
}

/**
 * 全局错误处理
 */
export function setupGlobalErrorHandlers() {
  // 捕获未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

    const { logError } = useErrorHandler();
    logError(error, undefined, 'Unhandled Promise Rejection');
  });

  // 捕获全局错误
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);
    const { logError } = useErrorHandler();
    logError(error, undefined, `Global Error: ${event.filename}:${event.lineno}`);
  });
}
