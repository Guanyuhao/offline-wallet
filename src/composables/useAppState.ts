/**
 * 应用状态管理 Composable
 * 管理应用流程状态和导航逻辑
 */

import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWalletStore } from '../stores/wallet';
import { useUIStore } from '../stores/ui';
import {
  hasStoredWallet,
  initializeWalletFromStorage,
  syncWalletToStorage,
  hasEncryptedMnemonic,
} from './useWalletStorage';
import { getFriendlyErrorMessage } from '../utils/errorHandler';

export type AppStep = 'start' | 'backup' | 'wallet' | 'unlock';

/**
 * 应用状态管理
 */
export function useAppState() {
  const { t } = useI18n();
  const walletStore = useWalletStore();
  const uiStore = useUIStore();

  // 应用状态
  const step = ref<AppStep>('start');
  const mnemonic = ref('');
  const wordCount = ref<12 | 24>(12);
  const needsUnlock = ref(false);
  const showExitDialog = ref(false);
  const showEncryptionGuide = ref(false);
  const showSettingsDrawer = ref(false);

  // 创建钱包处理
  function handleCreate(data: { wordCount: 12 | 24; mnemonic: string }) {
    wordCount.value = data.wordCount;
    mnemonic.value = data.mnemonic;
    step.value = 'backup';
  }

  // 导入钱包处理
  async function handleImport(importedMnemonic: string) {
    try {
      await walletStore.createWallet(importedMnemonic, '');
      syncWalletToStorage();
      step.value = 'wallet';
      uiStore.showSuccess(t('messages.walletImported'));
    } catch (error) {
      const friendlyError = getFriendlyErrorMessage(error, t);
      if (friendlyError) {
        uiStore.showError(friendlyError);
      }
    }
  }

  // 备份完成处理
  async function handleBackupFinish() {
    try {
      uiStore.showLoading();
      await walletStore.createWallet(mnemonic.value, '');
      syncWalletToStorage();
      step.value = 'wallet';
      uiStore.showSuccess(t('messages.walletCreated'));

      // 检查是否已启用加密存储，如果没有则显示引导
      const hasEncrypted = await hasEncryptedMnemonic();
      if (!hasEncrypted) {
        // 延迟显示，让成功消息先显示
        setTimeout(() => {
          showEncryptionGuide.value = true;
        }, 500);
      }
    } catch (error) {
      const friendlyError = getFriendlyErrorMessage(error, t);
      if (friendlyError) {
        uiStore.showError(friendlyError);
      }
    } finally {
      uiStore.hideLoading();
    }
  }

  // 加密引导处理
  function handleEncryptionGuideEnable() {
    showEncryptionGuide.value = false;
    showSettingsDrawer.value = true;
  }

  function handleEncryptionGuideSkip() {
    showEncryptionGuide.value = false;
  }

  // 备份取消处理
  function handleBackupCancel() {
    walletStore.clearWallet();
    mnemonic.value = '';
    step.value = 'start';
  }

  // 退出处理
  function handleExit() {
    showExitDialog.value = true;
  }

  function handleExitConfirmed() {
    mnemonic.value = '';
    step.value = 'start';
    needsUnlock.value = false;
  }

  // 开屏页面完成后的处理
  async function handleSplashComplete() {
    // 检查是否有缓存的钱包
    if (hasStoredWallet()) {
      // 尝试从存储恢复钱包数据
      const restored = initializeWalletFromStorage();
      if (restored && walletStore.isWalletCreated) {
        // 检查是否存在加密的助记词（系统级存储）
        const hasEncrypted = await hasEncryptedMnemonic();
        if (hasEncrypted) {
          // 需要解锁钱包
          needsUnlock.value = true;
          step.value = 'unlock';
        } else {
          // 没有加密存储，直接进入钱包页面（但助记词不在内存中）
          // 这种情况下，用户只能查看地址，无法签名交易
          step.value = 'wallet';
        }
      } else {
        // 存储数据无效，进入开始页面
        step.value = 'start';
      }
    } else {
      // 没有缓存，进入开始页面
      step.value = 'start';
    }
  }

  // 钱包解锁后的处理
  function handleWalletUnlocked() {
    needsUnlock.value = false;
    step.value = 'wallet';
  }

  // 忘记密码处理
  function handleForgotPassword() {
    walletStore.clearWallet();
    mnemonic.value = '';
    needsUnlock.value = false;
    step.value = 'start';
    uiStore.showInfo(t('security.forgotPasswordDesc'));
  }

  // 监听钱包变化，同步到存储
  watch(
    () => walletStore.addresses,
    () => {
      if (walletStore.isWalletCreated) {
        syncWalletToStorage();
      }
    },
    { deep: true }
  );

  watch(
    () => walletStore.selectedChain,
    () => {
      if (walletStore.isWalletCreated) {
        syncWalletToStorage();
      }
    }
  );

  return {
    // State
    step,
    mnemonic,
    wordCount,
    needsUnlock,
    showExitDialog,
    showEncryptionGuide,
    showSettingsDrawer,

    // Handlers
    handleCreate,
    handleImport,
    handleBackupFinish,
    handleEncryptionGuideEnable,
    handleEncryptionGuideSkip,
    handleBackupCancel,
    handleExit,
    handleExitConfirmed,
    handleSplashComplete,
    handleWalletUnlocked,
    handleForgotPassword,
  };
}
