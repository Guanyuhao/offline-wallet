/**
 * @Author liyongjie
 * 扫描器模块导出
 */

export * from './types';
export * from './web-scanner';
export * from './native-scanner';
export * from './factory';
// 平台检测工具已移动到 utils/platform.ts，这里重新导出以保持向后兼容
export * from '../platform';
