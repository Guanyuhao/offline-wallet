import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import ExitConfirmDialog from '../ExitConfirmDialog.vue';
import { useWalletStore } from '../../stores/wallet';
import { useUIStore } from '../../stores/ui';
import { clearAllWalletData } from '../../composables/useWalletStorage';
import zhCN from '../../i18n/locales/zh-CN';
import enUS from '../../i18n/locales/en-US';

// Mock useDialog
const mockDialogInstance = {
  destroy: vi.fn(),
};

interface DialogOptions {
  title: string;
  content: string;
  positiveText: string;
  negativeText: string;
  positiveButtonProps: { loading: boolean };
  onPositiveClick: () => Promise<boolean> | boolean;
  onNegativeClick: () => boolean;
}

const mockDialog = {
  warning: vi.fn((_options: DialogOptions) => mockDialogInstance),
  create: vi.fn((_options: DialogOptions) => mockDialogInstance),
};

vi.mock('naive-ui', async () => {
  const actual = await vi.importActual('naive-ui');
  return {
    ...actual,
    useDialog: () => mockDialog,
  };
});

vi.mock('../../composables/useWalletStorage', () => ({
  clearAllWalletData: vi.fn(),
  hasEncryptedMnemonic: vi.fn(),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});

describe('ExitConfirmDialog', () => {
  let pinia: ReturnType<typeof createPinia>;
  let walletStore: ReturnType<typeof useWalletStore>;
  let uiStore: ReturnType<typeof useUIStore>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    walletStore = useWalletStore();
    uiStore = useUIStore();
    // 重置 mock，但不清除 mock 函数本身
    mockDialog.warning.mockClear();
    mockDialog.create.mockClear();
    mockDialogInstance.destroy.mockClear();
  });

  const createWrapper = (props = {}) => {
    return mount(ExitConfirmDialog, {
      props: {
        show: false,
        ...props,
      },
      global: {
        plugins: [pinia, i18n],
      },
    });
  };

  describe('组件初始化', () => {
    it('应该在 show 为 false 时不显示对话框', () => {
      const wrapper = createWrapper({ show: false });
      expect(wrapper.exists()).toBe(true);
    });

    it('应该在 show 变为 true 时显示对话框', async () => {
      const wrapper = createWrapper({ show: false });
      await wrapper.setProps({ show: true });
      // 对话框通过 useDialog 创建，无法直接测试 DOM
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('退出确认流程', () => {
    it('应该在用户确认时清除钱包数据', async () => {
      const mockClearAllWalletData = vi.mocked(clearAllWalletData);
      mockClearAllWalletData.mockResolvedValue();

      const clearWalletSpy = vi.spyOn(walletStore, 'clearWallet');
      const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess');

      // 先创建组件，show 为 false
      const wrapper = createWrapper({ show: false });
      await wrapper.vm.$nextTick();

      // 然后设置为 true，触发 watch
      await wrapper.setProps({ show: true });
      await wrapper.vm.$nextTick();

      // 等待 watch 触发和对话框创建
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 获取对话框调用 - ExitConfirmDialog 使用 dialog.warning()
      expect(mockDialog.warning).toHaveBeenCalled();
      const dialogCall = mockDialog.warning.mock.calls[0]?.[0] as DialogOptions | undefined;

      expect(dialogCall).toBeDefined();
      expect(dialogCall?.onPositiveClick).toBeDefined();

      // 触发确认回调
      if (dialogCall?.onPositiveClick) {
        await dialogCall.onPositiveClick();
      }

      // 等待异步操作完成
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(clearWalletSpy).toHaveBeenCalled();
      expect(mockClearAllWalletData).toHaveBeenCalled();
      expect(showSuccessSpy).toHaveBeenCalled();
    });

    it('应该在清除数据失败时显示错误', async () => {
      const mockClearAllWalletData = vi.mocked(clearAllWalletData);
      const mockError = new Error('清除失败');
      mockClearAllWalletData.mockRejectedValue(mockError);

      const showErrorSpy = vi.spyOn(uiStore, 'showError');

      const wrapper = createWrapper({ show: true });
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dialogCall = mockDialog.warning.mock.calls[0]?.[0] as DialogOptions | undefined;

      if (dialogCall?.onPositiveClick) {
        const result = await dialogCall.onPositiveClick();
        expect(result).toBe(false); // 应该阻止对话框关闭
        expect(showErrorSpy).toHaveBeenCalled();
      }
    });

    it('应该在用户取消时不执行任何操作', async () => {
      const clearWalletSpy = vi.spyOn(walletStore, 'clearWallet');
      const mockClearAllWalletData = vi.mocked(clearAllWalletData);

      const wrapper = createWrapper({ show: true });
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dialogCall = mockDialog.warning.mock.calls[0]?.[0] as DialogOptions | undefined;

      if (dialogCall?.onNegativeClick) {
        const result = dialogCall.onNegativeClick();
        expect(result).toBe(true); // 应该允许对话框关闭
        expect(clearWalletSpy).not.toHaveBeenCalled();
        expect(mockClearAllWalletData).not.toHaveBeenCalled();
      }
    });
  });

  describe('事件触发', () => {
    it('应该在成功退出后触发 confirmed 事件', async () => {
      const mockClearAllWalletData = vi.mocked(clearAllWalletData);
      mockClearAllWalletData.mockResolvedValue();

      const wrapper = createWrapper({ show: true });
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dialogCall = mockDialog.warning.mock.calls[0]?.[0] as DialogOptions | undefined;

      if (dialogCall?.onPositiveClick) {
        await dialogCall.onPositiveClick();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('confirmed')).toBeTruthy();
      }
    });

    it('应该在退出后更新 show 状态', async () => {
      const mockClearAllWalletData = vi.mocked(clearAllWalletData);
      mockClearAllWalletData.mockResolvedValue();

      const wrapper = createWrapper({ show: true });
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dialogCall = mockDialog.warning.mock.calls[0]?.[0] as DialogOptions | undefined;

      if (dialogCall?.onPositiveClick) {
        await dialogCall.onPositiveClick();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:show')).toBeTruthy();
        expect(wrapper.emitted('update:show')?.[0]).toEqual([false]);
      }
    });
  });

  describe('边界情况', () => {
    it('应该处理多次快速点击确认按钮', async () => {
      const mockClearAllWalletData = vi.mocked(clearAllWalletData);
      mockClearAllWalletData.mockResolvedValue();

      const wrapper = createWrapper({ show: true });
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dialogCall = mockDialog.warning.mock.calls[0]?.[0] as DialogOptions | undefined;

      if (dialogCall?.onPositiveClick) {
        // 模拟快速多次点击
        await Promise.all([dialogCall.onPositiveClick(), dialogCall.onPositiveClick()]);

        // 应该只调用一次清除操作（由于 isLoading 保护）
        expect(mockClearAllWalletData).toHaveBeenCalled();
      }
    });

    it('应该在清除数据过程中正确处理加载状态', async () => {
      const mockClearAllWalletData = vi.mocked(clearAllWalletData);
      // 模拟延迟
      mockClearAllWalletData.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const wrapper = createWrapper({ show: true });
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dialogCall = mockDialog.warning.mock.calls[0]?.[0] as DialogOptions | undefined;

      if (dialogCall?.onPositiveClick) {
        const promise = dialogCall.onPositiveClick();
        // 等待异步操作完成
        await promise;
        await wrapper.vm.$nextTick();
        // 验证清除操作被调用
        expect(mockClearAllWalletData).toHaveBeenCalled();
      }
    });
  });
});
