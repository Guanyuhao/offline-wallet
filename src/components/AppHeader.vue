<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton } from 'naive-ui';
import { MenuOutline } from '@vicons/ionicons5';
import { NIcon } from 'naive-ui';
import SettingsDrawer from './SettingsDrawer.vue';

const { t } = useI18n();

const props = defineProps<{
  showSettingsDrawer?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:showSettingsDrawer', value: boolean): void;
}>();

const showSettings = ref(false);

function toggleSettings() {
  const newValue = !showSettings.value;
  showSettings.value = newValue;
  emit('update:showSettingsDrawer', newValue);
}

// 监听外部控制
watch(
  () => props.showSettingsDrawer,
  (newValue) => {
    if (newValue !== undefined) {
      showSettings.value = newValue;
    }
  }
);
</script>

<template>
  <header class="app-header">
    <div class="app-header__content">
      <div class="app-header__left">
        <div class="app-header__logo">
          <img src="/wallet-logo.svg" alt="Wallet Logo" class="app-header__logo-img" />
        </div>
        <div class="app-header__title">
          <h1 class="app-header__title-text">{{ t('app.name') }}</h1>
        </div>
      </div>

      <div class="app-header__actions">
        <NButton
          type="default"
          size="small"
          class="app-header__menu-btn"
          :title="t('menu.title')"
          @click="toggleSettings"
        >
          <NIcon :component="MenuOutline" :size="20" />
        </NButton>
      </div>
    </div>

    <SettingsDrawer
      v-model:show="showSettings"
      @update:show="(val) => emit('update:showSettingsDrawer', val)"
    />
  </header>
</template>

<style scoped>
.app-header {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  background: transparent;
}

.app-header__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--apple-spacing-md) var(--apple-spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
}

.app-header__left {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-sm);
  flex: 1;
}

.app-header__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.app-header__logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.2s ease;
}

.app-header__logo:hover .app-header__logo-img {
  transform: scale(1.1);
}

.app-header__title {
  flex: 1;
}

.app-header__title-text {
  font-size: var(--apple-font-size-title-3);
  font-weight: var(--apple-font-weight-semibold);
  margin: 0;
  color: var(--apple-text-primary);
  letter-spacing: -0.022em;
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-sm);
}

.app-header__menu-btn {
  font-size: var(--apple-font-size-body);
  padding: var(--apple-spacing-xs) var(--apple-spacing-sm);
  border-radius: var(--apple-radius-md);
  border: 0.5px solid var(--apple-separator);
  background: var(--apple-bg-secondary);
  color: var(--apple-text-secondary);
  transition: all var(--apple-transition-fast);
  min-width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.app-header__menu-btn:hover {
  background: var(--apple-bg-tertiary);
  color: var(--apple-text-primary);
}

@media (max-width: 640px) {
  .app-header__content {
    padding: var(--apple-spacing-sm) var(--apple-spacing-md);
  }

  .app-header__title-text {
    font-size: var(--apple-font-size-headline);
  }
}
</style>
