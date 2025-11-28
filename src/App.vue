<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { NConfigProvider, NGlobalStyle, NLoadingBarProvider, darkTheme, NMessageProvider, NDialogProvider } from 'naive-ui';
import { useWalletStore } from './stores/wallet';
import { useUIStore } from './stores/ui';
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';
import StartPage from './components/start/StartPage.vue';
import BackupPage from './components/backup/BackupPage.vue';
import WalletPage from './components/wallet/WalletPage.vue';
import MessageSetup from './components/MessageSetup.vue';

const walletStore = useWalletStore();
const uiStore = useUIStore();
const { t } = useI18n();

const step = ref<'start' | 'backup' | 'wallet'>('start');
const mnemonic = ref('');
const wordCount = ref<12 | 24>(12);

// 当前是否为深色模式
const isDarkMode = ref(false);

// 更新深色模式状态
const updateNaiveTheme = () => {
  const root = document.documentElement;
  isDarkMode.value = root.classList.contains('dark');
};

import { getFriendlyErrorMessage } from './utils/errorHandler';

async function handleCreate(data: { wordCount: 12 | 24; mnemonic: string }) {
  wordCount.value = data.wordCount;
  mnemonic.value = data.mnemonic;
  step.value = 'backup';
}

async function handleImport(importedMnemonic: string) {
  try {
    await walletStore.createWallet(importedMnemonic, '');
    step.value = 'wallet';
    uiStore.showSuccess(t('messages.walletImported'));
  } catch (error) {
    const friendlyError = getFriendlyErrorMessage(error, t);
    if (friendlyError) {
      uiStore.showError(friendlyError);
    }
  }
}

async function handleBackupFinish() {
  try {
    uiStore.showLoading();
    await walletStore.createWallet(mnemonic.value, '');
    step.value = 'wallet';
    uiStore.showSuccess(t('messages.walletCreated'));
  } catch (error) {
    const friendlyError = getFriendlyErrorMessage(error, t);
    if (friendlyError) {
      uiStore.showError(friendlyError);
    }
  } finally {
    uiStore.hideLoading();
  }
}

function handleBackupCancel() {
  walletStore.clearWallet();
  mnemonic.value = '';
  step.value = 'start';
  }

function handleExit() {
  walletStore.clearWallet();
  mnemonic.value = '';
  step.value = 'start';
}

onMounted(() => {
  uiStore.initTheme();
  updateNaiveTheme();
  
  // 监听主题变化事件
  window.addEventListener('theme-changed', updateNaiveTheme);
  
  // 监听 DOM 变化以更新主题
  const observer = new MutationObserver(() => {
    updateNaiveTheme();
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
});

// 监听 store 中的主题变化
watch(() => uiStore.theme, () => {
  updateNaiveTheme();
});
</script>

<template>
  <n-config-provider :theme="isDarkMode ? darkTheme : null">
    <n-global-style />
    <n-loading-bar-provider>
      <n-message-provider>
        <n-dialog-provider>
          <MessageSetup />
  <div class="app">
          <AppHeader :show-exit="step === 'wallet'" @exit="handleExit" />
          
          <main class="app-content">
            <StartPage
              v-if="step === 'start'"
              @create="handleCreate"
              @import="handleImport"
            />
            
            <BackupPage
              v-if="step === 'backup'"
              :mnemonic="mnemonic"
              :word-count="wordCount"
              @finish="handleBackupFinish"
              @cancel="handleBackupCancel"
            />

            <WalletPage
              v-if="step === 'wallet'"
            />
          </main>

          <AppFooter />
              </div>
        </n-dialog-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
              </template>

<style>
/* ==================== 全局样式 ==================== */
.app {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--apple-bg-primary);
  font-family: var(--apple-font);
  color: var(--apple-text-primary);
  overflow: hidden;
  padding-top: 64px; /* Header 固定高度（桌面端） */
  padding-bottom: 64px; /* Footer 固定高度（桌面端） */
}

/* 移动端适配 */
@media (max-width: 640px) {
  .app {
    padding-top: 56px; /* Header 固定高度（移动端） */
    padding-bottom: 56px; /* Footer 固定高度（移动端） */
  }
}

/* ==================== 主内容区域 ==================== */
.app-content {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0; /* 重要：允许 flex 子元素缩小 */
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
}

/* ==================== Naive UI 主题定制 ==================== */
:root {
  --n-color-primary: var(--apple-blue);
  --n-color-primary-hover: var(--apple-blue-hover);
  --n-color-primary-pressed: var(--apple-blue-active);
  --n-color-error: var(--apple-red);
  --n-color-warning: var(--apple-orange);
  --n-color-info: var(--apple-blue);
  --n-color-success: var(--apple-green);
  
  --n-border-radius: var(--apple-radius-md);
  --n-font-size: var(--apple-font-size-body);
  --n-font-family: var(--apple-font);
  
  --n-color-text: var(--apple-text-primary);
  --n-color-text-secondary: var(--apple-text-secondary);
  --n-color-text-tertiary: var(--apple-text-tertiary);
  
  --n-color-hover: var(--apple-bg-secondary);
  --n-color-pressed: var(--apple-gray-2);
  
  --n-border-color: var(--apple-separator);
  --n-color-card: var(--apple-bg-primary);
  
  --n-transition-duration: var(--apple-transition-fast);
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --n-color-text: var(--apple-text-primary);
    --n-color-text-secondary: var(--apple-text-secondary);
    --n-color-text-tertiary: var(--apple-text-tertiary);
    --n-color-card: var(--apple-bg-primary);
    --n-color-hover: var(--apple-bg-secondary);
  }
}

/* 强制暗色模式 */
:root.dark {
  --n-color-text: var(--apple-text-primary);
  --n-color-text-secondary: var(--apple-text-secondary);
  --n-color-text-tertiary: var(--apple-text-tertiary);
  --n-color-card: var(--apple-bg-primary);
  --n-color-hover: var(--apple-bg-secondary);
  }

/* 强制浅色模式 */
:root.light {
  --n-color-text: var(--apple-text-primary);
  --n-color-text-secondary: var(--apple-text-secondary);
  --n-color-text-tertiary: var(--apple-text-tertiary);
  --n-color-card: var(--apple-bg-primary);
  --n-color-hover: var(--apple-bg-secondary);
}

/* ==================== 动画 ==================== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
  }

.app > * {
  animation: fadeIn var(--apple-transition-base) ease-out;
}
</style>
