import { createViteConfig } from '../shared/vite.config.base';

// Hot Wallet 使用端口 1421
export default createViteConfig(import.meta.dirname, {
  port: 1421,
});
