/**
 * @Author liyongjie
 * 生物识别工具函数
 * 提供统一的生物识别（指纹/面容ID）接口
 */

import { authenticate, checkStatus } from '@tauri-apps/plugin-biometric';

/**
 * 生物识别状态
 */
export interface BiometricStatusResult {
  /** 是否可用 */
  isAvailable: boolean;
  /** 生物识别类型 */
  biometryType?: 'touchId' | 'faceId' | 'iris' | null;
  /** 错误信息 */
  error?: string;
}

/**
 * 检查生物识别是否可用
 */
export async function isBiometricAvailable(): Promise<BiometricStatusResult> {
  try {
    const status = await checkStatus();
    return {
      isAvailable: status.isAvailable,
      biometryType: status.biometryType as unknown as BiometricStatusResult['biometryType'],
    };
  } catch (error) {
    console.error('检查生物识别状态失败:', error);
    return {
      isAvailable: false,
      error: String(error),
    };
  }
}

/**
 * 执行生物识别验证
 * @param reason 验证原因（显示给用户的提示）
 * @returns 验证是否成功
 */
export async function authenticateWithBiometric(reason: string): Promise<boolean> {
  try {
    await authenticate(reason, {
      // 允许使用设备凭据（PIN/密码）作为备选
      allowDeviceCredential: true,
      // iOS 取消按钮文本
      cancelTitle: '取消',
      // iOS 备选按钮文本（如"使用密码"）
      fallbackTitle: '使用密码',
    });
    return true;
  } catch (error) {
    console.error('生物识别验证失败:', error);
    return false;
  }
}

/**
 * 获取生物识别类型的显示名称
 */
export function getBiometricTypeName(biometryType?: 'touchId' | 'faceId' | 'iris' | null): string {
  switch (biometryType) {
    case 'faceId':
      return 'Face ID';
    case 'touchId':
      return '指纹识别';
    case 'iris':
      return '虹膜识别';
    default:
      return '生物识别';
  }
}
