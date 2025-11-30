/**
 * 性能优化 Composable
 *
 * 提供通用的性能优化工具函数
 */

import { shallowRef, markRaw, type Ref } from 'vue';

/**
 * 使用浅层响应式引用优化大对象性能
 * 适用于不需要深度响应式的大对象（如配置、数据表等）
 */
export function useShallowRef<T>(value: T): Ref<T> {
  return shallowRef(value);
}

/**
 * 标记对象为原始对象，跳过响应式转换
 * 适用于第三方库实例、DOM 元素等
 */
export function useMarkRaw<T extends object>(value: T): T {
  return markRaw(value);
}

/**
 * 防抖函数 - 优化频繁触发的事件
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数 - 限制函数执行频率
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * 使用 requestIdleCallback 优化非关键任务
 * 在浏览器空闲时执行
 */
export function useIdleCallback(callback: () => void, options?: { timeout?: number }): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    // 降级到 setTimeout
    setTimeout(callback, 1);
  }
}

/**
 * 批量更新 DOM - 减少重排重绘
 */
export function useBatchUpdate(updates: (() => void)[]): void {
  // 使用 requestAnimationFrame 批量执行更新
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

/**
 * 虚拟滚动辅助函数 - 计算可见范围
 */
export function useVirtualScrollRange(
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number
): { start: number; end: number } {
  const start = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(start + visibleCount + 1, totalItems); // +1 用于缓冲

  return {
    start: Math.max(0, start - 1), // -1 用于缓冲
    end,
  };
}

/**
 * 图片懒加载辅助
 */
export function useLazyImage(src: string): {
  imageSrc: Ref<string | null>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
  loadImage: () => void;
} {
  const imageSrc = shallowRef<string | null>(null);
  const isLoading = shallowRef(false);
  const error = shallowRef<Error | null>(null);

  const loadImage = () => {
    if (imageSrc.value === src) return;

    isLoading.value = true;
    error.value = null;

    const img = new Image();
    img.onload = () => {
      imageSrc.value = src;
      isLoading.value = false;
    };
    img.onerror = () => {
      error.value = new Error('Failed to load image');
      isLoading.value = false;
    };
    img.src = src;
  };

  return {
    imageSrc,
    isLoading,
    error,
    loadImage,
  };
}
