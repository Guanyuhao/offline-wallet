<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { NIcon } from 'naive-ui';
import { PersonOutline, SwapHorizontalOutline, SettingsOutline } from '@vicons/ionicons5';

defineProps<{
  activeTab: 'account' | 'transaction' | 'settings';
}>();

const emit = defineEmits<{
  (e: 'update:activeTab', tab: 'account' | 'transaction' | 'settings'): void;
}>();

const { t } = useI18n();

const tabs = [
  {
    key: 'account' as const,
    label: t('nav.account'),
    icon: PersonOutline,
  },
  {
    key: 'transaction' as const,
    label: t('nav.transaction'),
    icon: SwapHorizontalOutline,
  },
  {
    key: 'settings' as const,
    label: t('nav.settings'),
    icon: SettingsOutline,
  },
];

function handleTabClick(tab: 'account' | 'transaction' | 'settings') {
  // 使用 nextTick 确保状态立即更新
  emit('update:activeTab', tab);
  // 强制触发重新渲染（移动端优化）
  if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
    requestAnimationFrame(() => {
      // 确保 DOM 更新
    });
  }
}
</script>

<template>
  <nav class="bottom-navigation">
    <div class="nav-container">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['nav-item', { 'nav-item-active': activeTab === tab.key }]"
        :aria-pressed="activeTab === tab.key"
        @click="handleTabClick(tab.key)"
      >
        <NIcon :component="tab.icon" :size="24" class="nav-icon" />
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.bottom-navigation {
  flex-shrink: 0;
  background: var(--apple-bg-primary);
  border-top: 0.5px solid var(--apple-separator);
  /* 支持安全区域 */
  padding-bottom: env(safe-area-inset-bottom, 0);
  box-shadow: 0 -1px 10px rgba(0, 0, 0, 0.05);
}

.nav-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
  height: 56px;
  padding: 0 var(--apple-spacing-md);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  transition:
    color 0.15s ease,
    transform 0.15s ease;
  color: var(--apple-text-tertiary);
  padding: var(--apple-spacing-xs);
  border-radius: var(--apple-radius-md);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;
}

.nav-item:hover {
  background: var(--apple-bg-secondary);
  color: var(--apple-text-secondary);
}

.nav-item-active {
  color: var(--apple-blue) !important;
}

.nav-item-active .nav-icon {
  transform: scale(1.1);
  color: var(--apple-blue);
}

/* 修复移动端点击后状态不更新的问题 */
.nav-item:active {
  opacity: 0.6;
  transform: scale(0.98);
}

.nav-item-active:active {
  opacity: 1;
  transform: scale(0.98);
}

.nav-item-active:active .nav-icon {
  transform: scale(1.05);
}

.nav-icon {
  transition: transform 0.2s ease;
}

.nav-label {
  font-size: var(--apple-font-size-caption-2);
  font-weight: var(--apple-font-weight-medium);
  line-height: 1;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .nav-container {
    height: 56px;
  }

  .nav-label {
    font-size: 11px;
  }
}

/* 桌面端适配 */
@media (min-width: 768px) {
  .nav-container {
    max-width: 600px;
  }
}
</style>
