/**
 * 自动锁定机制
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useWalletStore } from '../stores/wallet';

const AUTO_LOCK_TIMEOUT = 5 * 60 * 1000; // 默认5分钟（毫秒）
let lockTimer: ReturnType<typeof setTimeout> | null = null;
let activityTimer: ReturnType<typeof setInterval> | null = null;

const isAutoLockEnabled = ref(true);
const autoLockTimeout = ref(AUTO_LOCK_TIMEOUT);
const lockOnBackground = ref(true);

/**
 * 初始化自动锁定
 */
export function useAutoLock() {
  const walletStore = useWalletStore();

  function updateActivity() {
    // 清除旧的定时器
    if (lockTimer) {
      clearTimeout(lockTimer);
      lockTimer = null;
    }

    // 如果钱包已锁定，不设置新的定时器
    if (walletStore.isLocked) {
      return;
    }

    // 设置新的锁定定时器
    if (isAutoLockEnabled.value && autoLockTimeout.value > 0) {
      lockTimer = setTimeout(async () => {
        if (!walletStore.isLocked) {
          await walletStore.lockWallet();
          console.log('Wallet auto-locked due to inactivity');
        }
      }, autoLockTimeout.value);
    }
  }

  async function handleVisibilityChange() {
    if (document.hidden && lockOnBackground.value && !walletStore.isLocked) {
      // 应用进入后台，立即锁定
      await walletStore.lockWallet();
      console.log('Wallet locked due to app background');
    }
  }

  function handleUserActivity() {
    updateActivity();
  }

  onMounted(() => {
    // 监听用户活动
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 初始化活动定时器（每30秒检查一次）
    activityTimer = setInterval(() => {
      if (!walletStore.isLocked) {
        updateActivity();
      }
    }, 30000);

    // 初始更新
    updateActivity();
  });

  onUnmounted(() => {
    // 清理定时器
    if (lockTimer) {
      clearTimeout(lockTimer);
    }
    if (activityTimer) {
      clearInterval(activityTimer);
    }

    // 移除事件监听器
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.removeEventListener(event, handleUserActivity);
    });
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return {
    isAutoLockEnabled,
    autoLockTimeout,
    lockOnBackground,
    updateActivity,
  };
}
