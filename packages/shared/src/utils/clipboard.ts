/**
 * @Author liyongjie
 * 剪贴板工具函数
 * 统一使用 Tauri 插件，支持桌面端和移动端
 */

import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager';

/**
 * 复制到剪贴板（使用 Tauri 插件）
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await writeText(text);
    return true;
  } catch (error) {
    console.error('Tauri clipboard write failed, trying fallback:', error);
    // Fallback to navigator.clipboard for web
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (fallbackError) {
      console.error('Fallback clipboard write failed:', fallbackError);
      return false;
    }
  }
}

/**
 * 从剪贴板读取文本（使用 Tauri 插件）
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    const text = await readText();
    return text;
  } catch (error) {
    console.error('Tauri clipboard read failed, trying fallback:', error);
    // Fallback to navigator.clipboard for web
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch (fallbackError) {
      console.error('Fallback clipboard read failed:', fallbackError);
      return null;
    }
  }
}
