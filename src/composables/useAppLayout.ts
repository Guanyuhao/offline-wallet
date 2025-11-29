/**
 * 应用布局管理 Composable
 *
 * 布局结构：
 * - Layout: 100vh, flex column
 * - Header: 固定高度 (flex-shrink: 0)
 * - Content: flex: 1, overflow-y: auto (内容超过后可滚动)
 * - Footer: 固定高度 (flex-shrink: 0)，可能没有
 */

import { computed } from 'vue';

const HEADER_HEIGHT = 64;
const FOOTER_HEIGHT = 56; // BottomNavigation 高度

export function useAppLayout() {
  // Header 样式 - 固定高度
  const headerStyle = computed(() => ({
    height: `${HEADER_HEIGHT}px`,
    paddingTop: 'env(safe-area-inset-top, 0)',
  }));

  return {
    headerStyle,
    footerHeight: FOOTER_HEIGHT,
  };
}
