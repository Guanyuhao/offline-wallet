/**
 * 工具函数集合
 */

import { QRCodeProtocol, QRCodeType, AddressQRCode } from '@shared/types/qrcode';

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
 * 生成地址二维码数据
 */
export function createAddressQRCode(chain: string, address: string, label?: string): string {
  const data: AddressQRCode = {
    type: QRCodeType.ADDRESS,
    version: '1.0.0',
    timestamp: Date.now(),
    chain: chain as any,
    address,
    label,
  };
  return QRCodeProtocol.encode(data);
}
