import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWalletStore } from '../wallet';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core');

describe('useWalletStore Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('完整的钱包创建流程', () => {
    it('应该完成从生成到创建钱包的完整流程', async () => {
      const store = useWalletStore();
      const mockMnemonic =
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';

      // Mock 生成助记词和地址派生
      vi.mocked(invoke).mockImplementation((cmd: string, _args?: any) => {
        if (cmd === 'generate_mnemonic_cmd') {
          return Promise.resolve(mockMnemonic);
        }
        if (cmd === 'validate_mnemonic_cmd') {
          return Promise.resolve(true);
        }
        // Mock 各个链的地址派生命令（需要匹配实际的参数）
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

      // 1. 生成助记词
      const mnemonic = await store.generateMnemonic(12);
      expect(mnemonic).toBe(mockMnemonic);

      // 2. 验证助记词
      const isValid = await store.validateMnemonic(mnemonic);
      expect(isValid).toBe(true);

      // 3. 创建钱包（这会调用 deriveAddressesForAllChains）
      await store.createWallet(mnemonic, 'passphrase123');

      // 4. 验证钱包状态
      // 注意：mnemonic 是私有状态，通过 isWalletCreated 验证
      expect(store.isWalletCreated).toBe(true);
      expect(store.isLocked).toBe(false);
      expect(store.addresses.length).toBeGreaterThan(0);
      // 验证地址是否正确派生
      expect(store.addresses.some((a) => a.chain === 'ETH')).toBe(true);
    });
  });

  describe('多链地址派生', () => {
    it('应该为所有支持的链派生地址', async () => {
      const store = useWalletStore();
      const mockMnemonic =
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
      store.mnemonic = mockMnemonic; // 设置助记词，因为 deriveAddressForChain 需要它

      const chains = ['ETH', 'BTC', 'BNB', 'SOL', 'TRON'];
      const mockAddresses: Record<string, string> = {
        ETH: '0xETH1234567890123456789012345678901234567890',
        BTC: 'bc1btc1234567890123456789012345678901234567890',
        BNB: 'bnb1bnb1234567890123456789012345678901234567890',
        SOL: 'Solana1234567890123456789012345678901234567890',
        TRON: 'TTRON1234567890123456789012345678901234567890',
      };

      vi.mocked(invoke).mockImplementation((cmd: string, _args?: any) => {
        // Mock 各个链的地址派生命令
        if (cmd === 'derive_eth_address_cmd') {
          return Promise.resolve({
            address: mockAddresses.ETH,
            derivation_path: "m/44'/60'/0'/0/0",
          });
        }
        if (cmd === 'derive_btc_address_cmd') {
          return Promise.resolve({
            address: mockAddresses.BTC,
            derivation_path: "m/44'/0'/0'/0/0",
            address_type: 'native_segwit',
          });
        }
        if (cmd === 'derive_bnb_address_cmd') {
          return Promise.resolve({
            address: mockAddresses.BNB,
            derivation_path: "m/44'/714'/0'/0/0",
          });
        }
        if (cmd === 'derive_sol_address_cmd') {
          return Promise.resolve({
            address: mockAddresses.SOL,
            derivation_path: "m/44'/501'/0'/0'",
          });
        }
        if (cmd === 'derive_tron_address_cmd') {
          return Promise.resolve({
            address: mockAddresses.TRON,
            derivation_path: "m/44'/195'/0'/0/0",
          });
        }
        return Promise.reject(new Error(`Unknown command: ${cmd}`));
      });

      await store.deriveAddressesForAllChains();

      expect(store.addresses.length).toBe(chains.length);
      chains.forEach((chain) => {
        const address = store.addresses.find((a) => a.chain === chain);
        expect(address).toBeDefined();
        if (address) {
          expect(address.address).toBe(mockAddresses[chain]);
        }
      });
    });

    it('应该处理部分链地址派生失败的情况', async () => {
      const store = useWalletStore();
      const mockMnemonic =
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
      store.mnemonic = mockMnemonic; // 设置助记词

      vi.mocked(invoke).mockImplementation((cmd: string, _args?: any) => {
        // ETH 和 BTC 成功，其他失败
        if (cmd === 'derive_eth_address_cmd') {
          return Promise.resolve({
            address: '0xETH1234567890123456789012345678901234567890',
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
          return Promise.reject(new Error('Failed to derive BNB address'));
        }
        if (cmd === 'derive_sol_address_cmd') {
          return Promise.reject(new Error('Failed to derive SOL address'));
        }
        if (cmd === 'derive_tron_address_cmd') {
          return Promise.reject(new Error('Failed to derive TRON address'));
        }
        return Promise.reject(new Error(`Unknown command: ${cmd}`));
      });

      await store.deriveAddressesForAllChains();

      // 应该至少有成功派生的地址（ETH 和 BTC）
      expect(store.addresses.length).toBeGreaterThan(0);
      expect(store.addresses.length).toBeLessThanOrEqual(5);
      // 应该包含 ETH 和 BTC
      expect(store.addresses.some((a) => a.chain === 'ETH')).toBe(true);
      expect(store.addresses.some((a) => a.chain === 'BTC')).toBe(true);
    });
  });

  describe('交易签名流程', () => {
    it('应该完成完整的交易签名流程', async () => {
      const store = useWalletStore();
      const mnemonic = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';

      // 设置钱包
      vi.mocked(invoke).mockImplementation((cmd: string, _args?: any) => {
        // Mock 各个链的地址派生命令
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
        if (cmd === 'sign_eth_transaction_cmd') {
          return Promise.resolve({
            raw_transaction: '0x1234567890abcdef',
            transaction_hash: '0xabcdef1234567890',
          });
        }
        return Promise.reject(new Error(`Unknown command: ${cmd}`));
      });

      await store.createWallet(mnemonic, '');

      // 签名交易
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: '1000000000000000000',
        gas_price: '20000000000',
        gas_limit: '21000',
        nonce: '0',
      };

      const result = await store.signTransaction(0, transaction);

      expect(result.raw_transaction).toBe('0x1234567890abcdef');
      expect(result.transaction_hash).toBe('0xabcdef1234567890');
    });

    it('应该在签名失败时抛出错误', async () => {
      const store = useWalletStore();
      // 设置钱包状态（已解锁）
      store.addresses = [
        {
          index: 0,
          address: '0x1234567890123456789012345678901234567890',
          path: 'm/44/60/0/0/0',
          chain: 'ETH',
        },
      ];
      store.isLocked = false;
      // 设置助记词（通过 createWallet 或直接设置）
      const mnemonic = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
      await store.createWallet(mnemonic, '');

      vi.mocked(invoke).mockRejectedValue(new Error('Signing failed'));

      await expect(
        store.signTransaction(0, {
          to: '0x123',
          value: '100',
          gas_price: '20000',
          gas_limit: '21000',
          nonce: '0',
        })
      ).rejects.toThrow();
    });
  });

  describe('钱包锁定和解锁', () => {
    it('应该正确管理钱包锁定状态', () => {
      const store = useWalletStore();
      store.addresses = [
        {
          index: 0,
          address: '0x123',
          path: 'm/44/60/0/0/0',
          chain: 'ETH',
        },
      ];
      store.isLocked = false;

      // 锁定钱包
      store.lockWallet();
      expect(store.isLocked).toBe(true);
      expect(store.addresses.length).toBe(1); // 地址应该保留

      // 解锁钱包（需要提供助记词和密码）
      // 注意：unlockWallet 可能需要参数，这里测试锁定功能
      // 解锁功能需要在实际使用时测试
      expect(store.isLocked).toBe(true); // 锁定后应该保持锁定状态
    });
  });

  describe('地址标签管理', () => {
    it('应该设置和获取地址标签', () => {
      const store = useWalletStore();
      store.addresses = [
        {
          index: 0,
          address: '0x123',
          path: 'm/44/60/0/0/0',
          chain: 'ETH',
        },
        {
          index: 1,
          address: '0x456',
          path: 'm/44/60/0/0/1',
          chain: 'ETH',
        },
      ];

      store.setAddressLabel(0, 'My Wallet');
      store.setAddressLabel(1, 'Trading Wallet');

      const firstAddress = store.addresses[0];
      const secondAddress = store.addresses[1];
      expect(firstAddress).toBeDefined();
      expect(secondAddress).toBeDefined();
      if (firstAddress && secondAddress) {
        expect(firstAddress.label).toBe('My Wallet');
        expect(secondAddress.label).toBe('Trading Wallet');
      }
    });

    it('应该处理不存在的地址索引', () => {
      const store = useWalletStore();
      store.addresses = [
        {
          index: 0,
          address: '0x123',
          path: 'm/44/60/0/0/0',
          chain: 'ETH',
        },
      ];

      expect(() => store.setAddressLabel(999, 'Label')).not.toThrow();
      const firstAddress = store.addresses[0];
      expect(firstAddress).toBeDefined();
      if (firstAddress) {
        expect(firstAddress.label).toBeUndefined();
      }
    });
  });

  describe('链选择', () => {
    it('应该正确切换选中的链', () => {
      const store = useWalletStore();
      store.addresses = [
        { index: 0, address: '0xETH', path: 'm/44/60/0/0/0', chain: 'ETH' },
        { index: 0, address: 'bc1BTC', path: 'm/44/0/0/0/0', chain: 'BTC' },
        { index: 0, address: 'bnb1BNB', path: 'm/44/714/0/0/0', chain: 'BNB' },
      ];

      store.setSelectedChain('ETH');
      expect(store.selectedChain).toBe('ETH');
      expect(store.primaryAddress).toBe('0xETH');

      store.setSelectedChain('BTC');
      expect(store.selectedChain).toBe('BTC');
      expect(store.primaryAddress).toBe('bc1BTC');
    });
  });

  describe('活动时间更新', () => {
    it('应该在操作后更新活动时间', async () => {
      const store = useWalletStore();
      const initialTime = store.lastActivity;

      await new Promise((resolve) => setTimeout(resolve, 10));
      store.updateActivity();

      expect(store.lastActivity).toBeGreaterThan(initialTime);
    });
  });
});
