import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';

export type ChainType = 'ETH' | 'BTC' | 'BNB' | 'SOL' | 'TRON';

export interface Address {
  index: number;
  address: string;
  path: string;
  chain: ChainType;
  label?: string;
}

export interface SignedTransaction {
  raw_transaction: string;
  transaction_hash: string;
}

export const useWalletStore = defineStore('wallet', () => {
  // State
  const mnemonic = ref<string>('');
  const passphrase = ref<string>('');
  const addresses = ref<Address[]>([]);
  const isLocked = ref<boolean>(true);
  const lastActivity = ref<number>(Date.now());
  const selectedChain = ref<ChainType>('ETH');

  // Computed
  const isWalletCreated = computed(() => addresses.value.length > 0);
  const primaryAddress = computed(() => {
    const chainAddresses = addresses.value.filter(a => a.chain === selectedChain.value);
    return chainAddresses[0]?.address || '';
  });
  
  const getAddressesByChain = (chain: ChainType) => {
    return addresses.value.filter(a => a.chain === chain);
  };

  // Actions
  async function generateMnemonic(wordCount: number = 12): Promise<string> {
    try {
      const result = await invoke<string>('generate_mnemonic_cmd', { wordCount });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate mnemonic: ${errorMessage}`);
    }
  }

  async function validateMnemonic(phrase: string): Promise<boolean> {
    try {
      return await invoke<boolean>('validate_mnemonic_cmd', { mnemonic: phrase });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to validate mnemonic: ${errorMessage}`);
    }
  }

  async function createWallet(phrase: string, pass: string = ''): Promise<void> {
    mnemonic.value = phrase;
    passphrase.value = pass;
    await deriveAddressesForAllChains();
    isLocked.value = false;
    updateActivity();
  }

  async function deriveAddressesForAllChains(): Promise<void> {
    const chains: ChainType[] = ['ETH', 'BTC', 'BNB', 'SOL', 'TRON'];
    const newAddresses: Address[] = [];
    
    for (const chain of chains) {
      try {
        const result = await deriveAddressForChain(chain, 0);
        newAddresses.push({
          index: 0,
          address: result.address,
          path: result.path,
          chain,
        });
      } catch (error) {
        console.error(`Failed to derive ${chain} address:`, error);
      }
    }
    
    addresses.value = newAddresses;
    updateActivity();
  }

  async function deriveAddressForChain(chain: ChainType, index: number): Promise<{ address: string; path: string }> {
    const mnemonic_val = mnemonic.value;
    const passphrase_val = passphrase.value || null;
    
    if (chain === 'ETH') {
      const result = await invoke<{ address: string; derivation_path: string }>(
        'derive_eth_address_cmd',
        { mnemonic: mnemonic_val, passphrase: passphrase_val, index }
      );
      return { address: result.address, path: result.derivation_path };
    } else if (chain === 'BTC') {
      const result = await invoke<{ address: string; derivation_path: string; address_type: string }>(
        'derive_btc_address_cmd',
        { mnemonic: mnemonic_val, passphrase: passphrase_val, index, address_type: 'native_segwit' }
      );
      return { address: result.address, path: result.derivation_path };
    } else if (chain === 'BNB') {
      const result = await invoke<{ address: string; derivation_path: string }>(
        'derive_bnb_address_cmd',
        { mnemonic: mnemonic_val, passphrase: passphrase_val, index }
      );
      return { address: result.address, path: result.derivation_path };
    } else if (chain === 'SOL') {
      const result = await invoke<{ address: string; derivation_path: string }>(
        'derive_sol_address_cmd',
        { mnemonic: mnemonic_val, passphrase: passphrase_val, index }
      );
      return { address: result.address, path: result.derivation_path };
    } else if (chain === 'TRON') {
      const result = await invoke<{ address: string; derivation_path: string }>(
        'derive_tron_address_cmd',
        { mnemonic: mnemonic_val, passphrase: passphrase_val, index }
      );
      return { address: result.address, path: result.derivation_path };
    } else {
      throw new Error(`Unsupported chain: ${chain}`);
    }
  }
  
  function setSelectedChain(chain: ChainType): void {
    selectedChain.value = chain;
  }

  async function signTransaction(
    addressIndex: number,
    transaction: {
      to: string;
      value: string;
      gas_price: string;
      gas_limit: string;
      nonce: string;
      data?: string;
    }
  ): Promise<SignedTransaction> {
    try {
      const result = await invoke<SignedTransaction>(
        'sign_eth_transaction_cmd',
        {
          mnemonic: mnemonic.value,
          passphrase: passphrase.value || null,
          index: addressIndex,
          transaction,
        }
      );
      
      updateActivity();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to sign transaction: ${errorMessage}`);
    }
  }

  function lockWallet(): void {
    isLocked.value = true;
    // 不清除地址，只锁定访问
  }

  function unlockWallet(): void {
    isLocked.value = false;
    updateActivity();
  }

  function clearWallet(): void {
    mnemonic.value = '';
    passphrase.value = '';
    addresses.value = [];
    isLocked.value = true;
  }

  function updateActivity(): void {
    lastActivity.value = Date.now();
  }

  function setAddressLabel(index: number, label: string): void {
    const addr = addresses.value.find(a => a.index === index);
    if (addr) {
      addr.label = label;
    }
  }

  return {
    // State
    mnemonic,
    passphrase,
    addresses,
    isLocked,
    lastActivity,
    selectedChain,
    
    // Computed
    isWalletCreated,
    primaryAddress,
    getAddressesByChain,
    
    // Actions
    generateMnemonic,
    validateMnemonic,
    createWallet,
    deriveAddressesForAllChains,
    signTransaction,
    lockWallet,
    unlockWallet,
    clearWallet,
    updateActivity,
    setAddressLabel,
    setSelectedChain,
    deriveAddressForChain,
  };
});

