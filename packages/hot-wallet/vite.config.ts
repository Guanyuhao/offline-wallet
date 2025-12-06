import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production' || command === 'build';

  return {
    plugins: [react()],
    server: {
      port: 1421,
      strictPort: true,
    },
    esbuild: {
      // 生产环境移除 console 和 debugger
      drop: isProduction ? ['console', 'debugger'] : [],
    },
    build: {
      target: 'es2020',
    },
  };
});
