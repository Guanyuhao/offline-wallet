/**
 * 密码强度检测
 */

import { invoke } from '@tauri-apps/api/core';

export interface PasswordStrengthResult {
  strength: string;
  score: number;
  crack_time_seconds: number;
  feedback: string[];
  is_sufficient: boolean;
}

/**
 * 检测密码强度
 */
export async function checkPasswordStrength(password: string): Promise<PasswordStrengthResult> {
  try {
    return await invoke<PasswordStrengthResult>('check_password_strength_cmd', {
      password,
    });
  } catch (error) {
    console.error('Failed to check password strength:', error);
    throw error;
  }
}

/**
 * 验证密码强度是否符合要求
 */
export async function validatePasswordStrength(password: string): Promise<boolean> {
  try {
    await invoke('validate_password_strength_cmd', {
      password,
    });
    return true;
  } catch {
    return false;
  }
}
