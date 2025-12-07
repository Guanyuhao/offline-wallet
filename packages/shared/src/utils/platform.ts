/**
 * @Author liyongjie
 * 平台检测工具
 *
 * 参考：https://tauri.app/reference/javascript/os/
 *
 * 重要说明：
 * - Rust 端已通过 register_all_plugins() 注册了 tauri-plugin-os（所有平台）
 * - 在插件已注册的情况下，可以直接使用静态导入，无需动态导入
 * - 如果插件调用失败，会降级到 User Agent 检测
 * - 这是一个通用的平台检测工具，可在整个应用中使用
 */
import { platform } from '@tauri-apps/plugin-os';

/**
 * 平台类型
 */
export type Platform = 'android' | 'ios' | 'macOS' | 'windows' | 'linux';

/**
 * 检查是否在 Tauri 环境中
 *
 * Tauri 插件需要以下运行时对象之一：
 * - window.__TAURI_INTERNALS__: Tauri 内部对象
 * - window.__TAURI_METADATA__: Tauri 元数据对象
 * - window.__TAURI_IPC__: Tauri IPC 通道（插件通信必需）
 */
export function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const win = window as any;
  return (
    win.__TAURI_INTERNALS__ !== undefined ||
    win.__TAURI_METADATA__ !== undefined ||
    win.__TAURI_IPC__ !== undefined
  );
}

/**
 * 检测当前平台
 *
 * 策略：
 * 1. 优先使用 @tauri-apps/plugin-os 获取准确平台信息
 *    （Rust 端已通过 register_all_plugins() 注册了 tauri-plugin-os，所有平台都可用）
 * 2. 如果插件调用失败，降级到 User Agent 检测
 *
 * 注意：由于 Rust 端已注册插件，可以直接使用静态导入，无需动态导入
 *
 * @returns 当前平台
 */
export async function detectPlatform(): Promise<Platform> {
  // 优先使用 @tauri-apps/plugin-os 插件
  // Rust 端已通过 register_all_plugins() 注册了 tauri-plugin-os（所有平台）
  try {
    const detectedPlatform = await platform();
    console.log('[Platform] 使用 @tauri-apps/plugin-os 检测平台:', detectedPlatform);
    return mapTauriPlatformToOurPlatform(detectedPlatform);
  } catch (error) {
    // 插件调用失败，使用 User Agent 检测
    // 可能的原因：
    // 1. Tauri 运行时未完全初始化
    // 2. 插件版本不匹配
    // 3. 其他运行时错误
    console.warn('[Platform] @tauri-apps/plugin-os 调用失败，使用 User Agent 检测:', error);
    return detectPlatformFromUserAgent();
  }
}

/**
 * 将 Tauri 的 Platform 类型映射到我们的 Platform 类型
 */
function mapTauriPlatformToOurPlatform(detectedPlatform: string): Platform {
  // Tauri: 'linux' | 'macos' | 'ios' | 'freebsd' | 'dragonfly' | 'netbsd' | 'openbsd' | 'solaris' | 'android' | 'windows'
  // 我们的: 'android' | 'ios' | 'macOS' | 'windows' | 'linux'
  const platformMap: Record<string, Platform> = {
    android: 'android',
    ios: 'ios',
    macos: 'macOS',
    windows: 'windows',
    linux: 'linux',
  };

  const mappedPlatform = platformMap[detectedPlatform.toLowerCase()];
  return mappedPlatform || detectPlatformFromUserAgent();
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
