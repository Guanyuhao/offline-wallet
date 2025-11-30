/**
 * 应用布局管理 Composable
 *
 * 布局结构：
 * - Layout: 动态视口高度（解决 WebView 100vh 问题）
 * - Header: 固定高度 (flex-shrink: 0)
 * - Content: flex: 1, overflow-y: auto (内容超过后可滚动)
 * - Footer: 固定高度 (flex-shrink: 0)，可能没有
 *
 * 键盘弹起处理：
 * - 使用统一的视口高度管理工具
 * - 支持现代 CSS 单位（dvh/svh/lvh）优先，降级到 JS 方案
 * - 使用 visualViewport API 准确获取键盘弹起时的可视区域
 */

import { computed, ref, onMounted, onUnmounted } from 'vue';
import {
  setupViewportHeight,
  getCurrentViewportHeight,
  isKeyboardVisible,
} from './useViewportHeight';

const HEADER_HEIGHT = 64;
const FOOTER_HEIGHT = 56; // BottomNavigation 高度

export function useAppLayout() {
  const viewportHeight = ref(getCurrentViewportHeight());
  const keyboardVisible = ref(isKeyboardVisible());

  // Header 样式 - 固定高度
  const headerStyle = computed(() => ({
    height: `${HEADER_HEIGHT}px`,
    paddingTop: 'env(safe-area-inset-top, 0)',
  }));

  // Layout 高度样式 - 优先使用现代 CSS 单位，降级到 JS 方案
  // 优先级：dvh > --viewport-height > calc(var(--vh) * 100)
  const layoutHeightStyle = computed(() => ({
    height: 'var(--dvh, var(--viewport-height, calc(var(--vh, 1vh) * 100)))',
    minHeight: 'var(--dvh, var(--viewport-height, calc(var(--vh, 1vh) * 100)))',
    maxHeight: 'var(--dvh, var(--viewport-height, calc(var(--vh, 1vh) * 100)))',
  }));

  onMounted(() => {
    // 设置视口高度管理（统一管理，避免重复）
    const cleanup = setupViewportHeight({
      debounce: true,
      debounceDelay: 16,
    });

    // 更新响应式高度和键盘状态
    const updateState = () => {
      viewportHeight.value = getCurrentViewportHeight();
      keyboardVisible.value = isKeyboardVisible();
    };

    // 监听视口变化（使用 passive 优化性能）
    const handleResize = () => updateState();
    window.addEventListener('resize', handleResize, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize, { passive: true });
      window.visualViewport.addEventListener('scroll', handleResize, { passive: true });
    }

    // 初始更新
    updateState();

    // 清理函数
    onUnmounted(() => {
      cleanup();
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    });
  });

  return {
    headerStyle,
    layoutHeightStyle,
    footerHeight: FOOTER_HEIGHT,
    viewportHeight,
    isKeyboardVisible: keyboardVisible,
  };
}
