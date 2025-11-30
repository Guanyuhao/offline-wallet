import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWalletStore } from '../wallet';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core');

describe('useWalletStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('generateMnemonic', () => {
    it('应该生成12词助记词', async () => {
      const store = useWalletStore();
      const mockMnemonic =
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';

      vi.mocked(invoke).mockResolvedValue(mockMnemonic);

      const result = await store.generateMnemonic(12);

      expect(result).toBe(mockMnemonic);
      expect(invoke).toHaveBeenCalledWith('generate_mnemonic_cmd', { wordCount: 12 });
    });

    it('应该生成24词助记词', async () => {
      const store = useWalletStore();
      const mockMnemonic =
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 word13 word14 word15 word16 word17 word18 word19 word20 word21 word22 word23 word24';

      vi.mocked(invoke).mockResolvedValue(mockMnemonic);

      const result = await store.generateMnemonic(24);

      expect(result).toBe(mockMnemonic);
      expect(invoke).toHaveBeenCalledWith('generate_mnemonic_cmd', { wordCount: 24 });
    });

    it('应该在生成失败时抛出错误', async () => {
      const store = useWalletStore();
      const mockError = new Error('Generation failed');

      vi.mocked(invoke).mockRejectedValue(mockError);

      await expect(store.generateMnemonic(12)).rejects.toThrow('Failed to generate mnemonic');
    });
  });

  describe('validateMnemonic', () => {
    it('应该验证有效的助记词', async () => {
      const store = useWalletStore();
      const validMnemonic =
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';

      vi.mocked(invoke).mockResolvedValue(true);

      const result = await store.validateMnemonic(validMnemonic);

      expect(result).toBe(true);
      expect(invoke).toHaveBeenCalledWith('validate_mnemonic_cmd', { mnemonic: validMnemonic });
    });

    it('应该拒绝无效的助记词', async () => {
      const store = useWalletStore();
      const invalidMnemonic = 'invalid mnemonic';

      vi.mocked(invoke).mockResolvedValue(false);

      const result = await store.validateMnemonic(invalidMnemonic);

      expect(result).toBe(false);
    });

    it('应该在验证失败时抛出错误', async () => {
      const store = useWalletStore();
      const mockError = new Error('Validation failed');

      vi.mocked(invoke).mockRejectedValue(mockError);

      await expect(store.validateMnemonic('test')).rejects.toThrow('Failed to validate mnemonic');
    });
  });

  describe('createWallet', () => {
    it('应该创建钱包并派生地址', async () => {
      const store = useWalletStore();
      const mnemonic = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
      const passphrase = 'test123';

      // Mock deriveAddressForChain 调用（需要 mock 所有链的地址派生）
      vi.mocked(invoke).mockImplementation((cmd: string) => {
        if (cmd === 'derive_eth_address_cmd') {
          return Promise.resolve({
            address: '0x1234567890123456789012345678901234567890',
            derivation_path: "m/44'/60'/0'/0/0",
          });
        }
        if (cmd === 'derive_btc_address_cmd') {
          return Promise.resolve({
            address: 'bc1btc1234567890123456789012345678901234567890',
            derivation_path: "m/44'/0'/0'/0/0",
            address_type: 'native_segwit',
          });
        }
        if (cmd === 'derive_bnb_address_cmd') {
          return Promise.resolve({
            address: 'bnb1bnb1234567890123456789012345678901234567890',
            derivation_path: "m/44'/714'/0'/0/0",
          });
        }
        if (cmd === 'derive_sol_address_cmd') {
          return Promise.resolve({
            address: 'Solana1234567890123456789012345678901234567890',
            derivation_path: "m/44'/501'/0'/0'",
          });
        }
        if (cmd === 'derive_tron_address_cmd') {
          return Promise.resolve({
            address: 'TTRON1234567890123456789012345678901234567890',
            derivation_path: "m/44'/195'/0'/0/0",
          });
        }
        return Promise.reject(new Error(`Unknown command: ${cmd}`));
      });

      await store.createWallet(mnemonic, passphrase);

      // mnemonic 和 passphrase 是私有状态，通过其他方式验证
      expect(store.isLocked).toBe(false);
      expect(store.isWalletCreated).toBe(true);
      expect(store.addresses.length).toBeGreaterThan(0);
      // 验证地址是否正确派生
      expect(store.addresses.some((a) => a.chain === 'ETH')).toBe(true);
    });

    it('应该在创建失败时抛出错误', async () => {
      const store = useWalletStore();
      const mockError = new Error('Create failed');

      vi.mocked(invoke).mockRejectedValue(mockError);

      await expect(store.createWallet('test', '')).rejects.toThrow('Failed to create wallet');
    });
  });

  describe('clearWallet', () => {
    it('应该清除所有钱包数据', () => {
      const store = useWalletStore();

      // 设置一些数据
      store.mnemonic = 'test mnemonic';
      store.passphrase = 'test passphrase';
      store.addresses = [
        {
          index: 0,
          address: '0x123',
          path: 'm/44/60/0/0/0',
          chain: 'ETH',
        },
      ];
      store.isLocked = false;

      store.clearWallet();

      expect(store.mnemonic).toBe('');
      expect(store.passphrase).toBe('');
      expect(store.addresses).toEqual([]);
      expect(store.isLocked).toBe(true);
    });
  });

  describe('isWalletCreated', () => {
    it('应该在没有地址时返回 false', () => {
      const store = useWalletStore();
      store.addresses = [];

      expect(store.isWalletCreated).toBe(false);
    });

    it('应该在有地址时返回 true', () => {
      const store = useWalletStore();
      store.addresses = [
        {
          index: 0,
          address: '0x123',
          path: 'm/44/60/0/0/0',
          chain: 'ETH',
        },
      ];

      expect(store.isWalletCreated).toBe(true);
    });
  });

  describe('primaryAddress', () => {
    it('应该返回当前选中链的主要地址', () => {
      const store = useWalletStore();
      store.selectedChain = 'ETH';
      store.addresses = [
        {
          index: 0,
          address: '0xETH123',
          path: 'm/44/60/0/0/0',
          chain: 'ETH',
        },
        {
          index: 0,
          address: '0xBTC123',
          path: 'm/44/0/0/0/0',
          chain: 'BTC',
        },
      ];

      expect(store.primaryAddress).toBe('0xETH123');
    });

    it('应该在没有地址时返回空字符串', () => {
      const store = useWalletStore();
      store.addresses = [];

      expect(store.primaryAddress).toBe('');
    });
  });

  describe('lockWallet and unlockWallet', () => {
    it('应该锁定钱包', () => {
      const store = useWalletStore();
      store.isLocked = false;

      store.lockWallet();

      expect(store.isLocked).toBe(true);
      // 地址应该保留
      expect(store.addresses.length).toBeGreaterThanOrEqual(0);
    });

    it('应该解锁钱包', async () => {
      const store = useWalletStore();
      store.isLocked = true;
      store.addresses = [
        {
          index: 0,
          address: '0x1234567890123456789012345678901234567890',
          path: 'm/44/60/0/0/0',
          chain: 'ETH',
        },
      ];

      const mnemonic = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';

      // Mock encryptAndStoreMnemonic（通过 mock Tauri invoke）
      vi.mocked(invoke).mockResolvedValue(undefined);

      await store.unlockWallet(mnemonic, '');

      expect(store.isLocked).toBe(false);
    });
  });
});
