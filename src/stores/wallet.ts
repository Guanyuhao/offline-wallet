import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import {
  encryptAndStoreMnemonic,
  decryptAndGetMnemonic,
  clearEncryptedMnemonic,
  hasEncryptedMnemonicInMemory,
} from '../composables/useMemoryEncryption';

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
  const selectedChain = ref<ChainType>('BNB');

  // Computed
  const isWalletCreated = computed(() => addresses.value.length > 0);
  const primaryAddress = computed(() => {
    const chainAddresses = addresses.value.filter((a) => a.chain === selectedChain.value);
    return chainAddresses[0]?.address || '';
  });

  const getAddressesByChain = (chain: ChainType) => {
    return addresses.value.filter((a) => a.chain === chain);
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
    try {
      // 临时使用明文助记词派生地址
      mnemonic.value = phrase;
      passphrase.value = pass;

      await deriveAddressesForAllChains();

      // 派生完成后，加密并存储到内存（清除明文）
      await encryptAndStoreMnemonic(phrase, pass);
      mnemonic.value = '';
      passphrase.value = '';

      isLocked.value = false;
      updateActivity();
    } catch (error) {
      // 发生错误时清除数据
      mnemonic.value = '';
      passphrase.value = '';
      clearEncryptedMnemonic();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create wallet: ${errorMessage}`);
    }
  }

  async function deriveAddressesForAllChains(): Promise<void> {
    const chains: ChainType[] = ['ETH', 'BTC', 'BNB', 'SOL', 'TRON'];
    const newAddresses: Address[] = [];
    const errors: string[] = [];

    for (const chain of chains) {
      try {
        const result = await deriveAddressForChain(chain, 0);
        if (result.address) {
          newAddresses.push({
            index: 0,
            address: result.address,
            path: result.path,
            chain,
          });
        } else {
          errors.push(`${chain}: Empty address returned`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to derive ${chain} address:`, errorMessage);
        errors.push(`${chain}: ${errorMessage}`);
        // 不阻止其他链的地址生成，但记录错误
      }
    }

    addresses.value = newAddresses;
    updateActivity();

    // 如果有错误，记录但不阻止钱包创建
    if (errors.length > 0) {
      console.warn('Some addresses failed to generate:', errors);
    }

    // 确保至少有一个地址生成成功
    if (newAddresses.length === 0) {
      throw new Error('Failed to generate any addresses. Please check your mnemonic.');
    }
  }

  // 获取助记词（从加密内存或明文）- 用于内部使用
  async function getMnemonic(): Promise<{ mnemonic: string; passphrase: string }> {
    // 如果内存中有加密的助记词，解密它
    if (hasEncryptedMnemonicInMemory()) {
      const decrypted = await decryptAndGetMnemonic();
      return decrypted;
    }
    // 否则使用明文（向后兼容）
    return {
      mnemonic: mnemonic.value,
      passphrase: passphrase.value,
    };
  }

  // 公共方法：获取助记词用于签名（需要先检查锁定状态）
  async function getMnemonicForSigning(): Promise<{ mnemonic: string; passphrase: string }> {
    if (isLocked.value) {
      throw new Error('钱包已锁定，请先解锁');
    }
    const result = await getMnemonic();
    return result;
  }

  async function deriveAddressForChain(
    chain: ChainType,
    index: number
  ): Promise<{ address: string; path: string }> {
    const { mnemonic: mnemonic_val, passphrase: passphrase_val } = await getMnemonic();

    if (chain === 'ETH') {
      const result = await invoke<{ address: string; derivation_path: string }>(
        'derive_eth_address_cmd',
        { mnemonic: mnemonic_val, passphrase: passphrase_val, index }
      );
      return { address: result.address, path: result.derivation_path };
    } else if (chain === 'BTC') {
      const result = await invoke<{
        address: string;
        derivation_path: string;
        address_type: string;
      }>('derive_btc_address_cmd', {
        mnemonic: mnemonic_val,
        passphrase: passphrase_val,
        index,
        address_type: 'native_segwit',
      });
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
    // 检查钱包是否锁定
    if (isLocked.value) {
      throw new Error('钱包已锁定，请先解锁');
    }

    try {
      // 从加密内存获取助记词
      const { mnemonic: mnemonic_val, passphrase: passphrase_val } = await getMnemonic();

      if (!mnemonic_val) {
        throw new Error('助记词不可用，请重新解锁钱包');
      }

      const result = await invoke<SignedTransaction>('sign_eth_transaction_cmd', {
        mnemonic: mnemonic_val,
        passphrase: passphrase_val || null,
        index: addressIndex,
        transaction,
      });

      updateActivity();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to sign transaction: ${errorMessage}`);
    }
  }

  function lockWallet(): void {
    isLocked.value = true;
    // 清除内存中的加密助记词
    clearEncryptedMnemonic();
    mnemonic.value = '';
    passphrase.value = '';
    // 保留地址信息，用户可以查看但不能签名交易
  }

  async function unlockWallet(
    mnemonicPhrase: string,
    passphrasePhrase: string = ''
  ): Promise<void> {
    try {
      // 加密并存储到内存
      await encryptAndStoreMnemonic(mnemonicPhrase, passphrasePhrase);
      isLocked.value = false;
      updateActivity();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to unlock wallet: ${errorMessage}`);
    }
  }

  function clearWallet(): void {
    clearEncryptedMnemonic();
    mnemonic.value = '';
    passphrase.value = '';
    addresses.value = [];
    isLocked.value = true;
  }

  function updateActivity(): void {
    lastActivity.value = Date.now();
  }

  function setAddressLabel(index: number, label: string): void {
    const addr = addresses.value.find((a) => a.index === index);
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
    getMnemonicForSigning,
  };
});
