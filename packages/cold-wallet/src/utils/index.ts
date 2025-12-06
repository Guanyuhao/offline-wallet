/**
 * 工具函数集合
 */

/**
 * 格式化地址显示（中间省略）
 */
export function formatAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address || address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
}

/**
 * 从剪贴板读取文本
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error('读取剪贴板失败:', error);
    return null;
  }
}

// 注意：createAddressQRCode, loadBarcodeScanner, ensureCameraPermission, scanQRCode
// 已迁移到 @offline-wallet/shared/utils
// 请从 shared 包导入：
// import { createAddressQRCode, loadBarcodeScanner, ensureCameraPermission, scanQRCode } from '@offline-wallet/shared/utils';
