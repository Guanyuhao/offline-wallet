/**
 * Stronghold 安全存储工具函数
 *
 * 使用 @tauri-apps/plugin-stronghold 进行跨平台安全存储
 * - 支持所有平台：macOS、Windows、Linux、iOS、Android
 * - 使用 Argon2id 密码哈希（通过插件初始化）
 * - 直接使用用户密码，由 Stronghold 的 Argon2id 提供安全保护
 *
 * 安全机制：
 * 1. 用户密码（明文）→ Stronghold
 * 2. Stronghold：用户密码 + salt.txt → Argon2id 哈希 → 加密密钥
 * 3. Argon2id 提供抗暴力破解保护，安全性足够
 */

import { Client, Stronghold } from '@tauri-apps/plugin-stronghold';
import { appDataDir } from '@tauri-apps/api/path';

// ==================== 配置常量 ====================

/** Cold Wallet 的隔离配置（与 Rust 后端保持一致） */
const CLIENT_NAME = 'cold-wallet';
const MNEMONIC_STORE_KEY = 'mnemonic';
const VAULT_FILE_NAME = 'vaultColdWallet.hold';

// ==================== 自定义错误类型 ====================

/**
 * Stronghold 操作错误基类
 */
export class StrongholdError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'StrongholdError';
  }
}

/**
 * Vault 加载错误
 */
export class VaultLoadError extends StrongholdError {
  constructor(
    message: string,
    cause?: unknown,
    public readonly isPasswordError = false
  ) {
    super(message, 'VAULT_LOAD_ERROR', cause);
    this.name = 'VaultLoadError';
  }
}

/**
 * Vault 保存错误
 */
export class VaultSaveError extends StrongholdError {
  constructor(message: string, cause?: unknown) {
    super(message, 'VAULT_SAVE_ERROR', cause);
    this.name = 'VaultSaveError';
  }
}

/**
 * 助记词不存在错误
 */
export class MnemonicNotFoundError extends StrongholdError {
  constructor() {
    super('助记词不存在', 'MNEMONIC_NOT_FOUND');
    this.name = 'MnemonicNotFoundError';
  }
}

/**
 * Client 操作错误
 */
export class ClientError extends StrongholdError {
  constructor(message: string, cause?: unknown) {
    super(message, 'CLIENT_ERROR', cause);
    this.name = 'ClientError';
  }
}

// ==================== 工具函数 ====================

/**
 * 获取 vault 文件路径
 */
async function getVaultPath(): Promise<string> {
  const appDir = await appDataDir();
  const normalizedDir = appDir.endsWith('/') ? appDir : `${appDir}/`;
  return `${normalizedDir}${VAULT_FILE_NAME}`;
}

/**
 * 检查 vault 文件是否存在
 */
async function vaultExists(): Promise<boolean> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<boolean>('has_encrypted_mnemonic');
  } catch {
    return false;
  }
}

/**
 * 安全清理 Stronghold 实例
 */
async function safeUnload(stronghold: Stronghold | null): Promise<void> {
  if (!stronghold) return;

  try {
    await stronghold.unload();
  } catch {
    // 忽略卸载错误（可能已经卸载）
  }
}

// ==================== 核心函数 ====================

/**
 * Stronghold 实例和 Client 的包装
 */
interface StrongholdInstance {
  stronghold: Stronghold;
  client: Client;
}

/**
 * 初始化 Stronghold 实例
 *
 * @param password 用户密码（用于加密/解密 vault）
 * @returns Stronghold 实例和 Client 实例
 * @throws {VaultLoadError} 当 vault 加载失败时
 * @throws {ClientError} 当 client 创建失败时
 */
async function initStronghold(password: string): Promise<StrongholdInstance> {
  const vaultPath = await getVaultPath();
  const exists = await vaultExists();

  let stronghold: Stronghold;

  try {
    // 加载或创建 Stronghold 实例
    stronghold = await Stronghold.load(vaultPath, password);
  } catch (error) {
    // 判断错误类型
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = String(error);

    // 检测 BadFileKey 错误（密钥不匹配）
    const isBadFileKey = errorString.includes('BadFileKey') || errorMessage.includes('BadFileKey');

    // 检测密码错误
    const isPasswordError =
      exists &&
      (errorMessage.includes('password') ||
        errorMessage.includes('密码') ||
        errorMessage.includes('incorrect') ||
        isBadFileKey);

    // 如果是 BadFileKey 错误，提供更详细的提示
    if (isBadFileKey && exists) {
      throw new VaultLoadError(
        '无法解密 vault，密钥不匹配。可能的原因：\n' + '1. 密码错误\n' + '2. Vault 文件损坏',
        error,
        true // 标记为密码错误
      );
    }

    throw new VaultLoadError(
      exists
        ? `无法加载 vault。${isPasswordError ? '密码错误或密钥不匹配。' : '文件可能已损坏。'}`
        : '无法初始化 Stronghold',
      error,
      isPasswordError
    );
  }

  // 获取或创建 client
  let client: Client;
  try {
    client = await stronghold.loadClient(CLIENT_NAME);
  } catch {
    // 如果 client 不存在，创建新的
    try {
      client = await stronghold.createClient(CLIENT_NAME);
    } catch (createError) {
      await safeUnload(stronghold);
      throw new ClientError('无法创建 Stronghold client', createError);
    }
  }

  return { stronghold, client };
}

/**
 * 将字符串转换为字节数组
 */
function stringToBytes(str: string): number[] {
  return Array.from(new TextEncoder().encode(str));
}

/**
 * 将字节数组转换为字符串
 */
function bytesToString(bytes: number[] | Uint8Array): string {
  const uint8Array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return new TextDecoder().decode(uint8Array);
}

// ==================== 公共 API ====================

/**
 * 存储加密的助记词到 Stronghold
 *
 * @param mnemonic 要加密的助记词
 * @param password 用户密码（用于加密 vault）
 * @throws {VaultLoadError} 当 vault 初始化失败时
 * @throws {VaultSaveError} 当 vault 保存失败时
 */
export async function storeMnemonic(mnemonic: string, password: string): Promise<void> {
  if (!mnemonic || !mnemonic.trim()) {
    throw new StrongholdError('助记词不能为空', 'INVALID_INPUT');
  }

  if (!password || password.length === 0) {
    throw new StrongholdError('密码不能为空', 'INVALID_INPUT');
  }

  let instance: StrongholdInstance | null = null;

  try {
    // 初始化 Stronghold
    instance = await initStronghold(password);
    const { stronghold, client } = instance;

    // 存储助记词
    const store = client.getStore();
    const mnemonicBytes = stringToBytes(mnemonic.trim());
    await store.insert(MNEMONIC_STORE_KEY, mnemonicBytes);

    // 保存 vault
    try {
      await stronghold.save();
    } catch (error) {
      // 如果保存失败，尝试删除可能不完整的 vault 文件
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('delete_encrypted_mnemonic').catch(() => {});
      } catch {
        // 忽略清理错误
      }

      throw new VaultSaveError('保存 vault 失败，请重试', error);
    }
  } catch (error) {
    // 确保清理资源
    if (instance) {
      await safeUnload(instance.stronghold);
    }

    // 重新抛出错误（如果已经是 StrongholdError，直接抛出）
    if (error instanceof StrongholdError) {
      throw error;
    }

    // 包装未知错误
    throw new StrongholdError('存储助记词失败', 'UNKNOWN_ERROR', error);
  }
}

/**
 * 从 Stronghold 读取并解密助记词
 *
 * @param password 用户密码（用于解密 vault）
 * @returns 解密后的助记词
 * @throws {VaultLoadError} 当 vault 加载失败或密码错误时
 * @throws {MnemonicNotFoundError} 当助记词不存在时
 */
export async function retrieveMnemonic(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new StrongholdError('密码不能为空', 'INVALID_INPUT');
  }

  let instance: StrongholdInstance | null = null;

  try {
    // 初始化 Stronghold
    instance = await initStronghold(password);
    const { stronghold, client } = instance;

    // 读取助记词
    const store = client.getStore();
    const data = await store.get(MNEMONIC_STORE_KEY);

    if (!data || data.length === 0) {
      throw new MnemonicNotFoundError();
    }

    return bytesToString(data);
  } catch (error) {
    // 确保清理资源
    if (instance) {
      await safeUnload(instance.stronghold);
    }

    // 重新抛出错误（如果已经是 StrongholdError，直接抛出）
    if (error instanceof StrongholdError) {
      throw error;
    }

    // 包装未知错误
    throw new StrongholdError('读取助记词失败', 'UNKNOWN_ERROR', error);
  }
}

/**
 * 检查是否存在加密的助记词
 *
 * @returns 如果存在返回 true，否则返回 false
 */
export async function hasMnemonic(): Promise<boolean> {
  try {
    return await vaultExists();
  } catch {
    return false;
  }
}

/**
 * 删除加密的助记词
 *
 * @throws {StrongholdError} 当删除失败时
 */
export async function deleteMnemonic(): Promise<void> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('delete_encrypted_mnemonic');
  } catch (error) {
    throw new StrongholdError('删除助记词失败', 'DELETE_ERROR', error);
  }
}
