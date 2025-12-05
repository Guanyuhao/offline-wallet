/**
 * 路径配置
 * 统一管理项目中的路径别名和导入路径
 */

/**
 * Shared 模块路径配置
 *
 * 使用示例：
 * ```typescript
 * import { QRCodeProtocol } from '@shared/types/qrcode';
 * import { someUtil } from '@shared/utils';
 * ```
 */
export const SHARED_PATHS = {
  /**
   * Shared 类型定义路径
   * @example import { QRCodeProtocol } from '@shared/types/qrcode';
   */
  types: '@shared/types',

  /**
   * Shared 工具函数路径
   * @example import { someUtil } from '@shared/utils';
   */
  utils: '@shared/utils',

  /**
   * Shared 组件路径
   * @example import { SomeComponent } from '@shared/components';
   */
  components: '@shared/components',
} as const;

/**
 * 获取 shared 模块的完整导入路径
 * @param module - 模块名称
 * @returns 完整的导入路径
 *
 * @example
 * ```typescript
 * const typesPath = getSharedPath('types'); // '@shared/types'
 * ```
 */
export function getSharedPath(module: keyof typeof SHARED_PATHS): string {
  return SHARED_PATHS[module];
}
