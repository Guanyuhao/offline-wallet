/**
 * @Author liyongjie
 * 原生扫描器（移动端）
 */

import type { IScanner, ScanOptions } from './types';

/**
 * 原生扫描器实现
 */
export class NativeScanner implements IScanner {
  private scannerModule: any = null;

  /**
   * 加载扫描模块
   */
  private async loadModule() {
    if (!this.scannerModule) {
      this.scannerModule = await import('@tauri-apps/plugin-barcode-scanner');
    }
    return this.scannerModule;
  }

  /**
   * 检查权限
   */
  async checkPermission(): Promise<boolean> {
    const module = await this.loadModule();
    const status = await module.checkPermissions();
    return status === 'granted';
  }

  /**
   * 请求权限
   */
  async requestPermission(): Promise<boolean> {
    const module = await this.loadModule();
    const status = await module.requestPermissions();
    return status === 'granted';
  }

  /**
   * 开始扫描
   */
  async scan(_options?: ScanOptions): Promise<string> {
    const module = await this.loadModule();

    // 检查权限
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('相机权限被拒绝，请在设置中允许访问相机');
      }
    }

    // 执行扫描（windowed: true 让 WebView 透明，可以显示自定义 UI）
    const result = await module.scan({
      windowed: true,
      formats: [module.Format.QRCode],
      cameraDirection: 'back',
    });

    if (!result?.content) {
      throw new Error('未扫描到二维码');
    }

    return result.content.trim();
  }
}
