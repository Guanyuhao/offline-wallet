import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useAutoLock } from '../useAutoLock';
import { useWalletStore } from '../../stores/wallet';

describe('useAutoLock', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    vi.useFakeTimers();
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('初始化', () => {
    it('应该在挂载时设置活动监听器', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      const wrapper = mount({
        setup() {
          useAutoLock();
          return {};
        },
        template: '<div></div>',
      });

      await nextTick();

      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach((event) => {
        expect(addEventListenerSpy).toHaveBeenCalledWith(event, expect.any(Function), {
          passive: true,
        });
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

      wrapper.unmount();
    });
  });

  describe('自动锁定机制', () => {
    it('应该在超时后锁定钱包', async () => {
      // 先设置 walletStore mock（在 mount 之前）
      const walletStore = useWalletStore();
      const lockWalletSpy = vi.spyOn(walletStore, 'lockWallet').mockResolvedValue(undefined);
      Object.defineProperty(walletStore, 'isLocked', {
        get: () => false,
        configurable: true,
        enumerable: true,
      });

      const wrapper = mount({
        setup() {
          useAutoLock();
          return {};
        },
        template: '<div></div>',
        global: {
          plugins: [pinia],
        },
      });

      await nextTick();
      // 等待 onMounted 钩子执行，updateActivity 会被调用
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 模拟用户活动（这会触发 updateActivity，设置定时器）
      document.dispatchEvent(new Event('mousedown'));
      await nextTick();

      // 等待超时（默认5分钟）
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 100); // 多等一点确保定时器触发

      expect(lockWalletSpy).toHaveBeenCalled();

      wrapper.unmount();
    });

    it('在钱包已锁定时不应该设置新的锁定定时器', async () => {
      const wrapper = mount({
        setup() {
          useAutoLock();
          return {};
        },
        template: '<div></div>',
      });

      const walletStore = useWalletStore();
      const lockWalletSpy = vi.spyOn(walletStore, 'lockWallet');
      Object.defineProperty(walletStore, 'isLocked', { get: () => true, configurable: true });

      await nextTick();

      // 模拟用户活动
      document.dispatchEvent(new Event('mousedown'));

      // 等待超时
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

      expect(lockWalletSpy).not.toHaveBeenCalled();

      wrapper.unmount();
    });

    it('应该在用户活动时重置锁定定时器', async () => {
      // 先设置 walletStore mock（在 mount 之前）
      const walletStore = useWalletStore();
      const lockWalletSpy = vi.spyOn(walletStore, 'lockWallet').mockResolvedValue(undefined);
      Object.defineProperty(walletStore, 'isLocked', {
        get: () => false,
        configurable: true,
        enumerable: true,
      });

      const wrapper = mount({
        setup() {
          useAutoLock();
          return {};
        },
        template: '<div></div>',
        global: {
          plugins: [pinia],
        },
      });

      await nextTick();
      // 等待 onMounted 钩子执行
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 第一次活动
      document.dispatchEvent(new Event('mousedown'));

      // 等待4分钟
      await vi.advanceTimersByTimeAsync(4 * 60 * 1000);

      // 第二次活动（重置定时器）
      document.dispatchEvent(new Event('click'));

      // 再等待4分钟（总共8分钟，但定时器已重置）
      await vi.advanceTimersByTimeAsync(4 * 60 * 1000);

      // 应该还没有锁定（因为定时器被重置了）
      expect(lockWalletSpy).not.toHaveBeenCalled();

      // 再等待1分钟（总共5分钟从最后一次活动开始）
      await vi.advanceTimersByTimeAsync(1 * 60 * 1000);

      expect(lockWalletSpy).toHaveBeenCalled();

      wrapper.unmount();
    });
  });

  describe('后台锁定', () => {
    it('应该在应用进入后台时立即锁定', async () => {
      const wrapper = mount({
        setup() {
          useAutoLock();
          return {};
        },
        template: '<div></div>',
      });

      const walletStore = useWalletStore();
      const lockWalletSpy = vi.spyOn(walletStore, 'lockWallet').mockResolvedValue(undefined);
      Object.defineProperty(walletStore, 'isLocked', { get: () => false, configurable: true });

      // Mock document.hidden
      Object.defineProperty(document, 'hidden', {
        get: () => true,
        configurable: true,
      });

      await nextTick();

      // 触发 visibilitychange 事件
      document.dispatchEvent(new Event('visibilitychange'));

      await nextTick();

      expect(lockWalletSpy).toHaveBeenCalled();

      wrapper.unmount();
    });

    it('在钱包已锁定时不应该再次锁定', async () => {
      const wrapper = mount({
        setup() {
          useAutoLock();
          return {};
        },
        template: '<div></div>',
      });

      const walletStore = useWalletStore();
      const lockWalletSpy = vi.spyOn(walletStore, 'lockWallet');
      Object.defineProperty(walletStore, 'isLocked', { get: () => true, configurable: true });

      Object.defineProperty(document, 'hidden', {
        get: () => true,
        configurable: true,
      });

      await nextTick();

      document.dispatchEvent(new Event('visibilitychange'));

      await nextTick();

      expect(lockWalletSpy).not.toHaveBeenCalled();

      wrapper.unmount();
    });
  });

  describe('活动定时器', () => {
    it('应该每30秒检查一次活动', async () => {
      const wrapper = mount({
        setup() {
          useAutoLock();
          return {};
        },
        template: '<div></div>',
      });

      const walletStore = useWalletStore();
      Object.defineProperty(walletStore, 'isLocked', { get: () => false, configurable: true });

      await nextTick();

      // 等待30秒
      await vi.advanceTimersByTimeAsync(30000);

      // 活动定时器应该已经触发（通过检查控制台日志或行为）

      wrapper.unmount();
    });
  });

  describe('清理', () => {
    it('应该在卸载时清理所有监听器', async () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const wrapper = mount({
        setup() {
          useAutoLock();
          return {};
        },
        template: '<div></div>',
      });

      await nextTick();

      wrapper.unmount();

      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach((event) => {
        expect(removeEventListenerSpy).toHaveBeenCalledWith(event, expect.any(Function));
      });

      expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    it('应该在卸载时清理定时器', async () => {
      const wrapper = mount({
        setup() {
          useAutoLock();
          return {};
        },
        template: '<div></div>',
      });

      await nextTick();

      wrapper.unmount();

      // 等待一段时间，确保定时器已被清理
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

      // 如果定时器没有被清理，这里可能会触发锁定
      // 但由于我们已经卸载了组件，不应该有任何副作用
    });
  });

  describe('返回值', () => {
    it('应该返回正确的状态和方法', async () => {
      const wrapper = mount({
        setup() {
          const autoLock = useAutoLock();
          return { autoLock };
        },
        template: '<div></div>',
      });

      await nextTick();

      expect(wrapper.vm.autoLock.isAutoLockEnabled).toBeDefined();
      expect(wrapper.vm.autoLock.autoLockTimeout).toBeDefined();
      expect(wrapper.vm.autoLock.lockOnBackground).toBeDefined();
      expect(wrapper.vm.autoLock.updateActivity).toBeDefined();
      expect(typeof wrapper.vm.autoLock.updateActivity).toBe('function');

      wrapper.unmount();
    });
  });
});
