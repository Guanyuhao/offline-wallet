/**
 * @Author liyongjie
 * 平台检测工具
 */

import type { Platform } from './types';

/**
 * 检测当前平台
 */
export async function detectPlatform(): Promise<Platform> {
  try {
    // 检查是否在 Tauri 环境中
    const isTauri =
      typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

    if (!isTauri) {
      // 非 Tauri 环境，使用 User Agent 检测
      return detectPlatformFromUserAgent();
    }

    // 尝试动态导入 Tauri OS 插件
    const osModule = await import('@tauri-apps/plugin-os');

    // 检查插件是否可用
    if (!osModule || typeof osModule.platform !== 'function') {
      console.warn('[Platform] Tauri OS 插件不可用，使用 User Agent 检测');
      return detectPlatformFromUserAgent();
    }

    const platform = await osModule.platform();
    return platform as Platform;
  } catch (error) {
    console.warn('[Platform] 平台检测失败，使用 User Agent 检测:', error);
    // 降级到 User Agent 检测
    return detectPlatformFromUserAgent();
  }
}

/**
 * 从 User Agent 检测平台（降级方案）
 */
function detectPlatformFromUserAgent(): Platform {
  if (typeof navigator === 'undefined') {
    return 'macOS'; // 默认桌面端
  }

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('android')) {
    return 'android';
  }

  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'ios';
  }

  if (ua.includes('mac')) {
    return 'macOS';
  }

  if (ua.includes('win')) {
    return 'windows';
  }

  if (ua.includes('linux')) {
    return 'linux';
  }

  // 默认返回 macOS（桌面端）
  return 'macOS';
}

/**
 * 判断是否为移动端平台
 */
export function isMobilePlatform(platform: Platform): boolean {
  return platform === 'android' || platform === 'ios';
}

/**
 * 判断是否为桌面端平台
 */
export function isDesktopPlatform(platform: Platform): boolean {
  return !isMobilePlatform(platform);
}
