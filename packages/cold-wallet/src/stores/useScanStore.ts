/**
 * @Author liyongjie
 * 二维码扫描状态管理 Store
 * 用于管理扫描页面的状态和结果
 */

import { create } from 'zustand';

/**
 * 扫描类型
 */
export enum ScanType {
  /**
   * 扫描地址
   */
  ADDRESS = 'address',
  /**
   * 扫描未签名交易
   */
  UNSIGNED_TRANSACTION = 'unsigned_transaction',
}

/**
 * 扫描状态
 */
interface ScanState {
  /**
   * 扫描类型
   */
  scanType: ScanType | null;
  /**
   * 扫描结果
   */
  scanResult: string | null;
  /**
   * 扫描是否成功
   */
  scanSuccess: boolean;
  /**
   * 扫描提示文本
   */
  hint: string;
  /**
   * 返回路径
   */
  returnPath: string;
  /**
   * 返回时需要恢复的 tab 模式（用于 SignTransactionPage）
   */
  returnMode: 'scan' | 'manual' | null;

  // Actions
  /**
   * 设置扫描配置（跳转到扫描页面时调用）
   */
  setScanConfig: (config: {
    scanType: ScanType;
    hint?: string;
    returnPath: string;
    returnMode?: 'scan' | 'manual';
  }) => void;
  /**
   * 设置扫描结果（扫描成功时调用）
   */
  setScanResult: (result: string) => void;
  /**
   * 清除扫描状态（返回页面后调用）
   */
  clearScanState: () => void;
  /**
   * 重置所有状态
   */
  reset: () => void;
}

const useScanStore = create<ScanState>((set) => ({
  scanType: null,
  scanResult: null,
  scanSuccess: false,
  hint: '请将二维码对准扫描框',
  returnPath: '/wallet',
  returnMode: null,

  setScanConfig: (config) =>
    set({
      scanType: config.scanType,
      hint: config.hint || '请将二维码对准扫描框',
      returnPath: config.returnPath,
      returnMode: config.returnMode || null,
      scanResult: null,
      scanSuccess: false,
    }),

  setScanResult: (result) =>
    set({
      scanResult: result,
      scanSuccess: true,
    }),

  clearScanState: () =>
    set({
      scanResult: null,
      scanSuccess: false,
    }),

  reset: () =>
    set({
      scanType: null,
      scanResult: null,
      scanSuccess: false,
      hint: '请将二维码对准扫描框',
      returnPath: '/wallet',
      returnMode: null,
    }),
}));

export default useScanStore;
