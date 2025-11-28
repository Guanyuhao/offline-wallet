<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton, useDialog } from 'naive-ui';
import { MenuOutline } from '@vicons/ionicons5';
import { NIcon } from 'naive-ui';
import SettingsDrawer from './SettingsDrawer.vue';
import { useWalletStore } from '../stores/wallet';
import { useAppMessage } from '../composables/useMessage';

const { t } = useI18n();
const walletStore = useWalletStore();
const dialog = useDialog();

const props = defineProps<{
  showExit?: boolean;
}>();

const emit = defineEmits<{
  (e: 'exit'): void;
}>();

const showExitButton = computed(() => props.showExit && walletStore.isWalletCreated);
const showSettings = ref(false);

function handleExit() {
  dialog.warning({
    title: t('wallet.exitConfirm.title'),
    content: t('wallet.exitConfirm.content'),
    positiveText: t('wallet.exitConfirm.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: () => {
      emit('exit');
      // 延迟调用 message，确保 API 已初始化
      try {
        const message = useAppMessage();
        message.success(t('wallet.exitSuccess'));
      } catch (error) {
        // Message API 未初始化时静默失败
        console.log('Exit successful');
      }
    },
  });
}

function toggleSettings() {
  showSettings.value = !showSettings.value;
}
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
        <n-button
          type="default"
          size="small"
          class="app-header__menu-btn"
          @click="toggleSettings"
          :title="t('menu.title')"
        >
          <n-icon :component="MenuOutline" :size="20" />
        </n-button>
      </div>
    </div>
    
    <SettingsDrawer 
      v-model:show="showSettings" 
      :show-exit="showExitButton"
      @exit="handleExit"
    />
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--apple-bg-primary);
  border-bottom: 0.5px solid var(--apple-separator);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  flex-shrink: 0; /* 防止 header 被压缩 */
}

.app-header__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--apple-spacing-md) var(--apple-spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
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
