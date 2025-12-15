import { createViteConfig } from '../shared/vite.config.base';

// Cold Wallet 使用端口 1420
export default createViteConfig(import.meta.dirname, {
  port: 1420,
});
