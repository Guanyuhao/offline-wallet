<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  NConfigProvider,
  NGlobalStyle,
  NLoadingBarProvider,
  darkTheme,
  NMessageProvider,
  NDialogProvider,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutFooter,
} from 'naive-ui';
import { defineAsyncComponent } from 'vue';
import AppHeader from './components/AppHeader.vue';
import SplashScreen from './components/SplashScreen.vue';
import ErrorBoundary from './components/ErrorBoundary.vue';
import MessageSetup from './components/MessageSetup.vue';

// 懒加载非关键组件 - 按需加载，减少初始包大小
const StartPage = defineAsyncComponent(() => import('./components/start/StartPage.vue'));
const BackupPage = defineAsyncComponent(() => import('./components/backup/BackupPage.vue'));
const WalletPage = defineAsyncComponent(() => import('./components/wallet/WalletPage.vue'));
const UnlockWallet = defineAsyncComponent(() => import('./components/UnlockWallet.vue'));
const BottomNavigation = defineAsyncComponent(() => import('./components/BottomNavigation.vue'));
const SecurityStatusBanner = defineAsyncComponent(
  () => import('./components/wallet/SecurityStatusBanner.vue')
);
const ExitConfirmDialog = defineAsyncComponent(() => import('./components/ExitConfirmDialog.vue'));
const EncryptionGuideDialog = defineAsyncComponent(
  () => import('./components/EncryptionGuideDialog.vue')
);
import { useAutoWebViewPerformance } from './composables/useWebViewPerformance';
import { useAutoLock } from './composables/useAutoLock';
import { useAppLayout } from './composables/useAppLayout';
import { useAppState } from './composables/useAppState';
import { useTheme } from './composables/useTheme';
import { useUIStore } from './stores/ui';

// 初始化 composables
useAutoLock();
useAutoWebViewPerformance();
const { headerStyle, layoutHeightStyle } = useAppLayout();
const { isDarkMode } = useTheme();
const appState = useAppState();
const uiStore = useUIStore();

// 开屏页面状态
const showSplash = ref(true);

// 使用 computed 包装状态值以解决 TypeScript 类型问题
const step = computed(() => appState.step.value);
const mnemonic = computed(() => appState.mnemonic.value);
const wordCount = computed(() => appState.wordCount.value);
const showExitDialog = computed({
  get: () => appState.showExitDialog.value,
  set: (val) => {
    appState.showExitDialog.value = val;
  },
});
const showEncryptionGuide = computed({
  get: () => appState.showEncryptionGuide.value,
  set: (val) => {
    appState.showEncryptionGuide.value = val;
  },
});
const showSettingsDrawer = computed({
  get: () => appState.showSettingsDrawer.value,
  set: (val) => {
    appState.showSettingsDrawer.value = val;
  },
});

// Wallet 页面的 tab 状态（只在 wallet 页面时使用）
const walletActiveTab = ref<'account' | 'transaction' | 'settings'>('account');
const showWalletFooter = computed(() => step.value === 'wallet');

// 开屏页面完成后的处理
async function handleSplashComplete() {
  showSplash.value = false;
  await appState.handleSplashComplete();
}

onMounted(() => {
  uiStore.initTheme();
});
</script>

<template>
  <NConfigProvider :theme="isDarkMode ? darkTheme : null">
    <NGlobalStyle />
    <NLoadingBarProvider>
      <NMessageProvider>
        <NDialogProvider>
          <ErrorBoundary>
            <MessageSetup />
            <ExitConfirmDialog
              v-model:show="showExitDialog"
              @confirmed="appState.handleExitConfirmed"
            />
            <EncryptionGuideDialog
              v-model:show="showEncryptionGuide"
              @enable="appState.handleEncryptionGuideEnable"
              @skip="appState.handleEncryptionGuideSkip"
            />

            <!-- 开屏页面 -->
            <SplashScreen v-if="showSplash" @complete="handleSplashComplete" />

            <!-- 主应用内容 - 使用 Naive UI Layout -->
            <NLayout v-else :style="layoutHeightStyle" content-class="layout-content-wrapper">
              <!-- Header - 所有页面共用 -->
              <NLayoutHeader bordered :style="headerStyle">
                <AppHeader v-model:show-settings-drawer="showSettingsDrawer" />
              </NLayoutHeader>

              <!-- Content - flex: 1, 内容超过后可滚动 -->
              <NLayoutContent :native-scrollbar="false">
                <!-- 钱包页面的安全状态横幅 -->
                <SecurityStatusBanner
                  v-if="step === 'wallet'"
                  @enable="walletActiveTab = 'settings'"
                />

                <!-- 页面内容 -->
                <StartPage
                  v-if="step === 'start'"
                  @create="appState.handleCreate"
                  @import="appState.handleImport"
                />

                <BackupPage
                  v-if="step === 'backup'"
                  :mnemonic="mnemonic"
                  :word-count="wordCount"
                  @finish="appState.handleBackupFinish"
                  @cancel="appState.handleBackupCancel"
                />

                <UnlockWallet
                  v-if="step === 'unlock'"
                  @unlocked="appState.handleWalletUnlocked"
                  @forgot-password="appState.handleForgotPassword"
                />

                <WalletPage
                  v-if="step === 'wallet'"
                  v-model:show-settings-drawer="showSettingsDrawer"
                  :active-tab="walletActiveTab"
                  @exit="appState.handleExit"
                />
              </NLayoutContent>

              <!-- Footer - 只在钱包页面显示 -->
              <NLayoutFooter v-if="showWalletFooter">
                <BottomNavigation
                  :active-tab="walletActiveTab"
                  @update:active-tab="(tab) => (walletActiveTab = tab)"
                />
              </NLayoutFooter>
            </NLayout>
          </ErrorBoundary>
        </NDialogProvider>
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>

<style>
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

.layout-content-wrapper {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  /* 确保布局容器不会超出视口（键盘弹起时自动调整） */
  /* 优先级：dvh（现代浏览器） > --viewport-height（JS设置） > calc(var(--vh) * 100)（降级） */
  max-height: var(--dvh, var(--viewport-height, calc(var(--vh, 1vh) * 100)));
}
</style>
