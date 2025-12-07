/**
 * @Author liyongjie
 * Rust 端二维码扫描工具函数
 *
 * 通过 Tauri 命令获取扫描配置，然后调用前端插件 API
 * 使用 windowed: true 模式，可以使用自定义的 Web UI
 */

import { invoke } from '@tauri-apps/api/core';
import { scan, cancel, Format } from '@tauri-apps/plugin-barcode-scanner';

/**
 * 扫描配置
 */
export interface ScanConfig {
  /**
   * 是否使用窗口模式（true: 透明窗口 + Web UI, false: 原生全屏 UI）
   */
  windowed?: boolean;
  /**
   * 相机方向（"back" 或 "front"）
   */
  camera_direction?: 'back' | 'front';
}

/**
 * 窗口模式扫描二维码
 *
 * 1. 通过 Rust 命令获取扫描配置
 * 2. 使用前端插件 API 执行窗口模式扫描（windowed: true）
 * 3. 返回扫描结果
 *
 * 这样可以使用自定义的 Web UI 界面
 *
 * @param config 扫描配置（可选）
 * @returns 扫描到的二维码内容
 */
export async function scanQRCodeWindowed(config?: ScanConfig): Promise<string> {
  try {
    console.log('[Rust Scanner] 开始窗口模式扫描，配置:', config);

    // 从 Rust 端获取扫描配置（统一管理配置）
    console.log('[Rust Scanner] 调用 prepare_windowed_scan...');
    const rustConfig = await invoke<ScanConfig>('prepare_windowed_scan', {
      config: config || { windowed: true, camera_direction: 'back' },
    });
    console.log('[Rust Scanner] Rust 配置获取成功:', rustConfig);

    // 检查插件是否可用
    console.log('[Rust Scanner] 检查插件 scan 函数是否可用...');
    if (typeof scan !== 'function') {
      throw new Error('barcode-scanner 插件的 scan 函数不可用，请确保插件已正确注册');
    }

    // 使用前端插件 API 执行扫描
    const cameraDirection: 'back' | 'front' =
      rustConfig.camera_direction === 'front' ? 'front' : 'back';
    const scanOptions = {
      windowed: rustConfig.windowed ?? true,
      formats: [Format.QRCode],
      cameraDirection,
    };
    console.log('[Rust Scanner] 调用插件 scan API...', scanOptions);

    // 直接调用扫描，用户可以通过返回按钮取消
    const result = await scan(scanOptions);
    console.log('[Rust Scanner] 扫描完成，结果:', result);

    if (!result || !result.content) {
      throw new Error('扫描结果为空');
    }

    return result.content;
  } catch (error: any) {
    console.error('[Rust Scanner] 窗口模式扫描失败:', error);

    // 如果是用户取消，不抛出错误
    if (
      error?.message?.includes('cancel') ||
      error?.message?.includes('取消') ||
      error?.message?.includes('User cancelled')
    ) {
      throw new Error('用户取消了扫描');
    }

    throw new Error(error?.message || error?.toString() || '扫描失败');
  }
}

/**
 * 原生全屏模式扫描二维码
 *
 * 1. 通过 Rust 命令获取扫描配置
 * 2. 使用前端插件 API 执行原生全屏模式扫描（windowed: false）
 * 3. 返回扫描结果
 *
 * @returns 扫描到的二维码内容
 */
export async function scanQRCodeNative(): Promise<string> {
  try {
    // 从 Rust 端获取扫描配置
    const rustConfig = await invoke<ScanConfig>('prepare_native_scan');

    // 使用前端插件 API 执行扫描
    const cameraDirection: 'back' | 'front' =
      rustConfig.camera_direction === 'front' ? 'front' : 'back';
    const result = await scan({
      windowed: rustConfig.windowed ?? false,
      formats: [Format.QRCode],
      cameraDirection,
    });

    return result.content;
  } catch (error: any) {
    console.error('[Rust Scanner] 原生扫描失败:', error);

    // 如果是用户取消，不抛出错误
    if (
      error?.message?.includes('cancel') ||
      error?.message?.includes('取消') ||
      error?.message?.includes('User cancelled')
    ) {
      throw new Error('用户取消了扫描');
    }

    throw new Error(error?.message || error?.toString() || '扫描失败');
  }
}

/**
 * 取消当前扫描过程
 *
 * 调用 Tauri barcode-scanner 插件的 cancel() 方法
 * 用于主动取消正在进行的扫描操作
 *
 * 参考：https://v2.tauri.app/reference/javascript/barcode-scanner/#cancel
 *
 * @returns Promise<void>
 */
export async function cancelBarcodeScanner(): Promise<void> {
  try {
    // 检查插件是否可用
    if (typeof cancel !== 'function') {
      console.warn('[Rust Scanner] cancel 函数不可用，可能没有正在进行的扫描');
      return;
    }

    console.log('[Rust Scanner] 取消扫描...');
    await cancel();
    console.log('[Rust Scanner] 扫描已取消');
  } catch (error: any) {
    console.error('[Rust Scanner] 取消扫描失败:', error);
    // 不抛出错误，因为可能没有正在进行的扫描
  }
}
