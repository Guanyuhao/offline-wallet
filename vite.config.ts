import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// 性能优化插件
const performanceOptimization = () => ({
  name: 'performance-optimization',
  transformIndexHtml(html: string) {
    // 在生产环境注入性能优化 meta 标签
    if (process.env.NODE_ENV === 'production') {
      return html.replace(
        '<head>',
        `<head>
    <!-- 性能优化 -->
    <meta http-equiv="x-dns-prefetch-control" content="on" />
    <meta name="format-detection" content="telephone=no" />`
      );
    }
    return html;
  },
});

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [vue(), performanceOptimization()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        // 手动代码分割，将大库分离
        manualChunks: (id) => {
          // node_modules 中的依赖
          if (id.includes('node_modules')) {
            // Naive UI 单独打包（UI 库较大）
            if (id.includes('naive-ui')) {
              return 'naive-ui';
            }
            // Vue 相关
            if (id.includes('vue') || id.includes('@vue')) {
              return 'vue-vendor';
            }
            // Tauri API 相关
            if (id.includes('@tauri-apps')) {
              return 'tauri-vendor';
            }
            // 国际化相关
            if (id.includes('vue-i18n') || id.includes('@intlify')) {
              return 'i18n-vendor';
            }
            // 图标库
            if (id.includes('@vicons')) {
              return 'icons-vendor';
            }
            // Pinia 状态管理
            if (id.includes('pinia')) {
              return 'pinia-vendor';
            }
            // 其他第三方库
            return 'vendor';
          }
        },
        // 优化 chunk 文件命名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      external: [
        // 可选依赖，运行时动态导入
        'jsqr',
        '@tauri-apps/plugin-barcode-scanner',
      ],
    },
    // 提高 chunk 大小警告阈值（因为我们已经做了代码分割）
    chunkSizeWarningLimit: 600,
    // 启用 source map（生产环境可选，但有助于调试）
    sourcemap: false,
    // 压缩配置
    minify: 'esbuild',
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 目标浏览器
    target: 'es2020',
  },
}));
