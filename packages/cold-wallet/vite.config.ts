import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件目录（ESM 方式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production' || command === 'build';

  return {
    plugins: [react()],
    server: {
      port: 1420,
      strictPort: true,
    },
    esbuild: {
      // 生产环境移除 console 和 debugger
      //  TODO: 调试
      // drop: [],
      drop: isProduction ? ['console', 'debugger'] : [],
    },
    build: {
      target: 'es2020',
      // 输出目录
      outDir: 'dist',
      // 生成 source map（生产环境可以关闭以减小体积）
      sourcemap: false,
      // 最小化输出
      minify: 'esbuild', // 使用 esbuild 压缩，比 terser 更快
      // 启用 CSS 代码拆分
      cssCodeSplit: true,
      // 构建后是否生成 gzip 压缩报告
      reportCompressedSize: true,
      // chunk 大小警告限制（kb）
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        // Tree-Shaking 优化配置
        treeshake: {
          moduleSideEffects: false, // 假设所有模块都没有副作用（除了 package.json 中声明的）
          propertyReadSideEffects: false, // 属性读取无副作用，允许更激进的 Tree-Shaking
          tryCatchDeoptimization: false, // 禁用 try-catch 去优化，允许更好的 Tree-Shaking
          preset: 'recommended', // 使用推荐的 Tree-Shaking 预设
        },
        output: {
          // 手动分包策略
          manualChunks: (id) => {
            // node_modules 中的包单独打包
            if (id.includes('node_modules')) {
              // React 相关库单独打包
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              // antd-mobile 单独打包
              if (id.includes('antd-mobile')) {
                return 'antd-mobile-vendor';
              }
              // Tauri API 单独打包
              if (id.includes('@tauri-apps')) {
                return 'tauri-vendor';
              }
              // 其他第三方库
              return 'vendor';
            }
            // shared 包单独打包
            if (id.includes('@shared')) {
              return 'shared';
            }
          },
          // 输出文件命名
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@shared': resolve(__dirname, '../shared/src'),
        '@offline-wallet/shared': resolve(__dirname, '../shared/src'),
      },
    },
    // 优化依赖预构建
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'antd-mobile',
        'zustand',
        '@tauri-apps/api/core',
      ],
      exclude: ['@tauri-apps/plugin-barcode-scanner'], // 动态导入的插件不预构建
    },
  };
});
