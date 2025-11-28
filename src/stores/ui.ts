import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAppMessage } from '../composables/useMessage';

export type ViewType = 'welcome' | 'create' | 'import' | 'wallet' | 'settings';
export type ThemeType = 'light' | 'dark' | 'auto';

// 消息去重：记录最近显示的消息和时间戳
const recentMessages = new Map<string, number>();
const MESSAGE_DEBOUNCE_MS = 2000; // 2秒内相同消息不重复显示

export const useUIStore = defineStore('ui', () => {
  // State
  const currentView = ref<ViewType>('welcome');
  const theme = ref<ThemeType>('auto');
  const isLoading = ref<boolean>(false);
  const loadingMessage = ref<string>('');

  // Actions
  function setView(view: ViewType): void {
    currentView.value = view;
  }

  function setTheme(newTheme: ThemeType): void {
    theme.value = newTheme;
    localStorage.setItem('app-theme', newTheme);
    applyTheme(newTheme);
    
    // 触发自定义事件，通知其他组件主题已变化
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: newTheme }));
  }

  function applyTheme(newTheme: ThemeType): void {
    const root = document.documentElement;
    
    // 移除之前的主题类
    root.classList.remove('dark', 'light');
    
    if (newTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.add('light');
      }
    } else if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }

  function showLoading(message: string = 'Loading...'): void {
    isLoading.value = true;
    loadingMessage.value = message;
  }

  function hideLoading(): void {
    isLoading.value = false;
    loadingMessage.value = '';
  }

  // 检查消息是否应该显示（去重）
  function shouldShowMessage(message: string): boolean {
    const now = Date.now();
    const lastTime = recentMessages.get(message);
    
    if (lastTime && (now - lastTime) < MESSAGE_DEBOUNCE_MS) {
      return false; // 在去重时间窗口内，不显示
    }
    
    recentMessages.set(message, now);
    return true;
  }

function showSuccess(message: string, duration: number = 3000): void {
    if (!shouldShowMessage(`success:${message}`)) return;
    
    try {
      const messageApi = useAppMessage();
      messageApi.success(message, { duration });
    } catch (error) {
      // Message API not initialized yet, fallback to console
      console.log('Success:', message);
    }
  }

  function showError(message: string, duration: number = 5000): void {
    if (!shouldShowMessage(`error:${message}`)) return;
    
    try {
      const messageApi = useAppMessage();
      messageApi.error(message, { duration });
    } catch (error) {
      // Message API not initialized yet, fallback to console
      console.error('Error:', message);
    }
  }

  function showWarning(message: string, duration: number = 4000): void {
    if (!shouldShowMessage(`warning:${message}`)) return;
    
    try {
      const messageApi = useAppMessage();
      messageApi.warning(message, { duration });
    } catch (error) {
      // Message API not initialized yet, fallback to console
      console.warn('Warning:', message);
    }
  }

  function showInfo(message: string, duration: number = 3000): void {
    if (!shouldShowMessage(`info:${message}`)) return;
    
    try {
      const messageApi = useAppMessage();
      messageApi.info(message, { duration });
    } catch (error) {
      // Message API not initialized yet, fallback to console
      console.info('Info:', message);
    }
  }

  // Initialize theme on load
  const initTheme = () => {
    const saved = localStorage.getItem('app-theme') as ThemeType;
    if (saved) {
      theme.value = saved;
    }
    applyTheme(theme.value);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'auto') {
        applyTheme('auto');
      }
    });
  };

  return {
    // State
    currentView,
    theme,
    isLoading,
    loadingMessage,
    
    // Actions
    setView,
    setTheme,
    showLoading,
    hideLoading,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    initTheme,
  };
});

