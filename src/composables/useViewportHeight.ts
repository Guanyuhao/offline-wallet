/**
 * 视口高度管理工具 - 基于 W3C 官方标准
 *
 * ==================== 问题原因 ====================
 *
 * 这是移动端 WebView 渲染的经典问题，主要原因：
 *
 * 1. 【地址栏动态显示/隐藏】
 *    - iOS Safari 和 Android Chrome 的地址栏会随滚动显示/隐藏
 *    - 传统 100vh 包含地址栏高度，导致实际可视区域不准确
 *    - 滚动时地址栏隐藏，100vh 突然变大，造成布局跳动
 *
 * 2. 【虚拟键盘弹起】
 *    - iOS: 键盘弹起时，视口高度不变，但可视区域被键盘遮挡
 *    - Android: 键盘弹起时，WebView 视口高度会动态调整
 *    - 不同平台处理方式不同，导致布局不一致
 *
 * 3. 【position: fixed 元素异常】
 *    - iOS Safari 中，键盘弹起时 fixed 元素可能被重新定位
 *    - 导致底部导航栏、固定按钮等元素位置错乱
 *
 * ==================== W3C 官方标准解决方案 ====================
 *
 * W3C 提供了三层官方标准方案（按优先级）：
 *
 * 1. 【viewport meta: interactive-widget=resizes-content】
 *    标准：CSS Viewport Module Level 4
 *    作用：告诉浏览器键盘弹起时自动调整视口大小
 *    状态：✅ 已在 index.html 中配置
 *    参考：https://www.w3.org/TR/css-viewport-4/#interactive-widget
 *
 * 2. 【CSS 视口单位: dvh/svh/lvh】
 *    标准：CSS Values and Units Module Level 4
 *    - dvh (dynamic viewport height): 动态视口高度，排除地址栏和键盘
 *    - svh (small viewport height): 小视口高度，包含地址栏和键盘
 *    - lvh (large viewport height): 大视口高度，排除地址栏和键盘
 *    状态：✅ 现代浏览器原生支持（Chrome 108+, Safari 15.4+, Firefox 101+）
 *    参考：https://www.w3.org/TR/css-values-4/#viewport-relative-lengths
 *
 * 3. 【visualViewport API】
 *    标准：Visual Viewport API (W3C Working Draft)
 *    作用：提供精确的可视视口信息，包括键盘弹起时的尺寸
 *    状态：✅ 广泛支持（Chrome 61+, Safari 13+, Firefox 91+）
 *    参考：https://www.w3.org/TR/visual-viewport/
 *
 * ==================== 实现策略 ====================
 *
 * 1. 优先使用 CSS dvh 单位（零 JS 开销，性能最佳）
 * 2. 如果浏览器不支持 dvh，使用 visualViewport API + CSS 变量降级
 * 3. 最小化 JS 干预，让浏览器原生处理（符合 W3C 标准）
 *
 * ==================== 参考文档 ====================
 *
 * - CSS Values and Units Level 4: https://www.w3.org/TR/css-values-4/
 * - CSS Viewport Module Level 4: https://www.w3.org/TR/css-viewport-4/
 * - Visual Viewport API: https://www.w3.org/TR/visual-viewport/
 * - MDN CSS Viewport: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Viewport
 */

export interface ViewportHeightOptions {
  /** 是否启用防抖，默认 true */
  debounce?: boolean;
  /** 防抖延迟时间（ms），默认 16（约一帧） */
  debounceDelay?: number;
}

const DEFAULT_OPTIONS: Required<ViewportHeightOptions> = {
  debounce: true,
  debounceDelay: 16,
};

/**
 * 检测浏览器对现代 CSS 视口单位的支持
 *
 * W3C 标准：CSS Values and Units Module Level 4
 * 参考：https://www.w3.org/TR/css-values-4/#viewport-relative-lengths
 *
 * 兼容性：
 * - dvh: Chrome 108+, Safari 15.4+, Firefox 101+
 * - svh/lvh: 同上
 */
function detectViewportUnitSupport(): {
  supportsDvh: boolean;
  supportsSvh: boolean;
  supportsLvh: boolean;
} {
  return {
    supportsDvh: CSS.supports('height', '100dvh'),
    supportsSvh: CSS.supports('height', '100svh'),
    supportsLvh: CSS.supports('height', '100lvh'),
  };
}

/**
 * 获取当前视口高度
 *
 * 优先使用 W3C visualViewport API（最准确，特别是键盘弹起时）
 *
 * W3C 标准：Visual Viewport API
 * 参考：https://www.w3.org/TR/visual-viewport/
 *
 * visualViewport.height 的优势：
 * - 排除键盘高度，返回实际可视区域
 * - 实时更新，键盘弹起/收起时自动变化
 * - 跨平台一致，iOS 和 Android 行为统一
 */
function getViewportHeight(): number {
  // W3C 标准：visualViewport API
  if (window.visualViewport) {
    return window.visualViewport.height;
  }

  // 降级方案：使用 window.innerHeight（不准确，但兼容旧浏览器）
  return window.innerHeight;
}

/**
 * 更新 CSS 变量（仅在不支持现代单位时使用）
 */
function updateViewportCSS(height: number): void {
  const vh = height * 0.01;
  const root = document.documentElement;

  // 设置降级用的 CSS 变量
  root.style.setProperty('--viewport-height', `${height}px`);
  root.style.setProperty('--vh', `${vh}px`);
}

/**
 * 初始化视口高度管理
 *
 * 策略：
 * 1. 如果浏览器支持 dvh，主要依赖 CSS，JS 只做最小更新
 * 2. 如果不支持，使用 visualViewport API + CSS 变量降级
 *
 * @param options 配置选项
 * @returns 清理函数
 */
export function setupViewportHeight(options: ViewportHeightOptions = {}): () => void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 检测浏览器支持
  const support = detectViewportUnitSupport();

  // 如果完全支持现代 CSS 单位，可以大幅减少 JS 更新
  // 但仍需要监听 visualViewport（用于键盘弹起时的精确处理）
  const needsJSUpdate = !support.supportsDvh;

  // 更新函数
  const updateViewport = () => {
    if (needsJSUpdate) {
      const height = getViewportHeight();
      updateViewportCSS(height);
    }
  };

  // 防抖包装
  let rafId: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedUpdate = opts.debounce
    ? () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
          }
          rafId = requestAnimationFrame(() => {
            updateViewport();
            rafId = null;
          });
          timeoutId = null;
        }, opts.debounceDelay);
      }
    : () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(() => {
          updateViewport();
          rafId = null;
        });
      };

  // 初始设置
  updateViewport();

  // 事件监听器列表（用于清理）
  const listeners: Array<{
    target: EventTarget;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
  }> = [];

  // W3C 标准：visualViewport API
  // 这是处理键盘弹起的最佳方案（即使支持 dvh，也需要这个来精确处理）
  if (window.visualViewport) {
    const resizeHandler = debouncedUpdate as EventListener;
    window.visualViewport.addEventListener('resize', resizeHandler, { passive: true });
    listeners.push({ target: window.visualViewport, event: 'resize', handler: resizeHandler });

    const scrollHandler = debouncedUpdate as EventListener;
    window.visualViewport.addEventListener('scroll', scrollHandler, { passive: true });
    listeners.push({ target: window.visualViewport, event: 'scroll', handler: scrollHandler });
  }

  // 降级：监听窗口大小变化（仅在需要时）
  if (needsJSUpdate) {
    const resizeHandler = debouncedUpdate as EventListener;
    window.addEventListener('resize', resizeHandler, { passive: true });
    listeners.push({ target: window, event: 'resize', handler: resizeHandler });

    const orientationHandler = () => {
      setTimeout(debouncedUpdate, 100);
    };
    window.addEventListener('orientationchange', orientationHandler);
    listeners.push({ target: window, event: 'orientationchange', handler: orientationHandler });
  }

  // 返回清理函数
  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    listeners.forEach(({ target, event, handler, options }) => {
      target.removeEventListener(event, handler, options);
    });
  };
}

/**
 * 获取当前视口高度（响应式）
 */
export function getCurrentViewportHeight(): number {
  return getViewportHeight();
}

/**
 * 判断键盘是否可见
 * 基于 W3C visualViewport API
 */
export function isKeyboardVisible(threshold: number = 0.75): boolean {
  if (window.visualViewport) {
    return window.visualViewport.height < window.innerHeight * threshold;
  }
  return window.innerHeight < window.outerHeight * threshold;
}
