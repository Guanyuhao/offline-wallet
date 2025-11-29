/**
 * 生物识别认证
 *
 * 支持 Face ID (iOS) 和 Touch ID (iOS/macOS) 以及 Android 生物识别
 */

/**
 * 检查设备是否支持生物识别
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    // 使用 Tauri command 检查生物识别是否可用
    // 注意：在非移动平台上返回 false
    if (typeof window === 'undefined') {
      return false;
    }

    // 尝试调用生物识别 API（如果插件可用）
    try {
      const biometricModule = await import('@tauri-apps/plugin-biometric');
      // 检查是否有 checkStatus 方法
      if (biometricModule.checkStatus) {
        const status = await biometricModule.checkStatus();
        return status.isAvailable;
      }
      return false;
    } catch {
      // 插件不可用（可能是桌面平台）
      return false;
    }
  } catch (error) {
    console.error('Failed to check biometric availability:', error);
    return false;
  }
}

/**
 * 检查生物识别类型
 */
export async function getBiometricType(): Promise<string | null> {
  try {
    const available = await isBiometricAvailable();
    if (!available) {
      return null;
    }

    // 尝试检测类型（iOS/macOS 会返回类型）
    // Android 需要额外检查
    return 'biometric'; // 通用类型
  } catch (error) {
    console.error('Failed to get biometric type:', error);
    return null;
  }
}

/**
 * 执行生物识别认证
 *
 * @param reason 认证原因说明
 * @returns 认证是否成功
 */
export async function authenticateBiometric(
  reason: string = 'Please authenticate with biometric to unlock wallet'
): Promise<boolean> {
  try {
    const biometricModule = await import('@tauri-apps/plugin-biometric');

    const available = await isBiometricAvailable();
    if (!available) {
      throw new Error('设备不支持生物识别');
    }

    await biometricModule.authenticate(reason, {
      fallbackTitle: '使用密码',
      cancelTitle: '取消',
    });

    // authenticate 成功返回 void，失败会抛出异常
    return true;
  } catch (error: any) {
    console.error('Biometric authentication failed:', error);
    // 用户取消不抛出错误
    if (error?.message?.includes('cancel') || error?.message?.includes('Cancel')) {
      return false;
    }
    throw error;
  }
}

/**
 * 检查生物识别是否已注册
 */
export async function isBiometricEnrolled(): Promise<boolean> {
  try {
    return await isBiometricAvailable();
  } catch {
    return false;
  }
}

/**
 * 使用生物识别解锁钱包
 *
 * @returns 解密后的助记词，如果失败返回 null
 */
export async function unlockWithBiometric(): Promise<string | null> {
  try {
    // 1. 检查生物识别是否可用
    const available = await isBiometricAvailable();
    if (!available) {
      throw new Error('设备不支持生物识别');
    }

    // 2. 执行生物识别认证
    const authenticated = await authenticateBiometric(
      'Please authenticate with biometric to unlock wallet'
    );
    if (!authenticated) {
      return null;
    }

    // 3. 生物识别成功，从系统密钥库获取存储的密码
    const { getBiometricPassword, retrieveEncryptedMnemonic } = await import('./useWalletStorage');
    const storedPassword = await getBiometricPassword();

    // 4. 使用密码解密助记词
    const mnemonic = await retrieveEncryptedMnemonic(storedPassword);

    return mnemonic;
  } catch (error: any) {
    console.error('Biometric unlock failed:', error);
    return null;
  }
}
