import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ViewType = 'welcome' | 'create' | 'import' | 'wallet' | 'settings';
export type ThemeType = 'light' | 'dark' | 'auto';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export const useUIStore = defineStore('ui', () => {
  // State
  const currentView = ref<ViewType>('welcome');
  const theme = ref<ThemeType>('auto');
  const isLoading = ref<boolean>(false);
  const loadingMessage = ref<string>('');
  const toasts = ref<ToastMessage[]>([]);

  // Actions
  function setView(view: ViewType): void {
    currentView.value = view;
  }

  function setTheme(newTheme: ThemeType): void {
    theme.value = newTheme;
    localStorage.setItem('app-theme', newTheme);
    applyTheme(newTheme);
  }

  function applyTheme(newTheme: ThemeType): void {
    const root = document.documentElement;
    
    if (newTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
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

  function showToast(
    message: string,
    type: ToastMessage['type'] = 'info',
    duration: number = 3000
  ): void {
    const id = Date.now().toString();
    const toast: ToastMessage = { id, type, message, duration };
    
    toasts.value.push(toast);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }

  function removeToast(id: string): void {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  }

  function showSuccess(message: string, duration?: number): void {
    showToast(message, 'success', duration);
  }

  function showError(message: string, duration?: number): void {
    showToast(message, 'error', duration);
  }

  function showWarning(message: string, duration?: number): void {
    showToast(message, 'warning', duration);
  }

  function showInfo(message: string, duration?: number): void {
    showToast(message, 'info', duration);
  }

  // Initialize theme on load
  const initTheme = () => {
    const saved = localStorage.getItem('app-theme') as ThemeType;
    if (saved) {
      theme.value = saved;
    }
    applyTheme(theme.value);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
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
    toasts,
    
    // Actions
    setView,
    setTheme,
    showLoading,
    hideLoading,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    initTheme,
  };
});

