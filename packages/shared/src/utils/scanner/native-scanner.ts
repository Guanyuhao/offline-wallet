/**
 * @Author liyongjie
 * 原生扫描器（移动端）
 *
 * 重要说明：
 * - 此扫描器依赖 @tauri-apps/plugin-barcode-scanner
 * - Tauri 插件只能在 Tauri 应用运行时环境内工作
 * - 插件必须在 Rust 端注册：builder.plugin(tauri_plugin_barcode_scanner::init())
 * - 插件依赖 window.__TAURI_IPC__ 进行 WebView ↔ Rust 通信
 */

import type { IScanner, ScanOptions } from './types';
import { isTauriEnvironment } from '../platform';

/**
 * 原生扫描器实现
 *
 * 仅在 Tauri 环境中可用，使用原生相机和二维码识别
 */
export class NativeScanner implements IScanner {
  private scannerModule: any = null;

  /**
   * 加载扫描模块
   *
   * 注意：必须在 Tauri 环境中才能成功加载
   */
  private async loadModule() {
    // 先检查是否在 Tauri 环境中
    if (!isTauriEnvironment()) {
      throw new Error(
        'NativeScanner 只能在 Tauri 应用环境中使用。' +
          '请确保插件已在 Rust 端注册：builder.plugin(tauri_plugin_barcode_scanner::init())'
      );
    }

    if (!this.scannerModule) {
      try {
        // 动态导入 Tauri barcode-scanner 插件
        // 如果插件未注册或环境不正确，这里会抛出错误
        this.scannerModule = await import('@tauri-apps/plugin-barcode-scanner');

        // 验证模块是否包含必要的方法
        if (!this.scannerModule || typeof this.scannerModule.scan !== 'function') {
          throw new Error('Tauri barcode-scanner 插件未正确加载');
        }
      } catch (error) {
        throw new Error(
          `无法加载 Tauri barcode-scanner 插件: ${error}` +
            '\n请确保：' +
            '\n1. 插件已在 Rust 端注册：builder.plugin(tauri_plugin_barcode_scanner::init())' +
            '\n2. 插件已在 capabilities 中配置权限' +
            '\n3. 应用正在 Tauri 运行时环境中运行'
        );
      }
    }
    return this.scannerModule;
  }

  /**
   * 检查权限
   */
  async checkPermission(): Promise<boolean> {
    if (!isTauriEnvironment()) {
      return false;
    }

    try {
      const module = await this.loadModule();
      const status = await module.checkPermissions();
      return status === 'granted';
    } catch (error) {
      console.error('[NativeScanner] 检查权限失败:', error);
      return false;
    }
  }

  /**
   * 请求权限
   */
  async requestPermission(): Promise<boolean> {
    if (!isTauriEnvironment()) {
      throw new Error('NativeScanner 只能在 Tauri 应用环境中使用');
    }

    try {
      const module = await this.loadModule();
      const status = await module.requestPermissions();
      return status === 'granted';
    } catch (error) {
      console.error('[NativeScanner] 请求权限失败:', error);
      throw error;
    }
  }

  /**
   * 开始扫描
   */
  async scan(_options?: ScanOptions): Promise<string> {
    if (!isTauriEnvironment()) {
      throw new Error('NativeScanner 只能在 Tauri 应用环境中使用');
    }

    const module = await this.loadModule();

    // 检查权限
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('相机权限被拒绝，请在设置中允许访问相机');
      }
    }

    try {
      // 执行扫描
      // windowed: false 使用全屏原生 UI（推荐，性能更好）
      // windowed: true 使用透明窗口，允许自定义 Web UI（需要额外配置）
      const result = await module.scan({
        windowed: false, // 使用原生全屏 UI
        formats: [module.Format.QRCode],
        cameraDirection: 'back',
      });

      if (!result?.content) {
        throw new Error('未扫描到二维码');
      }

      return result.content.trim();
    } catch (error: any) {
      // 处理用户取消的情况
      if (
        error?.message?.includes('cancel') ||
        error?.message?.includes('取消') ||
        error?.message?.includes('User cancelled')
      ) {
        throw new Error('用户取消了扫描');
      }
      throw error;
    }
  }

  /**
   * 取消扫描
   *
   * 调用 Tauri barcode-scanner 插件的 cancel() 方法
   * 用于主动取消正在进行的扫描操作
   *
   * 参考：https://v2.tauri.app/reference/javascript/barcode-scanner/#cancel
   */
  async cancel(): Promise<void> {
    if (!isTauriEnvironment()) {
      console.warn('[NativeScanner] 不在 Tauri 环境中，无法取消扫描');
      return;
    }

    try {
      const module = await this.loadModule();
      if (module.cancel && typeof module.cancel === 'function') {
        await module.cancel();
        console.log('[NativeScanner] 扫描已取消');
      } else {
        console.warn('[NativeScanner] cancel 函数不可用，可能没有正在进行的扫描');
      }
    } catch (error) {
      console.error('[NativeScanner] 取消扫描失败:', error);
      // 不抛出错误，因为可能没有正在进行的扫描
    }
  }
}
