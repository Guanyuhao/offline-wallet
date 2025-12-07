/**
 * @Author liyongjie
 * 扫描器类型定义
 */

// 平台类型已移动到 utils/platform.ts，这里重新导出以保持向后兼容
export type { Platform } from '../platform';

/**
 * 扫描器接口
 */
export interface IScanner {
  /**
   * 检查权限
   */
  checkPermission(): Promise<boolean>;

  /**
   * 请求权限
   */
  requestPermission(): Promise<boolean>;

  /**
   * 开始扫描
   */
  scan(options?: ScanOptions): Promise<string>;

  /**
   * 取消扫描
   */
  cancel?(): Promise<void>;
}

/**
 * 扫描选项
 */
export interface ScanOptions {
  videoElement?: HTMLVideoElement;
  canvasElement?: HTMLCanvasElement;
}
