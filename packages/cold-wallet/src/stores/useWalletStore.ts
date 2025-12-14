import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  // 钱包状态
  isUnlocked: boolean;
  hasWallet: boolean;
  currentChain: 'eth' | 'btc' | 'sol' | 'bnb' | 'tron' | 'kaspa';
  address: string | null;
  mnemonic: string | null; // 仅在内存中，解锁时临时存储

  // 生物识别设置
  biometricEnabled: boolean;

  // Actions
  setUnlocked: (unlocked: boolean) => void;
  setHasWallet: (has: boolean) => void;
  setCurrentChain: (chain: 'eth' | 'btc' | 'sol' | 'bnb' | 'tron' | 'kaspa') => void;
  setAddress: (address: string | null) => void;
  setMnemonic: (mnemonic: string | null) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  reset: () => void;
  clearMnemonic: () => void; // 清除内存中的助记词
}

const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      isUnlocked: false,
      hasWallet: false,
      currentChain: 'eth',
      address: null,
      mnemonic: null,
      biometricEnabled: false,

      setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),
      setHasWallet: (has) => set({ hasWallet: has }),
      setCurrentChain: (chain) => set({ currentChain: chain }),
      setAddress: (address) => set({ address }),
      setMnemonic: (mnemonic) => set({ mnemonic }),
      setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),
      reset: () =>
        set({
          isUnlocked: false,
          hasWallet: false,
          currentChain: 'eth',
          address: null,
          mnemonic: null,
          // 注意：不重置 biometricEnabled，因为它是用户设置
        }),
      clearMnemonic: () => set({ mnemonic: null }),
    }),
    {
      name: 'cold-wallet-settings',
      // 只持久化需要保存的字段
      partialize: (state) => ({
        biometricEnabled: state.biometricEnabled,
        currentChain: state.currentChain,
      }),
    }
  )
);

export default useWalletStore;
