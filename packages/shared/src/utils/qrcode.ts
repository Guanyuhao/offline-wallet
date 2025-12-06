/**
 * @Author liyongjie
 * 二维码相关工具函数
 */

/**
 * 生成地址二维码数据
 * 收款二维码只包含地址信息，不包含其他元数据
 * Kaspa 地址使用标准格式：kaspa:xxxxx（保持原格式，不转换）
 */
export function createAddressQRCode(address: string): string {
  // 直接返回地址字符串，保持原始格式
  // Kaspa 地址格式：kaspa:xxxxx（这是标准格式，二维码中应保持此格式）
  return address;
}

/**
 * 格式化地址显示（中间省略）
 */
export function formatAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address || address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
