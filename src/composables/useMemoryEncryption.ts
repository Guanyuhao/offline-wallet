/**
 * 内存加密存储
 *
 * 使用 Web Crypto API 在内存中加密存储助记词
 * 增加从内存转储中提取助记词的难度
 */

// 内存中加密的助记词（Base64 编码的加密数据）
let encryptedMnemonic: string | null = null;
let encryptionKey: CryptoKey | null = null;
let encryptedPassphrase: string | null = null;

/**
 * 生成加密密钥（使用随机密钥）
 */
async function generateEncryptionKey(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
  return key;
}

/**
 * 加密并存储助记词到内存
 */
export async function encryptAndStoreMnemonic(
  mnemonic: string,
  passphrase: string = ''
): Promise<void> {
  try {
    // 生成新的加密密钥
    encryptionKey = await generateEncryptionKey();

    // 加密助记词
    const mnemonicBytes = new TextEncoder().encode(mnemonic);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // GCM 需要 12 字节 IV

    const encryptedMnemonicData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      encryptionKey,
      mnemonicBytes
    );

    // 将 IV 和加密数据组合并编码为 Base64
    const combined = new Uint8Array(iv.length + encryptedMnemonicData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedMnemonicData), iv.length);
    encryptedMnemonic = btoa(String.fromCharCode(...combined));

    // 加密 passphrase（如果有）
    if (passphrase) {
      const passphraseBytes = new TextEncoder().encode(passphrase);
      const passphraseIv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedPassphraseData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: passphraseIv,
        },
        encryptionKey,
        passphraseBytes
      );
      const passphraseCombined = new Uint8Array(
        passphraseIv.length + encryptedPassphraseData.byteLength
      );
      passphraseCombined.set(passphraseIv, 0);
      passphraseCombined.set(new Uint8Array(encryptedPassphraseData), passphraseIv.length);
      encryptedPassphrase = btoa(String.fromCharCode(...passphraseCombined));
    } else {
      encryptedPassphrase = null;
    }
  } catch (error) {
    console.error('Failed to encrypt mnemonic in memory:', error);
    throw new Error('Failed to encrypt mnemonic in memory');
  }
}

/**
 * 从内存解密并获取助记词
 */
export async function decryptAndGetMnemonic(): Promise<{ mnemonic: string; passphrase: string }> {
  if (!encryptedMnemonic || !encryptionKey) {
    throw new Error('No encrypted mnemonic in memory');
  }

  try {
    // 解码 Base64
    const combined = Uint8Array.from(atob(encryptedMnemonic), (c) => c.charCodeAt(0));

    // 提取 IV 和加密数据
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // 解密助记词
    const decryptedBytes = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      encryptionKey,
      encryptedData
    );

    const mnemonic = new TextDecoder().decode(decryptedBytes);

    // 解密 passphrase（如果有）
    let passphrase = '';
    if (encryptedPassphrase) {
      const passphraseCombined = Uint8Array.from(atob(encryptedPassphrase), (c) => c.charCodeAt(0));
      const passphraseIv = passphraseCombined.slice(0, 12);
      const encryptedPassphraseData = passphraseCombined.slice(12);

      const decryptedPassphraseBytes = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: passphraseIv,
        },
        encryptionKey,
        encryptedPassphraseData
      );

      passphrase = new TextDecoder().decode(decryptedPassphraseBytes);
    }

    return { mnemonic, passphrase };
  } catch (error) {
    console.error('Failed to decrypt mnemonic from memory:', error);
    throw new Error('Failed to decrypt mnemonic from memory');
  }
}

/**
 * 清除内存中的加密数据
 */
export function clearEncryptedMnemonic(): void {
  encryptedMnemonic = null;
  encryptedPassphrase = null;
  encryptionKey = null;
}

/**
 * 检查内存中是否有加密的助记词
 */
export function hasEncryptedMnemonicInMemory(): boolean {
  return encryptedMnemonic !== null && encryptionKey !== null;
}
