import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkPasswordStrength, validatePasswordStrength } from '../usePasswordStrength';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core');

describe('usePasswordStrength', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkPasswordStrength', () => {
    it('应该返回密码强度结果', async () => {
      const mockResult = {
        strength: 'strong',
        score: 4,
        crack_time_seconds: 1000000,
        feedback: ['Good password'],
        is_sufficient: true,
      };

      vi.mocked(invoke).mockResolvedValue(mockResult);

      const result = await checkPasswordStrength('Test123!@#');

      expect(result).toEqual(mockResult);
      expect(invoke).toHaveBeenCalledWith('check_password_strength_cmd', {
        password: 'Test123!@#',
      });
    });

    it('应该在调用失败时抛出错误', async () => {
      const mockError = new Error('Tauri command failed');
      vi.mocked(invoke).mockRejectedValue(mockError);

      await expect(checkPasswordStrength('weak')).rejects.toThrow('Tauri command failed');
      expect(invoke).toHaveBeenCalledWith('check_password_strength_cmd', {
        password: 'weak',
      });
    });

    it('应该处理空密码', async () => {
      const mockResult = {
        strength: 'weak',
        score: 0,
        crack_time_seconds: 0,
        feedback: ['Password is too short'],
        is_sufficient: false,
      };

      vi.mocked(invoke).mockResolvedValue(mockResult);

      const result = await checkPasswordStrength('');

      expect(result.is_sufficient).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('validatePasswordStrength', () => {
    it('应该在密码强度足够时返回 true', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      const result = await validatePasswordStrength('Strong123!@#');

      expect(result).toBe(true);
      expect(invoke).toHaveBeenCalledWith('validate_password_strength_cmd', {
        password: 'Strong123!@#',
      });
    });

    it('应该在密码强度不足时返回 false', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('Password too weak'));

      const result = await validatePasswordStrength('weak');

      expect(result).toBe(false);
    });

    it('应该处理各种错误情况', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('Network error'));

      const result = await validatePasswordStrength('test');

      expect(result).toBe(false);
    });
  });
});
