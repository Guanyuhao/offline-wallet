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
  clearWalletData,
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
      // 只有在有加密助记词的情况下才保存地址
      await syncWalletToStorage();
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
      // 只有在有加密助记词的情况下才保存地址
      await syncWalletToStorage();
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
    // 先检查是否存在加密的助记词（系统级存储）
    const hasEncrypted = await hasEncryptedMnemonic();

    if (hasEncrypted) {
      // 有加密助记词，检查是否有缓存的钱包地址
      if (hasStoredWallet()) {
        // 尝试从存储恢复钱包数据
        const restored = initializeWalletFromStorage();
        if (restored && walletStore.isWalletCreated) {
          // 需要解锁钱包
          needsUnlock.value = true;
          step.value = 'unlock';
        } else {
          // 存储数据无效，清除并进入开始页面
          clearWalletData();
          step.value = 'start';
        }
      } else {
        // 没有缓存地址，需要解锁（助记词存在但地址未缓存）
        step.value = 'unlock';
      }
    } else {
      // 没有加密助记词，清除可能存在的地址缓存
      // 因为地址是从助记词派生的，没有助记词就没有意义
      if (hasStoredWallet()) {
        clearWalletData();
      }
      // 进入开始页面
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
  // syncWalletToStorage 内部已经检查加密助记词，这里直接调用即可
  watch(
    () => walletStore.addresses,
    async () => {
      if (walletStore.isWalletCreated) {
        await syncWalletToStorage();
      }
    },
    { deep: true }
  );

  watch(
    () => walletStore.selectedChain,
    async () => {
      if (walletStore.isWalletCreated) {
        await syncWalletToStorage();
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
