/**
 * @Author liyongjie
 * 扫描器类型定义
 */

/**
 * 平台类型
 */
export type Platform = 'android' | 'ios' | 'macOS' | 'windows' | 'linux';

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
