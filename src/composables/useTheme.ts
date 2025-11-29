/**
 * 主题管理 Composable
 * 优化主题切换逻辑，减少不必要的 DOM 操作
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useUIStore } from '../stores/ui';

/**
 * 主题管理
 */
export function useTheme() {
  const uiStore = useUIStore();
  const isDarkMode = ref(false);

  // 使用防抖优化 MutationObserver 回调
  let themeUpdateTimer: ReturnType<typeof setTimeout> | null = null;

  // 更新 Naive UI 主题状态
  const updateNaiveTheme = () => {
    if (themeUpdateTimer) {
      clearTimeout(themeUpdateTimer);
    }

    themeUpdateTimer = setTimeout(() => {
      const root = document.documentElement;
      isDarkMode.value = root.classList.contains('dark');
    }, 50); // 50ms 防抖
  };

  // 计算主题（响应式）
  const theme = computed(() => (isDarkMode.value ? 'dark' : 'light'));

  // 监听系统主题变化（仅在 auto 模式下）
  let mediaQuery: MediaQueryList | null = null;
  let observer: MutationObserver | null = null;
  let stopWatcher: (() => void) | null = null;

  const handleSystemThemeChange = () => {
    if (uiStore.theme === 'auto') {
      updateNaiveTheme();
    }
  };

  onMounted(() => {
    // 初始化主题状态
    updateNaiveTheme();

    // 监听主题变化事件
    window.addEventListener('theme-changed', updateNaiveTheme);

    // 监听系统主题变化
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleSystemThemeChange);
    }

    // 使用 MutationObserver 监听 DOM 变化（优化版）
    observer = new MutationObserver((mutations) => {
      // 只处理 class 属性的变化
      const hasClassChange = mutations.some(
        (mutation) => mutation.type === 'attributes' && mutation.attributeName === 'class'
      );

      if (hasClassChange) {
        updateNaiveTheme();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // 监听 store 中的主题变化
    stopWatcher = watch(
      () => uiStore.theme,
      () => {
        updateNaiveTheme();
      },
      { immediate: true }
    );
  });

  onUnmounted(() => {
    // 清理事件监听器
    window.removeEventListener('theme-changed', updateNaiveTheme);

    // 清理媒体查询监听器
    if (mediaQuery) {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    }

    // 清理 MutationObserver
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    // 停止 watch
    if (stopWatcher) {
      stopWatcher();
      stopWatcher = null;
    }

    // 清理定时器
    if (themeUpdateTimer) {
      clearTimeout(themeUpdateTimer);
      themeUpdateTimer = null;
    }
  });

  return {
    isDarkMode,
    theme,
    updateNaiveTheme,
  };
}
