import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { useAppState } from '../useAppState';
import { useWalletStore } from '../../stores/wallet';
import { useUIStore } from '../../stores/ui';
import * as useWalletStorage from '../useWalletStorage';
import zhCN from '../../i18n/locales/zh-CN';
import enUS from '../../i18n/locales/en-US';

// Mock dependencies
vi.mock('../useWalletStorage', () => ({
  hasStoredWallet: vi.fn(),
  initializeWalletFromStorage: vi.fn(),
  syncWalletToStorage: vi.fn(),
  hasEncryptedMnemonic: vi.fn(),
}));

vi.mock('../../utils/errorHandler', () => ({
  getFriendlyErrorMessage: vi.fn((error: any) => error?.message || 'Unknown error'),
}));

// Mock vue-i18n useI18n
vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual('vue-i18n');
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
    }),
  };
});

// 创建全局 i18n 实例（与 ExitConfirmDialog.test.ts 相同的方式）
// 注意：由于 useI18n 已被 mock，这里主要用于组件测试
const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});

describe('useAppState', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该初始化默认状态', async () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      await nextTick();

      expect(wrapper.vm.appState.step.value).toBe('start');
      expect(wrapper.vm.appState.mnemonic.value).toBe('');
      expect(wrapper.vm.appState.wordCount.value).toBe(12);
      expect(wrapper.vm.appState.needsUnlock.value).toBe(false);
      expect(wrapper.vm.appState.showExitDialog.value).toBe(false);
      expect(wrapper.vm.appState.showEncryptionGuide.value).toBe(false);
      expect(wrapper.vm.appState.showSettingsDrawer.value).toBe(false);

      wrapper.unmount();
    });
  });

  describe('handleCreate', () => {
    it('应该设置助记词和词数并切换到备份页面', () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      const mnemonic = 'test mnemonic phrase with twelve words here';
      wrapper.vm.appState.handleCreate({ wordCount: 24, mnemonic });

      expect(wrapper.vm.appState.mnemonic.value).toBe(mnemonic);
      expect(wrapper.vm.appState.wordCount.value).toBe(24);
      expect(wrapper.vm.appState.step.value).toBe('backup');

      wrapper.unmount();
    });

    it('应该支持 12 词助记词', () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      wrapper.vm.appState.handleCreate({ wordCount: 12, mnemonic: 'test mnemonic' });

      expect(wrapper.vm.appState.wordCount.value).toBe(12);
      expect(wrapper.vm.appState.step.value).toBe('backup');

      wrapper.unmount();
    });
  });

  describe('handleImport', () => {
    it('应该成功导入钱包', async () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      const walletStore = useWalletStore();
      const uiStore = useUIStore();
      const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess');
      const createWalletSpy = vi.spyOn(walletStore, 'createWallet').mockResolvedValue(undefined);
      const syncSpy = vi.spyOn(useWalletStorage, 'syncWalletToStorage');

      const mnemonic = 'test mnemonic phrase with twelve words here';
      await wrapper.vm.appState.handleImport(mnemonic);

      expect(createWalletSpy).toHaveBeenCalledWith(mnemonic, '');
      expect(syncSpy).toHaveBeenCalled();
      expect(wrapper.vm.appState.step.value).toBe('wallet');
      expect(showSuccessSpy).toHaveBeenCalled();

      wrapper.unmount();
    });

    it('应该在导入失败时显示错误', async () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      const walletStore = useWalletStore();
      const uiStore = useUIStore();
      const showErrorSpy = vi.spyOn(uiStore, 'showError');
      vi.spyOn(walletStore, 'createWallet').mockRejectedValueOnce(new Error('Invalid mnemonic'));

      await wrapper.vm.appState.handleImport('invalid mnemonic');

      expect(showErrorSpy).toHaveBeenCalled();
      expect(wrapper.vm.appState.step.value).toBe('start');

      wrapper.unmount();
    });
  });

  describe('handleBackupFinish', () => {
    it('应该成功创建钱包并切换到钱包页面', async () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      const walletStore = useWalletStore();
      const uiStore = useUIStore();
      const showLoadingSpy = vi.spyOn(uiStore, 'showLoading');
      const hideLoadingSpy = vi.spyOn(uiStore, 'hideLoading');
      const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess');
      const createWalletSpy = vi.spyOn(walletStore, 'createWallet').mockResolvedValue(undefined);
      const syncSpy = vi.spyOn(useWalletStorage, 'syncWalletToStorage');
      vi.spyOn(useWalletStorage, 'hasEncryptedMnemonic').mockResolvedValue(true);

      wrapper.vm.appState.mnemonic.value = 'test mnemonic phrase';
      await wrapper.vm.appState.handleBackupFinish();

      expect(showLoadingSpy).toHaveBeenCalled();
      expect(createWalletSpy).toHaveBeenCalledWith('test mnemonic phrase', '');
      expect(syncSpy).toHaveBeenCalled();
      expect(wrapper.vm.appState.step.value).toBe('wallet');
      expect(showSuccessSpy).toHaveBeenCalled();
      expect(hideLoadingSpy).toHaveBeenCalled();

      wrapper.unmount();
    });

    it('在没有加密存储时应该显示加密引导', async () => {
      vi.useFakeTimers();
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      const walletStore = useWalletStore();
      vi.spyOn(walletStore, 'createWallet').mockResolvedValue(undefined);
      vi.spyOn(useWalletStorage, 'hasEncryptedMnemonic').mockResolvedValue(false);

      wrapper.vm.appState.mnemonic.value = 'test mnemonic phrase';
      await wrapper.vm.appState.handleBackupFinish();

      // 等待延迟
      await vi.advanceTimersByTimeAsync(500);

      expect(wrapper.vm.appState.showEncryptionGuide.value).toBe(true);

      vi.useRealTimers();
      wrapper.unmount();
    });

    it('应该在创建失败时显示错误', async () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      const walletStore = useWalletStore();
      const uiStore = useUIStore();
      const showErrorSpy = vi.spyOn(uiStore, 'showError');
      vi.spyOn(walletStore, 'createWallet').mockRejectedValueOnce(new Error('Creation failed'));

      wrapper.vm.appState.mnemonic.value = 'test mnemonic phrase';
      await wrapper.vm.appState.handleBackupFinish();

      expect(showErrorSpy).toHaveBeenCalled();

      wrapper.unmount();
    });
  });

  describe('handleBackupCancel', () => {
    it('应该清除钱包并返回开始页面', () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      const walletStore = useWalletStore();
      const clearWalletSpy = vi.spyOn(walletStore, 'clearWallet');

      wrapper.vm.appState.mnemonic.value = 'test mnemonic';
      wrapper.vm.appState.step.value = 'backup';

      wrapper.vm.appState.handleBackupCancel();

      expect(clearWalletSpy).toHaveBeenCalled();
      expect(wrapper.vm.appState.mnemonic.value).toBe('');
      expect(wrapper.vm.appState.step.value).toBe('start');

      wrapper.unmount();
    });
  });

  describe('handleExit', () => {
    it('应该显示退出确认对话框', () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      wrapper.vm.appState.handleExit();

      expect(wrapper.vm.appState.showExitDialog.value).toBe(true);

      wrapper.unmount();
    });
  });

  describe('handleExitConfirmed', () => {
    it('应该重置状态并返回开始页面', () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      wrapper.vm.appState.mnemonic.value = 'test mnemonic';
      wrapper.vm.appState.step.value = 'wallet';
      wrapper.vm.appState.needsUnlock.value = true;
      wrapper.vm.appState.showExitDialog.value = true;

      wrapper.vm.appState.handleExitConfirmed();

      expect(wrapper.vm.appState.mnemonic.value).toBe('');
      expect(wrapper.vm.appState.step.value).toBe('start');
      expect(wrapper.vm.appState.needsUnlock.value).toBe(false);

      wrapper.unmount();
    });
  });

  describe('handleSplashComplete', () => {
    it('在没有存储钱包时应该进入开始页面', async () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      vi.spyOn(useWalletStorage, 'hasStoredWallet').mockReturnValue(false);

      await wrapper.vm.appState.handleSplashComplete();

      expect(wrapper.vm.appState.step.value).toBe('start');

      wrapper.unmount();
    });

    it('在有存储钱包且有加密时应该进入解锁页面', async () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      const walletStore = useWalletStore();
      vi.spyOn(useWalletStorage, 'hasStoredWallet').mockReturnValue(true);
      vi.spyOn(useWalletStorage, 'initializeWalletFromStorage').mockReturnValue(true);
      vi.spyOn(useWalletStorage, 'hasEncryptedMnemonic').mockResolvedValue(true);
      Object.defineProperty(walletStore, 'isWalletCreated', {
        get: () => true,
        configurable: true,
      });

      await wrapper.vm.appState.handleSplashComplete();

      expect(wrapper.vm.appState.needsUnlock.value).toBe(true);
      expect(wrapper.vm.appState.step.value).toBe('unlock');

      wrapper.unmount();
    });

    it('在有存储钱包但没有加密时应该进入钱包页面', async () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      const walletStore = useWalletStore();
      vi.spyOn(useWalletStorage, 'hasStoredWallet').mockReturnValue(true);
      vi.spyOn(useWalletStorage, 'initializeWalletFromStorage').mockReturnValue(true);
      vi.spyOn(useWalletStorage, 'hasEncryptedMnemonic').mockResolvedValue(false);
      Object.defineProperty(walletStore, 'isWalletCreated', {
        get: () => true,
        configurable: true,
      });

      await wrapper.vm.appState.handleSplashComplete();

      expect(wrapper.vm.appState.step.value).toBe('wallet');

      wrapper.unmount();
    });

    it('在存储数据无效时应该进入开始页面', async () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      const walletStore = useWalletStore();
      vi.spyOn(useWalletStorage, 'hasStoredWallet').mockReturnValue(true);
      vi.spyOn(useWalletStorage, 'initializeWalletFromStorage').mockReturnValue(false);
      Object.defineProperty(walletStore, 'isWalletCreated', {
        get: () => false,
        configurable: true,
      });

      await wrapper.vm.appState.handleSplashComplete();

      expect(wrapper.vm.appState.step.value).toBe('start');

      wrapper.unmount();
    });
  });

  describe('handleWalletUnlocked', () => {
    it('应该切换到钱包页面', () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      wrapper.vm.appState.needsUnlock.value = true;
      wrapper.vm.appState.step.value = 'unlock';

      wrapper.vm.appState.handleWalletUnlocked();

      expect(wrapper.vm.appState.needsUnlock.value).toBe(false);
      expect(wrapper.vm.appState.step.value).toBe('wallet');

      wrapper.unmount();
    });
  });

  describe('handleForgotPassword', () => {
    it('应该清除钱包并返回开始页面', () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      const walletStore = useWalletStore();
      const uiStore = useUIStore();
      const clearWalletSpy = vi.spyOn(walletStore, 'clearWallet');
      const showInfoSpy = vi.spyOn(uiStore, 'showInfo');

      wrapper.vm.appState.mnemonic.value = 'test mnemonic';
      wrapper.vm.appState.needsUnlock.value = true;
      wrapper.vm.appState.step.value = 'unlock';

      wrapper.vm.appState.handleForgotPassword();

      expect(clearWalletSpy).toHaveBeenCalled();
      expect(wrapper.vm.appState.mnemonic.value).toBe('');
      expect(wrapper.vm.appState.needsUnlock.value).toBe(false);
      expect(wrapper.vm.appState.step.value).toBe('start');
      expect(showInfoSpy).toHaveBeenCalled();

      wrapper.unmount();
    });
  });

  describe('handleEncryptionGuideEnable', () => {
    it('应该关闭引导并打开设置抽屉', () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      wrapper.vm.appState.showEncryptionGuide.value = true;
      wrapper.vm.appState.showSettingsDrawer.value = false;

      wrapper.vm.appState.handleEncryptionGuideEnable();

      expect(wrapper.vm.appState.showEncryptionGuide.value).toBe(false);
      expect(wrapper.vm.appState.showSettingsDrawer.value).toBe(true);

      wrapper.unmount();
    });
  });

  describe('handleEncryptionGuideSkip', () => {
    it('应该关闭引导', () => {
      const wrapper = mount({
        setup() {
          const appState = useAppState();
          return { appState };
        },
        template: '<div></div>',
        global: {
          plugins: [pinia, i18n],
        },
      });

      wrapper.vm.appState.showEncryptionGuide.value = true;

      wrapper.vm.appState.handleEncryptionGuideSkip();

      expect(wrapper.vm.appState.showEncryptionGuide.value).toBe(false);

      wrapper.unmount();
    });
  });
});
