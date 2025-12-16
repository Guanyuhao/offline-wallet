import { defineConfig, mergeConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * 创建基础 Vite 配置
 * @param rootDir - 调用方的根目录（通常是 import.meta.dirname 或 __dirname）
 * @param options - 自定义选项
 */
export function createBaseConfig(
  rootDir: string,
  options: {
    /** 开发服务器端口 */
    port?: number;
    /** 额外的路径别名 */
    extraAlias?: Record<string, string>;
    /** 额外的预构建依赖 */
    extraOptimizeDepsInclude?: string[];
    /** 排除预构建的依赖 */
    extraOptimizeDepsExclude?: string[];
  } = {}
): UserConfig {
  const {
    port = 1420,
    extraAlias = {},
    extraOptimizeDepsInclude = [],
    extraOptimizeDepsExclude = [],
  } = options;

  // 计算 shared 包的路径
  const sharedPath = resolve(rootDir, '../shared/src');

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
    },
    build: {
      target: 'es2020',
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      cssCodeSplit: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
          preset: 'recommended',
        },
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              if (id.includes('antd-mobile')) {
                return 'antd-mobile-vendor';
              }
              if (id.includes('@tauri-apps')) {
                return 'tauri-vendor';
              }
              return 'vendor';
            }
            if (id.includes('@shared') || id.includes('@offline-wallet/shared')) {
              return 'shared';
            }
          },
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
        '@shared': sharedPath,
        // 处理 @offline-wallet/shared 的子路径导出（注意顺序：具体路径在前）
        '@offline-wallet/shared/config': resolve(sharedPath, 'config/chainConfig.ts'),
        '@offline-wallet/shared/components': resolve(sharedPath, 'components'),
        '@offline-wallet/shared/utils': resolve(sharedPath, 'utils'),
        '@offline-wallet/shared/types': resolve(sharedPath, 'types'),
        '@offline-wallet/shared': sharedPath,
        ...extraAlias,
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'antd-mobile',
        'zustand',
        '@tauri-apps/api/core',
        ...extraOptimizeDepsInclude,
      ],
      exclude: ['@tauri-apps/plugin-barcode-scanner', ...extraOptimizeDepsExclude],
    },
  };
}

/**
 * 创建完整的 Vite 配置（带环境判断）
 * @param rootDir - 调用方的根目录
 * @param options - 自定义选项
 */
export function createViteConfig(
  rootDir: string,
  options: Parameters<typeof createBaseConfig>[1] = {}
) {
  return defineConfig(({ command, mode }) => {
    const isProduction = mode === 'production' || command === 'build';
    const baseConfig = createBaseConfig(rootDir, options);

    return mergeConfig(baseConfig, {
      esbuild: {
        // 生产环境移除 console 和 debugger
        drop: isProduction ? ['console', 'debugger'] : [],
      },
    });
  });
}

export default createViteConfig;
