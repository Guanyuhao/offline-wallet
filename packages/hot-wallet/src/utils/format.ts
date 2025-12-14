/**
 * 格式化余额，最多保留6位小数，末尾截断（不四舍五入），带千分位
 * 返回 { int: 整数部分, dec: 小数部分 } 用于不同字体大小显示
 */
export function formatBalanceParts(balance?: string | null): { int: string; dec: string } {
  if (!balance || balance === '0') return { int: '0', dec: '' };
  const num = parseFloat(balance);
  if (isNaN(num)) return { int: '0', dec: '' };
  // 截断到6位小数
  const truncated = Math.floor(num * 1000000) / 1000000;
  const [intPart, decPart] = truncated.toString().split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return { int: formattedInt, dec: decPart || '' };
}

/**
 * 格式化余额为字符串（用于列表等简单场景）
 */
export function formatBalance(balance?: string | null): string {
  const { int, dec } = formatBalanceParts(balance);
  return dec ? `${int}.${dec}` : int;
}
