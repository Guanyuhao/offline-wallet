import { create } from 'zustand';

interface WalletState {
  // 钱包状态
  isUnlocked: boolean;
  hasWallet: boolean;
  currentChain: 'eth' | 'btc' | 'sol' | 'bnb' | 'tron' | 'kaspa';
  address: string | null;
  mnemonic: string | null; // 仅在内存中，解锁时临时存储

  // Actions
  setUnlocked: (unlocked: boolean) => void;
  setHasWallet: (has: boolean) => void;
  setCurrentChain: (chain: 'eth' | 'btc' | 'sol' | 'bnb' | 'tron' | 'kaspa') => void;
  setAddress: (address: string | null) => void;
  setMnemonic: (mnemonic: string | null) => void;
  reset: () => void;
  clearMnemonic: () => void; // 清除内存中的助记词
}

const useWalletStore = create<WalletState>((set) => ({
  isUnlocked: false,
  hasWallet: false,
  currentChain: 'eth',
  address: null,
  mnemonic: null,

  setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),
  setHasWallet: (has) => set({ hasWallet: has }),
  setCurrentChain: (chain) => set({ currentChain: chain }),
  setAddress: (address) => set({ address }),
  setMnemonic: (mnemonic) => set({ mnemonic }),
  reset: () =>
    set({
      isUnlocked: false,
      hasWallet: false,
      currentChain: 'eth',
      address: null,
      mnemonic: null,
    }),
  clearMnemonic: () => set({ mnemonic: null }),
}));

export default useWalletStore;
