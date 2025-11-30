import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encryptAndStoreMnemonic,
  decryptAndGetMnemonic,
  clearEncryptedMnemonic,
  hasEncryptedMnemonicInMemory,
} from '../useMemoryEncryption';

describe('useMemoryEncryption', () => {
  beforeEach(() => {
    // 每个测试前清除内存中的加密数据
    clearEncryptedMnemonic();
  });

  describe('encryptAndStoreMnemonic', () => {
    it('应该成功加密并存储助记词', async () => {
      const mnemonic = 'test mnemonic phrase with twelve words here';

      await expect(encryptAndStoreMnemonic(mnemonic)).resolves.not.toThrow();
      expect(hasEncryptedMnemonicInMemory()).toBe(true);
    });

    it('应该成功加密并存储带 passphrase 的助记词', async () => {
      const mnemonic = 'test mnemonic phrase with twelve words here';
      const passphrase = 'my passphrase';

      await expect(encryptAndStoreMnemonic(mnemonic, passphrase)).resolves.not.toThrow();
      expect(hasEncryptedMnemonicInMemory()).toBe(true);
    });

    it('应该处理空 passphrase', async () => {
      const mnemonic = 'test mnemonic phrase with twelve words here';

      await expect(encryptAndStoreMnemonic(mnemonic, '')).resolves.not.toThrow();
      expect(hasEncryptedMnemonicInMemory()).toBe(true);
    });

    it('每次加密应该生成不同的加密数据', async () => {
      const mnemonic = 'test mnemonic phrase with twelve words here';

      await encryptAndStoreMnemonic(mnemonic);
      const firstEncrypted = hasEncryptedMnemonicInMemory();

      await encryptAndStoreMnemonic(mnemonic);
      const secondEncrypted = hasEncryptedMnemonicInMemory();

      // 两次加密都应该成功
      expect(firstEncrypted).toBe(true);
      expect(secondEncrypted).toBe(true);
    });

    it('应该处理很长的助记词', async () => {
      const longMnemonic = 'word '.repeat(50);

      await expect(encryptAndStoreMnemonic(longMnemonic)).resolves.not.toThrow();
      expect(hasEncryptedMnemonicInMemory()).toBe(true);
    });

    it('应该处理特殊字符', async () => {
      const mnemonicWithSpecialChars = 'test mnemonic with special chars: !@#$%^&*()';

      await expect(encryptAndStoreMnemonic(mnemonicWithSpecialChars)).resolves.not.toThrow();
      expect(hasEncryptedMnemonicInMemory()).toBe(true);
    });
  });

  describe('decryptAndGetMnemonic', () => {
    it('应该成功解密并获取助记词', async () => {
      const originalMnemonic = 'test mnemonic phrase with twelve words here';

      await encryptAndStoreMnemonic(originalMnemonic);
      const { mnemonic } = await decryptAndGetMnemonic();

      expect(mnemonic).toBe(originalMnemonic);
      expect(mnemonic.length).toBe(originalMnemonic.length);
    });

    it('应该成功解密并获取带 passphrase 的助记词', async () => {
      const originalMnemonic = 'test mnemonic phrase with twelve words here';
      const originalPassphrase = 'my passphrase';

      await encryptAndStoreMnemonic(originalMnemonic, originalPassphrase);
      const { mnemonic, passphrase } = await decryptAndGetMnemonic();

      expect(mnemonic).toBe(originalMnemonic);
      expect(passphrase).toBe(originalPassphrase);
    });

    it('应该在没有 passphrase 时返回空字符串', async () => {
      const originalMnemonic = 'test mnemonic phrase with twelve words here';

      await encryptAndStoreMnemonic(originalMnemonic);
      const { mnemonic, passphrase } = await decryptAndGetMnemonic();

      expect(mnemonic).toBe(originalMnemonic);
      expect(passphrase).toBe('');
    });

    it('在没有加密数据时应该抛出错误', async () => {
      await expect(decryptAndGetMnemonic()).rejects.toThrow('No encrypted mnemonic in memory');
    });

    it('应该正确处理 Unicode 字符', async () => {
      const unicodeMnemonic = '测试助记词 with unicode 测试';

      await encryptAndStoreMnemonic(unicodeMnemonic);
      const { mnemonic } = await decryptAndGetMnemonic();

      expect(mnemonic).toBe(unicodeMnemonic);
    });

    it('应该正确处理多行文本', async () => {
      const multilineMnemonic = 'line1\nline2\nline3';

      await encryptAndStoreMnemonic(multilineMnemonic);
      const { mnemonic } = await decryptAndGetMnemonic();

      expect(mnemonic).toBe(multilineMnemonic);
    });
  });

  describe('clearEncryptedMnemonic', () => {
    it('应该清除内存中的加密数据', async () => {
      await encryptAndStoreMnemonic('test mnemonic');
      expect(hasEncryptedMnemonicInMemory()).toBe(true);

      clearEncryptedMnemonic();
      expect(hasEncryptedMnemonicInMemory()).toBe(false);
    });

    it('清除后应该无法解密', async () => {
      await encryptAndStoreMnemonic('test mnemonic');
      clearEncryptedMnemonic();

      await expect(decryptAndGetMnemonic()).rejects.toThrow('No encrypted mnemonic in memory');
    });

    it('应该可以安全地多次调用', () => {
      expect(() => {
        clearEncryptedMnemonic();
        clearEncryptedMnemonic();
        clearEncryptedMnemonic();
      }).not.toThrow();
    });
  });

  describe('hasEncryptedMnemonicInMemory', () => {
    it('在没有加密数据时应该返回 false', () => {
      expect(hasEncryptedMnemonicInMemory()).toBe(false);
    });

    it('在有加密数据时应该返回 true', async () => {
      await encryptAndStoreMnemonic('test mnemonic');
      expect(hasEncryptedMnemonicInMemory()).toBe(true);
    });

    it('在清除后应该返回 false', async () => {
      await encryptAndStoreMnemonic('test mnemonic');
      clearEncryptedMnemonic();
      expect(hasEncryptedMnemonicInMemory()).toBe(false);
    });
  });

  describe('加密解密流程', () => {
    it('应该能够完整地加密和解密流程', async () => {
      const originalMnemonic = 'test mnemonic phrase with twelve words here';
      const originalPassphrase = 'my passphrase';

      // 加密
      await encryptAndStoreMnemonic(originalMnemonic, originalPassphrase);
      expect(hasEncryptedMnemonicInMemory()).toBe(true);

      // 解密
      const { mnemonic, passphrase } = await decryptAndGetMnemonic();
      expect(mnemonic).toBe(originalMnemonic);
      expect(passphrase).toBe(originalPassphrase);

      // 清除
      clearEncryptedMnemonic();
      expect(hasEncryptedMnemonicInMemory()).toBe(false);
    });

    it('应该能够多次加密不同的助记词', async () => {
      const mnemonic1 = 'first mnemonic phrase';
      const mnemonic2 = 'second mnemonic phrase';

      await encryptAndStoreMnemonic(mnemonic1);
      const { mnemonic: decrypted1 } = await decryptAndGetMnemonic();
      expect(decrypted1).toBe(mnemonic1);

      await encryptAndStoreMnemonic(mnemonic2);
      const { mnemonic: decrypted2 } = await decryptAndGetMnemonic();
      expect(decrypted2).toBe(mnemonic2);
      expect(decrypted2).not.toBe(mnemonic1);
    });
  });

  describe('错误处理', () => {
    it('应该处理加密失败的情况', async () => {
      // Mock crypto.subtle.generateKey 抛出错误
      vi.spyOn(crypto.subtle, 'generateKey').mockRejectedValueOnce(new Error('Crypto error'));

      await expect(encryptAndStoreMnemonic('test')).rejects.toThrow(
        'Failed to encrypt mnemonic in memory'
      );

      // 恢复原始方法
      vi.restoreAllMocks();
    });

    it('应该处理解密失败的情况', async () => {
      await encryptAndStoreMnemonic('test mnemonic');

      // 清除密钥以模拟解密失败
      clearEncryptedMnemonic();

      await expect(decryptAndGetMnemonic()).rejects.toThrow('No encrypted mnemonic in memory');
    });
  });
});
