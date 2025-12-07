/**
 * @Author liyongjie
 * 二维码扫描工具函数（统一入口）
 * 根据平台自动选择扫描方案：
 * - 移动端（iOS/Android）：使用 Tauri barcode-scanner 插件（原生方案）
 * - 桌面端：使用 Web API (getUserMedia + Canvas + jsQR)
 *
 * 参考：https://github.com/crabnebula-dev/qr-reader-demo
 */

import { createScannerForCurrentPlatform } from './scanner';

/**
 * 二维码扫描入口函数
 * 根据平台自动选择扫描方案
 */
export async function scanQR(
  videoElement?: HTMLVideoElement,
  canvasElement?: HTMLCanvasElement
): Promise<string> {
  try {
    const scanner = await createScannerForCurrentPlatform();
    return await scanner.scan({ videoElement, canvasElement });
  } catch (error: any) {
    console.error('[scanQR] 扫描失败:', error);
    throw error;
  }
}

/**
 * 检查移动端相机权限
 */
export async function checkMobileCameraPermission(): Promise<boolean> {
  try {
    const scanner = await createScannerForCurrentPlatform();
    return await scanner.checkPermission();
  } catch (error) {
    console.error('[checkMobileCameraPermission] 权限检查失败:', error);
    return false;
  }
}

/**
 * 请求移动端相机权限
 */
export async function requestMobileCameraPermission(): Promise<boolean> {
  try {
    const scanner = await createScannerForCurrentPlatform();
    return await scanner.requestPermission();
  } catch (error) {
    console.error('[requestMobileCameraPermission] 权限请求失败:', error);
    return false;
  }
}
