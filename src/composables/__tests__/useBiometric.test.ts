import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Tauri biometric plugin before imports
const mockCheckStatus = vi.fn();
const mockAuthenticate = vi.fn();

vi.mock('@tauri-apps/plugin-biometric', () => ({
  default: {
    checkStatus: mockCheckStatus,
    authenticate: mockAuthenticate,
  },
  checkStatus: mockCheckStatus,
  authenticate: mockAuthenticate,
}));

// Mock useWalletStorage
const mockGetBiometricPassword = vi.fn();
const mockRetrieveEncryptedMnemonic = vi.fn();

vi.mock('../useWalletStorage', async () => {
  const actual = await vi.importActual('../useWalletStorage');
  return {
    ...actual,
    getBiometricPassword: mockGetBiometricPassword,
    retrieveEncryptedMnemonic: mockRetrieveEncryptedMnemonic,
  };
});

import {
  isBiometricAvailable,
  getBiometricType,
  authenticateBiometric,
  isBiometricEnrolled,
  unlockWithBiometric,
} from '../useBiometric';

describe('useBiometric', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckStatus.mockReset();
    mockAuthenticate.mockReset();
    mockGetBiometricPassword.mockReset();
    mockRetrieveEncryptedMnemonic.mockReset();
    // 重置 window 对象
    delete (globalThis as any).window;
    globalThis.window = globalThis as any;
  });

  describe('isBiometricAvailable', () => {
    it('在没有 window 对象时应该返回 false', async () => {
      const originalWindow = globalThis.window;
      delete (globalThis as any).window;

      const result = await isBiometricAvailable();
      expect(result).toBe(false);

      globalThis.window = originalWindow;
    });

    it('在插件不可用时应该返回 false', async () => {
      mockCheckStatus.mockRejectedValueOnce(new Error('Plugin not available'));

      const result = await isBiometricAvailable();
      expect(result).toBe(false);
    });

    it('在插件可用且支持生物识别时应该返回 true', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: true,
      } as any);

      const result = await isBiometricAvailable();
      expect(result).toBe(true);
    });

    it('在插件可用但不支持生物识别时应该返回 false', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: false,
      } as any);

      const result = await isBiometricAvailable();
      expect(result).toBe(false);
    });

    it('应该处理 checkStatus 方法不存在的情况', async () => {
      // 临时移除 checkStatus
      const originalCheckStatus = mockCheckStatus;
      mockCheckStatus.mockImplementation(() => {
        throw new Error('checkStatus does not exist');
      });

      const result = await isBiometricAvailable();
      expect(result).toBe(false);

      // 恢复
      mockCheckStatus.mockImplementation(originalCheckStatus);
    });
  });

  describe('getBiometricType', () => {
    it('在生物识别不可用时应该返回 null', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: false,
      } as any);

      const result = await getBiometricType();
      expect(result).toBeNull();
    });

    it('在生物识别可用时应该返回类型', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: true,
      } as any);

      const result = await getBiometricType();
      expect(result).toBe('biometric');
    });

    it('应该处理错误情况', async () => {
      mockCheckStatus.mockRejectedValueOnce(new Error('Test error'));

      const result = await getBiometricType();
      expect(result).toBeNull();
    });
  });

  describe('authenticateBiometric', () => {
    it('在设备不支持生物识别时应该抛出错误', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: false,
      } as any);

      await expect(authenticateBiometric()).rejects.toThrow('设备不支持生物识别');
    });

    it('在认证成功时应该返回 true', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: true,
      } as any);
      mockAuthenticate.mockResolvedValueOnce(undefined);

      const result = await authenticateBiometric('Test reason');
      expect(result).toBe(true);
      expect(mockAuthenticate).toHaveBeenCalledWith('Test reason', {
        fallbackTitle: '使用密码',
        cancelTitle: '取消',
      });
    });

    it('在用户取消时应该返回 false', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: true,
      } as any);
      mockAuthenticate.mockRejectedValueOnce({
        message: 'User cancel',
      });

      const result = await authenticateBiometric();
      expect(result).toBe(false);
    });

    it('在认证失败时应该抛出错误', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: true,
      } as any);
      mockAuthenticate.mockRejectedValueOnce({
        message: 'Authentication failed',
      });

      await expect(authenticateBiometric()).rejects.toBeDefined();
    });

    it('应该使用默认的认证原因', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: true,
      } as any);
      mockAuthenticate.mockResolvedValueOnce(undefined);

      await authenticateBiometric();

      expect(mockAuthenticate).toHaveBeenCalledWith(
        'Please authenticate with biometric to unlock wallet',
        expect.any(Object)
      );
    });
  });

  describe('isBiometricEnrolled', () => {
    it('应该返回生物识别是否可用', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: true,
      } as any);

      const result = await isBiometricEnrolled();
      expect(result).toBe(true);
    });

    it('在错误时应该返回 false', async () => {
      mockCheckStatus.mockRejectedValueOnce(new Error('Test error'));

      const result = await isBiometricEnrolled();
      expect(result).toBe(false);
    });
  });

  describe('unlockWithBiometric', () => {
    it('在设备不支持生物识别时应该返回 null', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: false,
      } as any);

      const result = await unlockWithBiometric();
      expect(result).toBeNull();
    });

    it('在认证失败时应该返回 null', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: true,
      } as any);
      mockAuthenticate.mockRejectedValueOnce({
        message: 'User cancel',
      });

      const result = await unlockWithBiometric();
      expect(result).toBeNull();
    });

    it('在成功认证后应该返回助记词', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: true,
      } as any);
      mockAuthenticate.mockResolvedValueOnce(undefined);

      mockGetBiometricPassword.mockResolvedValueOnce('stored-password');
      mockRetrieveEncryptedMnemonic.mockResolvedValueOnce('test mnemonic');

      const result = await unlockWithBiometric();
      expect(result).toBe('test mnemonic');
      expect(mockGetBiometricPassword).toHaveBeenCalled();
      expect(mockRetrieveEncryptedMnemonic).toHaveBeenCalledWith('stored-password');
    });

    it('应该处理获取密码失败的情况', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: true,
      } as any);
      mockAuthenticate.mockResolvedValueOnce(undefined);

      mockGetBiometricPassword.mockRejectedValueOnce(new Error('Failed to get password'));

      const result = await unlockWithBiometric();
      expect(result).toBeNull();
    });

    it('应该处理解密失败的情况', async () => {
      mockCheckStatus.mockResolvedValueOnce({
        isAvailable: true,
      } as any);
      mockAuthenticate.mockResolvedValueOnce(undefined);

      mockGetBiometricPassword.mockResolvedValueOnce('stored-password');
      mockRetrieveEncryptedMnemonic.mockRejectedValueOnce(new Error('Decryption failed'));

      const result = await unlockWithBiometric();
      expect(result).toBeNull();
    });
  });
});
