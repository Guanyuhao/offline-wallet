/**
 * 钱包存储管理
 *
 * 安全策略：
 * 1. 助记词加密存储在系统级安全存储（Keychain/Keystore）
 * 2. 前端不存储任何敏感信息（助记词、密码等）
 * 3. 地址信息仅在存在加密助记词时存储到 localStorage（因为地址是从助记词派生的，没有助记词就没有意义）
 * 4. 如果没有加密助记词，地址缓存会被清除，用户需要重新导入助记词
 */

import { invoke } from '@tauri-apps/api/core';
import { useWalletStore, type Address } from '../stores/wallet';

const WALLET_STORAGE_KEY = 'offline_wallet_data';
const WALLET_EXISTS_KEY = 'offline_wallet_exists';

export interface StoredWalletData {
  addresses: Address[];
  selectedChain: string;
  lastActivity: number;
  version: string; // 用于未来版本迁移
}

/**
 * 检查钱包是否存在
 */
export function hasStoredWallet(): boolean {
  try {
    const exists = localStorage.getItem(WALLET_EXISTS_KEY);
    return exists === 'true';
  } catch (error) {
    console.error('Failed to check wallet existence:', error);
    return false;
  }
}

/**
 * 保存钱包数据（仅地址信息）
 */
export function saveWalletData(data: StoredWalletData): void {
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(WALLET_EXISTS_KEY, 'true');
  } catch (error) {
    console.error('Failed to save wallet data:', error);
    throw new Error('Failed to save wallet data');
  }
}

/**
 * 加载钱包数据（仅地址信息）
 */
export function loadWalletData(): StoredWalletData | null {
  try {
    const data = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as StoredWalletData;
  } catch (error) {
    console.error('Failed to load wallet data:', error);
    return null;
  }
}

/**
 * 清除钱包数据
 */
export function clearWalletData(): void {
  try {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(WALLET_EXISTS_KEY);
  } catch (error) {
    console.error('Failed to clear wallet data:', error);
  }
}

/**
 * 初始化钱包存储
 * 从存储中恢复地址信息到 store
 */
export function initializeWalletFromStorage(): boolean {
  const walletStore = useWalletStore();
  const storedData = loadWalletData();

  if (!storedData || !storedData.addresses || storedData.addresses.length === 0) {
    return false;
  }

  try {
    // 恢复地址信息
    // 使用响应式的方式更新
    walletStore.addresses.length = 0;
    walletStore.addresses.push(...storedData.addresses);
    walletStore.selectedChain = storedData.selectedChain as any;
    walletStore.lastActivity = storedData.lastActivity;

    // 注意：助记词不在存储中，需要用户重新输入或导入
    // 但地址信息可以显示，用户可以选择重新导入助记词来解锁完整功能
    // 钱包处于锁定状态，直到用户重新导入助记词

    return walletStore.addresses.length > 0;
  } catch (error) {
    console.error('Failed to initialize wallet from storage:', error);
    return false;
  }
}

/**
 * 同步钱包数据到存储
 * 只有在存在加密助记词（系统级存储）的情况下才保存地址
 * 因为地址是从助记词派生的，没有助记词就没有意义
 */
export async function syncWalletToStorage(): Promise<void> {
  const walletStore = useWalletStore();

  if (!walletStore.isWalletCreated) {
    clearWalletData();
    return;
  }

  // 检查是否存在加密的助记词（系统级存储）
  // 只有在有加密助记词的情况下才保存地址
  const hasEncrypted = await hasEncryptedMnemonic();
  if (!hasEncrypted) {
    // 没有加密助记词，清除地址缓存
    clearWalletData();
    return;
  }

  const data: StoredWalletData = {
    addresses: walletStore.addresses,
    selectedChain: walletStore.selectedChain,
    lastActivity: walletStore.lastActivity,
    version: '1.0.0',
  };

  saveWalletData(data);
}

/**
 * 检查是否存在加密的助记词（系统级存储）
 */
export async function hasEncryptedMnemonic(): Promise<boolean> {
  try {
    return await invoke<boolean>('has_encrypted_mnemonic');
  } catch {
    return false;
  }
}

/**
 * 加密并存储助记词到系统级安全存储
 */
export async function storeEncryptedMnemonic(mnemonic: string, password: string): Promise<void> {
  try {
    await invoke('store_encrypted_mnemonic', {
      mnemonic,
      password,
    });
  } catch (error: any) {
    console.error('Failed to store encrypted mnemonic:', error);
    throw new Error(error || '存储失败，请重试');
  }
}

/**
 * 从系统级安全存储读取并解密助记词
 */
export async function retrieveEncryptedMnemonic(password: string): Promise<string> {
  try {
    return await invoke<string>('retrieve_encrypted_mnemonic', {
      password,
    });
  } catch (error: any) {
    console.error('Failed to retrieve mnemonic:', error);
    throw new Error(error || '密码错误或解密失败');
  }
}

/**
 * 验证密码（不返回助记词）
 */
export async function verifyMnemonicPassword(password: string): Promise<boolean> {
  try {
    return await invoke<boolean>('verify_mnemonic_password', {
      password,
    });
  } catch {
    return false;
  }
}

/**
 * 删除加密的助记词（从系统级存储）
 */
export async function deleteEncryptedMnemonic(): Promise<void> {
  try {
    await invoke('delete_encrypted_mnemonic');
  } catch (error) {
    console.error('Failed to delete encrypted mnemonic:', error);
    throw error;
  }
}

/**
 * 清除所有钱包数据（包括系统级存储的加密助记词）
 */
export async function clearAllWalletData(): Promise<void> {
  clearWalletData();
  try {
    await deleteEncryptedMnemonic();
    await deleteBiometricPassword();
  } catch {
    // 忽略删除错误，可能不存在
  }
}

// ==================== 生物识别相关 ====================

/**
 * 存储生物识别密码（加密后的密码）
 */
export async function storeBiometricPassword(encryptedPassword: string): Promise<void> {
  try {
    await invoke('store_biometric_password', {
      encryptedPassword,
    });
  } catch (error: any) {
    console.error('Failed to store biometric password:', error);
    throw new Error(error || '存储生物识别密码失败');
  }
}

/**
 * 获取生物识别密码（用于生物识别成功后自动解锁）
 */
export async function getBiometricPassword(): Promise<string> {
  try {
    return await invoke<string>('get_biometric_password');
  } catch (error: any) {
    console.error('Failed to get biometric password:', error);
    throw new Error(error || '获取生物识别密码失败');
  }
}

/**
 * 删除生物识别密码
 */
export async function deleteBiometricPassword(): Promise<void> {
  try {
    await invoke('delete_biometric_password');
  } catch (error) {
    console.error('Failed to delete biometric password:', error);
    throw error;
  }
}

/**
 * 检查是否存在生物识别密码
 */
export async function hasBiometricPassword(): Promise<boolean> {
  try {
    return await invoke<boolean>('has_biometric_password');
  } catch {
    return false;
  }
}
