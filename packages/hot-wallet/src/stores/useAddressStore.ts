import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChainType } from '@offline-wallet/shared/config';

/**
 * 观察地址信息
 */
export interface WatchAddress {
  /** 地址 ID（唯一标识） */
  id: string;
  /** 链类型 */
  chain: ChainType;
  /** 地址 */
  address: string;
  /** 地址标签（可选） */
  label?: string;
  /** 添加时间戳 */
  addedAt: number;
  /** 余额（缓存，可能过期） */
  balance?: string;
  /** 余额最后更新时间 */
  balanceUpdatedAt?: number;
}

interface AddressStoreState {
  /** 观察地址列表 */
  addresses: WatchAddress[];
  /** 添加观察地址 */
  addAddress: (address: Omit<WatchAddress, 'id' | 'addedAt'>) => string;
  /** 移除观察地址 */
  removeAddress: (id: string) => void;
  /** 更新地址标签 */
  updateLabel: (id: string, label: string) => void;
  /** 更新地址余额 */
  updateBalance: (id: string, balance: string) => void;
  /** 根据 ID 获取地址 */
  getAddressById: (id: string) => WatchAddress | undefined;
  /** 检查地址是否已存在 */
  addressExists: (chain: ChainType, address: string) => boolean;
  /** 清空所有地址 */
  clearAll: () => void;
}

const useAddressStore = create<AddressStoreState>()(
  persist(
    (set, get) => ({
      addresses: [],

      addAddress: (address) => {
        const id = `${address.chain}-${address.address}-${Date.now()}`;
        const newAddress: WatchAddress = {
          ...address,
          id,
          addedAt: Date.now(),
        };

        set((state) => ({
          addresses: [...state.addresses, newAddress],
        }));

        return id;
      },

      removeAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.filter((addr) => addr.id !== id),
        }));
      },

      updateLabel: (id, label) => {
        set((state) => ({
          addresses: state.addresses.map((addr) => (addr.id === id ? { ...addr, label } : addr)),
        }));
      },

      updateBalance: (id, balance) => {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === id ? { ...addr, balance, balanceUpdatedAt: Date.now() } : addr
          ),
        }));
      },

      getAddressById: (id) => {
        return get().addresses.find((addr) => addr.id === id);
      },

      addressExists: (chain, address) => {
        return get().addresses.some(
          (addr) => addr.chain === chain && addr.address.toLowerCase() === address.toLowerCase()
        );
      },

      clearAll: () => {
        set({ addresses: [] });
      },
    }),
    {
      name: 'watch-addresses-storage', // localStorage key
    }
  )
);

export default useAddressStore;
