/**
 * @Author liyongjie
 * 二维码扫描工具函数（统一入口）
 *
 * 根据平台自动选择扫描方案：
 * - 移动端（iOS/Android）：优先使用 Tauri barcode-scanner 插件（原生方案）
 * - 桌面端：使用 Web API (getUserMedia + Canvas + jsQR)
 *
 * 重要说明：
 * - Tauri 插件只能在 Tauri 应用运行时环境内工作
 * - 如果移动端不在 Tauri 环境中，会降级到 Web API（可能不支持）
 *
 * 参考：https://github.com/crabnebula-dev/qr-reader-demo
 */

import { createScannerForCurrentPlatform } from './scanner';

/**
 * 二维码扫描入口函数
 * 根据平台自动选择扫描方案
 *
 * @param videoElement 视频元素（桌面端 Web API 必需）
 * @param canvasElement 画布元素（桌面端 Web API 必需）
 * @returns 扫描到的二维码内容
 * @throws 如果扫描失败或不在 Tauri 环境中（移动端）
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

    // 如果是移动端且不在 Tauri 环境中，提供更友好的错误信息
    if (error?.message?.includes('Tauri') || error?.message?.includes('插件')) {
      throw new Error(
        '移动端扫描功能需要在 Tauri 应用中运行。' +
          '请确保：\n' +
          '1. 应用正在 Tauri 运行时环境中运行\n' +
          '2. barcode-scanner 插件已在 Rust 端注册\n' +
          '3. 插件权限已在 capabilities 中配置'
      );
    }

    throw error;
  }
}

/**
 * 检查移动端相机权限
 *
 * 注意：仅在 Tauri 环境中有效
 *
 * @returns 是否有权限
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
 *
 * 注意：仅在 Tauri 环境中有效
 *
 * @returns 是否获得权限
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

/**
 * 取消当前扫描过程
 *
 * 根据平台自动选择取消方案：
 * - 移动端（iOS/Android）：通过 NativeScanner 调用 Tauri barcode-scanner 插件的 cancel() 方法
 * - 桌面端：通过 WebScanner 清理 Web API 资源（停止相机流）
 *
 * 注意：
 * - 如果当前没有正在进行的扫描，调用此函数不会报错
 *
 * @returns Promise<void>
 */
export async function cancelScanQR(): Promise<void> {
  try {
    const scanner = await createScannerForCurrentPlatform();
    if (scanner.cancel) {
      await scanner.cancel();
    }
  } catch (error) {
    console.error('[cancelScanQR] 取消扫描失败:', error);
    // 不抛出错误，因为可能没有正在进行的扫描
  }
}
