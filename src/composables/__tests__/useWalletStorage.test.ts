import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  hasStoredWallet,
  saveWalletData,
  loadWalletData,
  clearWalletData,
  initializeWalletFromStorage,
  syncWalletToStorage,
  hasEncryptedMnemonic,
  storeEncryptedMnemonic,
  deleteEncryptedMnemonic,
  clearAllWalletData,
} from '../useWalletStorage';
import { invoke } from '@tauri-apps/api/core';
import { setActivePinia, createPinia } from 'pinia';
import { useWalletStore } from '../../stores/wallet';
import type { StoredWalletData } from '../useWalletStorage';
import type { Address } from '../../stores/wallet';

vi.mock('@tauri-apps/api/core');

describe('useWalletStorage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('hasStoredWallet', () => {
    it('应该在钱包不存在时返回 false', () => {
      expect(hasStoredWallet()).toBe(false);
    });

    it('应该在钱包存在时返回 true', () => {
      localStorage.setItem('offline_wallet_exists', 'true');
      expect(hasStoredWallet()).toBe(true);
    });

    it('应该处理 localStorage 错误', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(hasStoredWallet()).toBe(false);
      getItemSpy.mockRestore();
    });
  });

  describe('saveWalletData', () => {
    it('应该保存钱包数据到 localStorage', () => {
      const data: StoredWalletData = {
        addresses: [
          {
            index: 0,
            address: '0x123',
            path: 'm/44/60/0/0/0',
            chain: 'ETH',
          },
        ],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      };

      saveWalletData(data);

      expect(localStorage.getItem('offline_wallet_exists')).toBe('true');
      const saved = JSON.parse(localStorage.getItem('offline_wallet_data') || '{}');
      expect(saved.addresses).toHaveLength(1);
      expect(saved.selectedChain).toBe('ETH');
    });

    it('应该在保存失败时抛出错误', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const data: StoredWalletData = {
        addresses: [],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      };

      expect(() => saveWalletData(data)).toThrow('Failed to save wallet data');
      setItemSpy.mockRestore();
    });

    it('应该处理大量地址数据', () => {
      const addresses: Address[] = Array.from({ length: 100 }, (_, i) => ({
        index: i,
        address: `0x${i.toString().padStart(40, '0')}`,
        path: `m/44/60/0/0/${i}`,
        chain: 'ETH' as const,
      }));

      const data: StoredWalletData = {
        addresses,
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      };

      expect(() => saveWalletData(data)).not.toThrow();
      const saved = loadWalletData();
      expect(saved?.addresses).toHaveLength(100);
    });
  });

  describe('loadWalletData', () => {
    it('应该在数据不存在时返回 null', () => {
      expect(loadWalletData()).toBeNull();
    });

    it('应该正确加载保存的数据', () => {
      const data: StoredWalletData = {
        addresses: [
          {
            index: 0,
            address: '0x123',
            path: 'm/44/60/0/0/0',
            chain: 'ETH',
          },
        ],
        selectedChain: 'ETH',
        lastActivity: 1234567890,
        version: '1.0.0',
      };

      saveWalletData(data);
      const loaded = loadWalletData();

      expect(loaded).toEqual(data);
    });

    it('应该处理损坏的 JSON 数据', () => {
      localStorage.setItem('offline_wallet_data', 'invalid json{');
      expect(loadWalletData()).toBeNull();
    });

    it('应该处理 localStorage 错误', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(loadWalletData()).toBeNull();
      getItemSpy.mockRestore();
    });
  });

  describe('clearWalletData', () => {
    it('应该清除所有钱包数据', () => {
      localStorage.setItem('offline_wallet_data', 'test');
      localStorage.setItem('offline_wallet_exists', 'true');

      clearWalletData();

      expect(localStorage.getItem('offline_wallet_data')).toBeNull();
      expect(localStorage.getItem('offline_wallet_exists')).toBeNull();
    });

    it('应该在清除失败时静默处理错误', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => clearWalletData()).not.toThrow();
      removeItemSpy.mockRestore();
    });
  });

  describe('initializeWalletFromStorage', () => {
    it('应该从存储中初始化钱包', () => {
      const store = useWalletStore();
      const data: StoredWalletData = {
        addresses: [
          {
            index: 0,
            address: '0xETH123',
            path: 'm/44/60/0/0/0',
            chain: 'ETH',
          },
          {
            index: 0,
            address: 'bc1BTC123',
            path: 'm/44/0/0/0/0',
            chain: 'BTC',
          },
        ],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      };

      saveWalletData(data);
      const result = initializeWalletFromStorage();

      expect(result).toBe(true);
      expect(store.addresses).toHaveLength(2);
      expect(store.selectedChain).toBe('ETH');
    });

    it('应该在数据无效时返回 false', () => {
      localStorage.setItem('offline_wallet_data', 'invalid');
      expect(initializeWalletFromStorage()).toBe(false);
    });

    it('应该处理空地址列表', () => {
      const data: StoredWalletData = {
        addresses: [],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      };

      saveWalletData(data);
      const result = initializeWalletFromStorage();

      // initializeWalletFromStorage 在空地址列表时应该返回 false
      expect(result).toBe(false);
      expect(useWalletStore().addresses).toEqual([]);
    });
  });

  describe('syncWalletToStorage', () => {
    it('应该同步钱包数据到存储', () => {
      const store = useWalletStore();
      store.addresses = [
        {
          index: 0,
          address: '0x123',
          path: 'm/44/60/0/0/0',
          chain: 'ETH',
        },
      ];
      store.selectedChain = 'BTC';

      syncWalletToStorage();

      const saved = loadWalletData();
      expect(saved?.addresses).toHaveLength(1);
      expect(saved?.selectedChain).toBe('BTC');
    });

    it('应该在没有钱包时不执行同步', () => {
      const store = useWalletStore();
      store.addresses = [];

      syncWalletToStorage();

      expect(hasStoredWallet()).toBe(false);
    });
  });

  describe('hasEncryptedMnemonic', () => {
    it('应该检查是否存在加密助记词', async () => {
      vi.mocked(invoke).mockResolvedValue(true);

      const result = await hasEncryptedMnemonic();

      expect(result).toBe(true);
      expect(invoke).toHaveBeenCalledWith('has_encrypted_mnemonic');
    });

    it('应该处理检查失败的情况', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('Check failed'));

      // hasEncryptedMnemonic 在失败时返回 false，而不是抛出错误
      const result = await hasEncryptedMnemonic();
      expect(result).toBe(false);
    });
  });

  describe('storeEncryptedMnemonic', () => {
    it('应该存储加密助记词', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await storeEncryptedMnemonic('test_mnemonic', 'password123');

      expect(invoke).toHaveBeenCalledWith('store_encrypted_mnemonic', {
        mnemonic: 'test_mnemonic',
        password: 'password123',
      });
    });

    it('应该处理存储失败', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('Storage failed'));

      await expect(storeEncryptedMnemonic('data', 'password')).rejects.toThrow();
    });
  });

  describe('deleteEncryptedMnemonic', () => {
    it('应该删除加密助记词', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await deleteEncryptedMnemonic();

      expect(invoke).toHaveBeenCalledWith('delete_encrypted_mnemonic');
    });

    it('应该处理删除失败', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('Delete failed'));

      // deleteEncryptedMnemonic 在失败时会抛出错误
      await expect(deleteEncryptedMnemonic()).rejects.toThrow();
    });
  });

  describe('clearAllWalletData', () => {
    it('应该清除所有钱包数据', async () => {
      localStorage.setItem('offline_wallet_data', 'test');
      vi.mocked(invoke).mockResolvedValue(undefined);

      await clearAllWalletData();

      expect(localStorage.getItem('offline_wallet_data')).toBeNull();
      expect(invoke).toHaveBeenCalledWith('delete_encrypted_mnemonic');
    });

    it('应该忽略删除错误', async () => {
      localStorage.setItem('offline_wallet_data', 'test');
      vi.mocked(invoke).mockRejectedValue(new Error('Delete failed'));

      await expect(clearAllWalletData()).resolves.not.toThrow();
      expect(localStorage.getItem('offline_wallet_data')).toBeNull();
    });
  });
});
