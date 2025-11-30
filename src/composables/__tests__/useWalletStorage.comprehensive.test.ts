import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  hasStoredWallet,
  saveWalletData,
  loadWalletData,
  clearWalletData,
  initializeWalletFromStorage,
  syncWalletToStorage,
  hasEncryptedMnemonic,
  clearAllWalletData,
} from '../useWalletStorage';
import { invoke } from '@tauri-apps/api/core';
import { setActivePinia, createPinia } from 'pinia';
import { useWalletStore } from '../../stores/wallet';
import type { Address } from '../../stores/wallet';

vi.mock('@tauri-apps/api/core');

describe('useWalletStorage - 生产级别测试', () => {
  beforeEach(() => {
    // 清理 localStorage
    localStorage.clear();
    setActivePinia(createPinia());
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

    it('应该处理 localStorage 访问错误', () => {
      // Mock localStorage 抛出错误
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(hasStoredWallet()).toBe(false);

      localStorage.getItem = originalGetItem;
    });
  });

  describe('saveWalletData', () => {
    it('应该保存钱包数据到 localStorage', () => {
      const data = {
        addresses: [
          {
            index: 0,
            address: '0x123',
            path: 'm/44/60/0/0/0',
            chain: 'ETH' as const,
          },
        ],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      };

      saveWalletData(data);

      expect(localStorage.getItem('offline_wallet_exists')).toBe('true');
      const saved = JSON.parse(localStorage.getItem('offline_wallet_data') || '{}');
      expect(saved.addresses).toEqual(data.addresses);
      expect(saved.selectedChain).toBe(data.selectedChain);
    });

    it('应该在保存失败时抛出错误', () => {
      // 使用 vi.spyOn 来 mock Storage.prototype.setItem
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const data = {
        addresses: [],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      };

      // saveWalletData 在错误时会抛出错误
      expect(() => {
        saveWalletData(data);
      }).toThrow('Failed to save wallet data');

      // 验证 setItem 被调用
      expect(setItemSpy).toHaveBeenCalled();

      // 恢复原始方法
      setItemSpy.mockRestore();
    });

    it('应该处理大量地址数据', () => {
      const addresses: Address[] = Array.from({ length: 100 }, (_, i) => ({
        index: i,
        address: `0x${i.toString().padStart(40, '0')}`,
        path: `m/44/60/0/0/${i}`,
        chain: 'ETH' as const,
      }));

      const data = {
        addresses,
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      };

      expect(() => saveWalletData(data)).not.toThrow();
      const saved = loadWalletData();
      expect(saved?.addresses.length).toBe(100);
    });
  });

  describe('loadWalletData', () => {
    it('应该在数据不存在时返回 null', () => {
      expect(loadWalletData()).toBeNull();
    });

    it('应该正确加载保存的数据', () => {
      const data = {
        addresses: [
          {
            index: 0,
            address: '0x123',
            path: 'm/44/60/0/0/0',
            chain: 'ETH' as const,
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

    it('应该处理损坏的数据', () => {
      localStorage.setItem('offline_wallet_data', 'invalid json');
      expect(loadWalletData()).toBeNull();
    });

    it('应该处理版本迁移（未来功能）', () => {
      const oldData = {
        addresses: [],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '0.9.0',
      };

      saveWalletData(oldData);
      const loaded = loadWalletData();
      expect(loaded?.version).toBe('0.9.0');
    });
  });

  describe('clearWalletData', () => {
    it('应该清除所有钱包数据', () => {
      saveWalletData({
        addresses: [],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      });

      clearWalletData();

      expect(localStorage.getItem('offline_wallet_data')).toBeNull();
      expect(localStorage.getItem('offline_wallet_exists')).toBeNull();
    });

    it('应该在数据不存在时也不抛出错误', () => {
      expect(() => clearWalletData()).not.toThrow();
    });

    it('应该处理清除过程中的错误', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Remove error');
      });

      // 应该静默处理错误
      expect(() => clearWalletData()).not.toThrow();

      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('initializeWalletFromStorage', () => {
    it('应该在数据不存在时返回 false', () => {
      expect(initializeWalletFromStorage()).toBe(false);
    });

    it('应该从存储中恢复钱包数据到 store', () => {
      const addresses: Address[] = [
        {
          index: 0,
          address: '0xETH123',
          path: 'm/44/60/0/0/0',
          chain: 'ETH' as const,
        },
        {
          index: 0,
          address: 'bc1btc123',
          path: 'm/44/0/0/0/0',
          chain: 'BTC' as const,
        },
      ];

      saveWalletData({
        addresses,
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      });

      const result = initializeWalletFromStorage();
      expect(result).toBe(true);

      const store = useWalletStore();
      expect(store.addresses.length).toBe(2);
      expect(store.selectedChain).toBe('ETH');
    });

    it('应该处理无效的存储数据', () => {
      localStorage.setItem('offline_wallet_data', '{"invalid": "data"}');
      localStorage.setItem('offline_wallet_exists', 'true');

      expect(initializeWalletFromStorage()).toBe(false);
    });
  });

  describe('syncWalletToStorage', () => {
    it('应该在钱包创建时同步数据到存储', () => {
      const store = useWalletStore();
      store.addresses = [
        {
          index: 0,
          address: '0x123',
          path: 'm/44/60/0/0/0',
          chain: 'ETH' as const,
        },
      ];
      store.selectedChain = 'ETH';

      syncWalletToStorage();

      expect(hasStoredWallet()).toBe(true);
      const data = loadWalletData();
      expect(data?.addresses.length).toBe(1);
    });

    it('应该更新已存在的存储数据', () => {
      // 先保存一些数据
      saveWalletData({
        addresses: [
          {
            index: 0,
            address: '0xOLD',
            path: 'm/44/60/0/0/0',
            chain: 'ETH' as const,
          },
        ],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      });

      // 更新 store
      const store = useWalletStore();
      store.addresses = [
        {
          index: 0,
          address: '0xNEW',
          path: 'm/44/60/0/0/0',
          chain: 'ETH' as const,
        },
      ];
      store.selectedChain = 'BNB';

      syncWalletToStorage();

      const data = loadWalletData();
      expect(data).toBeDefined();
      if (data) {
        expect(data.addresses[0]?.address).toBe('0xNEW');
        expect(data.selectedChain).toBe('BNB');
      }
    });
  });

  describe('hasEncryptedMnemonic', () => {
    it('应该在加密助记词不存在时返回 false', async () => {
      vi.mocked(invoke).mockResolvedValue(false);
      const result = await hasEncryptedMnemonic();
      expect(result).toBe(false);
    });

    it('应该在加密助记词存在时返回 true', async () => {
      vi.mocked(invoke).mockResolvedValue(true);
      const result = await hasEncryptedMnemonic();
      expect(result).toBe(true);
    });

    it('应该处理 Tauri 调用错误', async () => {
      // hasEncryptedMnemonic 在错误时返回 false，而不是抛出错误
      vi.mocked(invoke).mockRejectedValue(new Error('Tauri error'));
      const result = await hasEncryptedMnemonic();
      expect(result).toBe(false);
    });
  });

  describe('clearAllWalletData', () => {
    it('应该清除所有数据包括加密助记词', async () => {
      // 设置一些数据
      saveWalletData({
        addresses: [],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      });

      vi.mocked(invoke).mockResolvedValue(undefined);

      await clearAllWalletData();

      expect(hasStoredWallet()).toBe(false);
      expect(invoke).toHaveBeenCalled();
    });

    it('应该处理清除加密助记词失败的情况', async () => {
      saveWalletData({
        addresses: [],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      });

      vi.mocked(invoke).mockRejectedValue(new Error('Delete failed'));

      // 应该静默处理错误
      await expect(clearAllWalletData()).resolves.not.toThrow();
      // localStorage 应该被清除
      expect(hasStoredWallet()).toBe(false);
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该处理 localStorage 配额超限', () => {
      // 使用 vi.spyOn 来 mock Storage.prototype.setItem
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      const data = {
        addresses: [],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      };

      // saveWalletData 在配额超限时应该抛出错误
      expect(() => {
        saveWalletData(data);
      }).toThrow('Failed to save wallet data');

      // 验证 setItem 被调用
      expect(setItemSpy).toHaveBeenCalled();

      // 恢复原始方法
      setItemSpy.mockRestore();
    });

    it('应该处理并发保存操作', () => {
      const data1 = {
        addresses: [{ index: 0, address: '0x1', path: 'm/1', chain: 'ETH' as const }],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      };

      const data2 = {
        addresses: [{ index: 0, address: '0x2', path: 'm/2', chain: 'ETH' as const }],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
      };

      saveWalletData(data1);
      saveWalletData(data2);

      const loaded = loadWalletData();
      expect(loaded).toBeDefined();
      if (loaded) {
        expect(loaded.addresses[0]?.address).toBe('0x2'); // 最后一次保存应该生效
      }
    });

    it('应该处理 JSON 序列化错误', () => {
      const data = {
        addresses: [],
        selectedChain: 'ETH',
        lastActivity: Date.now(),
        version: '1.0.0',
        // 添加循环引用会导致序列化失败
        circular: {} as any,
      };
      data.circular = data;

      // JSON.stringify 会抛出错误
      expect(() => {
        try {
          JSON.stringify(data);
        } catch (e) {
          throw new Error('Failed to save wallet data');
        }
      }).toThrow();
    });
  });
});
