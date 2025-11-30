import { createApp } from 'vue';
import { createPinia } from 'pinia';
import i18n from './i18n';
import App from './App.vue';
import { setupGlobalErrorHandlers } from './composables/useErrorHandler';
import './styles/global.css';
import './styles/apple-design-system.css';
import './styles/mobile-compatibility.css'; // 移动端 Web/App 样式兼容性修复

// WebView 视口高度修复 - 在应用启动时立即设置
// 使用统一的视口高度管理工具，支持现代 CSS 单位和降级方案
import { setupViewportHeight } from './composables/useViewportHeight';

// 立即初始化视口高度（在 DOM 加载前）
// 这确保在 Vue 应用启动前就设置好 CSS 变量
if (document.documentElement) {
  setupViewportHeight({
    debounce: true,
    debounceDelay: 16,
  });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    setupViewportHeight({
      debounce: true,
      debounceDelay: 16,
    });
  });
}

// 设置全局错误处理
setupGlobalErrorHandlers();

try {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(i18n);
  // Naive UI 使用按需导入，不需要全局注册

  app.mount('#app');
} catch (error) {
  console.error('Failed to mount app:', error);
  // 显示错误信息
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; max-width: 600px; margin: 50px auto;">
      <h1>应用启动失败</h1>
      <p style="color: #d32f2f;">错误信息: ${errorMessage}</p>
      <details style="margin-top: 20px;">
        <summary style="cursor: pointer; color: #666;">查看错误堆栈</summary>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; margin-top: 10px;">${errorStack}</pre>
      </details>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
        重新加载
      </button>
    </div>
  `;
}
