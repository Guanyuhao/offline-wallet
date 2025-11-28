import { createApp } from 'vue';
import { createPinia } from 'pinia';
import i18n from './i18n';
import App from './App.vue';
import './styles/global.css';

try {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(i18n);

  app.mount('#app');
} catch (error) {
  console.error('Failed to mount app:', error);
  // 显示错误信息
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>应用启动失败</h1>
      <p>错误信息: ${errorMessage}</p>
      <pre>${errorStack}</pre>
    </div>
  `;
}
