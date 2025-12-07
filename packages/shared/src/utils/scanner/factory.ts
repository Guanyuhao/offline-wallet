/**
 * @Author liyongjie
 * 扫描器工厂
 */

import type { IScanner, Platform } from './types';
import { detectPlatform, isMobilePlatform } from './platform';
import { WebScanner } from './web-scanner';
import { NativeScanner } from './native-scanner';

/**
 * 创建扫描器实例
 */
export function createScanner(platform: Platform): IScanner {
  if (isMobilePlatform(platform)) {
    return new NativeScanner();
  }
  return new WebScanner();
}

/**
 * 根据当前平台创建扫描器
 */
export async function createScannerForCurrentPlatform(): Promise<IScanner> {
  const platform = await detectPlatform();
  return createScanner(platform);
}
