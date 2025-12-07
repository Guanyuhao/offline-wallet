/**
 * @Author liyongjie
 * 扫描器工厂
 *
 * 重要说明：
 * - NativeScanner 只能在 Tauri 环境中使用
 * - WebScanner 可以在任何支持 Web API 的环境中使用（浏览器、Tauri 桌面端）
 * - 工厂函数会根据平台和环境自动选择合适的扫描器
 */

import type { IScanner } from './types';
import type { Platform } from '../platform';
import { detectPlatform, isMobilePlatform, isTauriEnvironment } from '../platform';
import { WebScanner } from './web-scanner';
import { NativeScanner } from './native-scanner';

/**
 * 创建扫描器实例
 *
 * @param platform 目标平台
 * @returns 扫描器实例
 */
export function createScanner(platform: Platform): IScanner {
  if (isMobilePlatform(platform)) {
    // 移动端：优先使用原生扫描器（需要 Tauri 环境）
    // 如果不在 Tauri 环境中，会抛出错误，调用方需要处理
    return new NativeScanner();
  }

  // 桌面端：使用 Web API 扫描器（可在浏览器或 Tauri 桌面端使用）
  return new WebScanner();
}

/**
 * 根据当前平台创建扫描器
 *
 * 策略：
 * 1. 检测当前平台
 * 2. 移动端：如果不在 Tauri 环境中，降级到 WebScanner（如果支持）
 * 3. 桌面端：使用 WebScanner
 *
 * @returns 扫描器实例
 */
export async function createScannerForCurrentPlatform(): Promise<IScanner> {
  const platform = await detectPlatform();

  if (isMobilePlatform(platform)) {
    // 移动端平台
    if (isTauriEnvironment()) {
      // 在 Tauri 环境中，使用原生扫描器
      return new NativeScanner();
    } else {
      // 不在 Tauri 环境中（如浏览器开发环境），降级到 Web API
      // 注意：移动端浏览器可能不支持 getUserMedia，会失败
      console.warn(
        '[ScannerFactory] 移动端不在 Tauri 环境中，降级到 Web API 扫描器。' +
          '原生扫描器需要在 Tauri 应用中运行。'
      );
      return new WebScanner();
    }
  }

  // 桌面端：使用 Web API 扫描器
  return new WebScanner();
}
