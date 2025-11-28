<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWalletStore, type ChainType } from './stores/wallet';
import { useUIStore } from './stores/ui';
import { invoke } from '@tauri-apps/api/core';
import ToastContainer from './components/ToastContainer.vue';
import LanguageSwitcher from './components/LanguageSwitcher.vue';

const walletStore = useWalletStore();
const uiStore = useUIStore();
const { t } = useI18n();

// 支持的链
const chains = [
  { value: 'ETH' as ChainType, name: 'Ethereum', icon: '🔷', color: '#627EEA' },
  { value: 'BTC' as ChainType, name: 'Bitcoin', icon: '🟠', color: '#F7931A' },
  { value: 'BNB' as ChainType, name: 'BNB Chain', icon: '🟡', color: '#F3BA2F' },
  { value: 'SOL' as ChainType, name: 'Solana', icon: '🟣', color: '#9945FF' },
  { value: 'TRON' as ChainType, name: 'Tron', icon: '🔴', color: '#FF0018' },
];

function getChainName(chain: ChainType): string {
  return chains.find(c => c.value === chain)?.name || chain;
}

function getAmountUnit(): string {
  const chain = walletStore.selectedChain;
  if (chain === 'BTC') return 'BTC';
  if (chain === 'SOL') return 'SOL';
  if (chain === 'TRON') return 'TRX';
  return 'ETH'; // ETH, BNB
}

function getAmountHint(): string {
  const chain = walletStore.selectedChain;
  if (chain === 'BTC') return '例如：0.001 表示转账 0.001 个 BTC';
  if (chain === 'SOL') return '例如：1.5 表示转账 1.5 个 SOL';
  if (chain === 'TRON') return '例如：100 表示转账 100 个 TRX';
  return '例如：0.1 表示转账 0.1 个 ETH';
}

function getAddressPlaceholder(): string {
  const chain = walletStore.selectedChain;
  if (chain === 'BTC') return 'bc1... 或 1... 或 3...';
  if (chain === 'SOL') return 'Base58 地址...';
  if (chain === 'TRON') return 'T...';
  return '0x...'; // ETH, BNB
}

function getAddressHint(): string {
  const chain = walletStore.selectedChain;
  if (chain === 'BTC') return '支持 Legacy、SegWit、Native SegWit 地址';
  if (chain === 'SOL') return 'Solana 地址（Base58 编码）';
  if (chain === 'TRON') return 'Tron 地址（T 开头）';
  return '以太坊地址（0x 开头，42字符）';
}

// 简化的状态管理
const step = ref<'start' | 'backup' | 'wallet'>('start');
const mnemonic = ref('');
const passphrase = ref('');
const inputMnemonic = ref('');
const showMnemonic = ref(false);
const understood = ref(false);
const wordCount = ref<12 | 24>(12); // 默认12个词

// 签名表单 - 简化版
const showSign = ref(false);
const showAllAddresses = ref(false);
const toAddress = ref('');
const amount = ref('');
const signResult = ref('');
const qrCode = ref('');
const addressValid = ref(true);
const addressError = ref('');

// 专业功能开关
const showAdvanced = ref(false);
const advancedOptions = ref({
  gasPrice: '20000000000', // 20 Gwei 默认值
  gasLimit: '21000', // 默认值
  nonce: '0', // 默认值
  data: '', // 可选
});

// 实时验证地址
async function validateAddressInput() {
  if (!toAddress.value.trim()) {
    addressValid.value = true;
    addressError.value = '';
    return;
  }
  
  try {
    const isValid = await invoke<boolean>('validate_address_cmd', {
      chain: walletStore.selectedChain,
      address: toAddress.value.trim()
    });
    
    addressValid.value = isValid;
    if (!isValid) {
      addressError.value = t('messages.invalidAddress');
    } else {
      addressError.value = '';
    }
  } catch (error) {
    addressValid.value = false;
    addressError.value = String(error);
  }
}

// 创建新钱包
async function createNewWallet() {
  try {
    uiStore.showLoading(t('common.loading'));
    mnemonic.value = await walletStore.generateMnemonic(wordCount.value);
    step.value = 'backup';
  } catch (error) {
    uiStore.showError(String(error));
  } finally {
    uiStore.hideLoading();
  }
}

// 导入钱包
async function importWallet() {
  try {
    uiStore.showLoading();
    const isValid = await walletStore.validateMnemonic(inputMnemonic.value.trim());
    if (!isValid) {
      uiStore.showError(t('messages.invalidMnemonic'));
      return;
    }
    await walletStore.createWallet(inputMnemonic.value.trim(), '');
    step.value = 'wallet';
    uiStore.showSuccess(t('messages.walletImported'));
  } catch (error) {
    uiStore.showError(String(error));
  } finally {
    uiStore.hideLoading();
  }
}

// 完成备份
async function finishBackup() {
  if (!understood.value) {
    uiStore.showWarning(t('backup.confirmBackup'));
    return;
  }
  try {
    uiStore.showLoading();
    await walletStore.createWallet(mnemonic.value, passphrase.value);
    step.value = 'wallet';
    uiStore.showSuccess(t('messages.walletCreated'));
  } catch (error) {
    uiStore.showError(String(error));
  } finally {
    uiStore.hideLoading();
  }
}

// 签名交易 - 支持多链
async function signTransaction() {
  const chain = walletStore.selectedChain;
  
  // 验证收款地址
  const address = String(toAddress.value || '').trim();
  if (!address) {
    uiStore.showError(t('wallet.toAddress') + ' ' + t('common.required'));
    return;
  }
  
  // 验证金额
  let amountValue = amount.value;
  if (typeof amountValue === 'number') {
    amountValue = amountValue.toString();
  } else {
    amountValue = String(amountValue || '').trim();
  }
  
  if (!amountValue || amountValue === '') {
    uiStore.showError(t('wallet.amount') + ' ' + t('common.required'));
    return;
  }
  
  const amountNum = parseFloat(amountValue);
  if (isNaN(amountNum) || amountNum <= 0 || !isFinite(amountNum)) {
    uiStore.showError(t('messages.invalidAmount'));
    return;
  }

  try {
    uiStore.showLoading(t('common.loading'));
    
    let result: { raw_transaction: string; transaction_hash: string };
    
  // 再次验证地址（双重检查）
  const isValidAddress = await invoke<boolean>('validate_address_cmd', {
    chain: chain,
    address: address
  });
  
  if (!isValidAddress) {
    uiStore.showError(t('messages.invalidAddress'));
    addressValid.value = false;
    return;
  }
  
  if (chain === 'ETH' || chain === 'BNB') {
      // ETH 和 BNB 使用相同的逻辑
      
      const valueInWei = (amountNum * 1e18).toString();
      const gasPrice = showAdvanced.value && advancedOptions.value.gasPrice.trim() 
        ? advancedOptions.value.gasPrice.trim() 
        : '20000000000';
      const gasLimit = showAdvanced.value && advancedOptions.value.gasLimit.trim() 
        ? advancedOptions.value.gasLimit.trim() 
        : '21000';
      const nonce = showAdvanced.value && advancedOptions.value.nonce.trim() 
        ? advancedOptions.value.nonce.trim() 
        : '0';
      const data = showAdvanced.value && advancedOptions.value.data.trim() 
        ? advancedOptions.value.data.trim() 
        : undefined;
      
      if (chain === 'ETH') {
        result = await invoke<{raw_transaction: string, transaction_hash: string}>(
          'sign_eth_transaction_cmd',
          {
            mnemonic: walletStore.mnemonic,
            passphrase: walletStore.passphrase || null,
            index: 0,
            transaction: {
              to: address,
              value: valueInWei,
              gas_price: gasPrice,
              gas_limit: gasLimit,
              nonce: nonce,
              data: data,
            }
          }
        );
      } else {
        result = await invoke<{raw_transaction: string, transaction_hash: string}>(
          'sign_bnb_transaction_cmd',
          {
            mnemonic: walletStore.mnemonic,
            passphrase: walletStore.passphrase || null,
            index: 0,
            transaction: {
              to: address,
              value: valueInWei,
              gas_price: gasPrice,
              gas_limit: gasLimit,
              nonce: nonce,
              data: data,
            }
          }
        );
      }
    } else if (chain === 'BTC') {
      // Bitcoin 地址验证已在上面完成
      
      // Bitcoin 交易
      const feeRate = showAdvanced.value && advancedOptions.value.gasPrice.trim()
        ? advancedOptions.value.gasPrice.trim()
        : undefined;
      
      result = await invoke<{raw_transaction: string, transaction_hash: string}>(
        'sign_btc_transaction_cmd',
        {
          mnemonic: walletStore.mnemonic,
          passphrase: walletStore.passphrase || null,
          index: 0,
          transaction: {
            to: address,
            amount: amountNum.toFixed(8),
            fee_rate: feeRate,
          }
        }
      );
    } else if (chain === 'SOL') {
      // Solana 地址验证已在上面完成
      
      // Solana 交易
      const recentBlockhash = showAdvanced.value && advancedOptions.value.data.trim()
        ? advancedOptions.value.data.trim()
        : undefined;
      
      const solResult = await invoke<{raw_transaction: string, signature: string}>(
        'sign_sol_transaction_cmd',
        {
          mnemonic: walletStore.mnemonic,
          passphrase: walletStore.passphrase || null,
          index: 0,
          transaction: {
            to: address,
            amount: amountNum.toString(),
            recent_blockhash: recentBlockhash,
          }
        }
      );
      
      // 转换 SOL 返回格式以匹配通用格式
      result = {
        raw_transaction: solResult.raw_transaction,
        transaction_hash: solResult.signature,
      };
    } else if (chain === 'TRON') {
      // Tron 地址验证已在上面完成
      
      // Tron 交易
      const gasPrice = showAdvanced.value && advancedOptions.value.gasPrice.trim()
        ? advancedOptions.value.gasPrice.trim()
        : undefined;
      const gasLimit = showAdvanced.value && advancedOptions.value.gasLimit.trim()
        ? advancedOptions.value.gasLimit.trim()
        : undefined;
      
      // Tron 使用 SUN 单位 (1 TRX = 1,000,000 SUN)
      const valueInSun = (amountNum * 1e6).toString();
      
      result = await invoke<{raw_transaction: string, transaction_hash: string}>(
        'sign_tron_transaction_cmd',
        {
          mnemonic: walletStore.mnemonic,
          passphrase: walletStore.passphrase || null,
          index: 0,
          transaction: {
            to: address,
            value: valueInSun,
            gas_price: gasPrice,
            gas_limit: gasLimit,
          }
        }
      );
    } else {
      throw new Error('Unsupported chain');
    }
    
    signResult.value = result.raw_transaction;
    
    // 生成二维码
    qrCode.value = await invoke<string>('generate_qrcode_cmd', { 
      data: result.raw_transaction 
    });
    
    uiStore.showSuccess(t('messages.signSuccess'));
  } catch (error) {
    uiStore.showError(t('messages.signFailed') + ': ' + error);
  } finally {
    uiStore.hideLoading();
  }
}

// 复制
function copy(text: string, label: string = '内容') {
  navigator.clipboard.writeText(text).then(() => {
    uiStore.showSuccess(`${label}已复制`);
  });
}

// 退出钱包
function exitWallet() {
  walletStore.clearWallet();
  step.value = 'start';
  mnemonic.value = '';
  inputMnemonic.value = '';
  showMnemonic.value = false;
  understood.value = false;
  showSign.value = false;
  showAllAddresses.value = false;
  signResult.value = '';
  qrCode.value = '';
  showAdvanced.value = false;
  toAddress.value = '';
  amount.value = '';
  addressValid.value = true;
  addressError.value = '';
  advancedOptions.value = {
    gasPrice: '20000000000',
    gasLimit: '21000',
    nonce: '0',
    data: '',
  };
}

onMounted(() => {
  uiStore.initTheme();
});
</script>

<template>
  <div class="app">
    <!-- 语言切换 -->
    <div class="lang-switcher">
      <LanguageSwitcher />
    </div>

    <!-- 开始页面 -->
    <div v-if="step === 'start'" class="container fade-in">
      <div class="hero">
        <h1 class="title">🔐</h1>
        <h2 class="subtitle">离线钱包</h2>
        <p class="description">安全 · 简单 · 离线</p>
      </div>

      <div class="card">
        <div class="card-content">
          <h3 class="card-title">开始使用</h3>
          
          <!-- 助记词数量选择 -->
          <div class="word-count-selector">
            <p class="selector-label">{{ t('start.wordCountLabel') }}</p>
            <div class="selector-buttons">
              <button 
                :class="['selector-btn', { active: wordCount === 12 }]"
                @click="wordCount = 12"
              >
                {{ t('start.words12') }}
                <span class="selector-hint">{{ t('start.recommended') }}</span>
              </button>
              <button 
                :class="['selector-btn', { active: wordCount === 24 }]"
                @click="wordCount = 24"
              >
                {{ t('start.words24') }}
                <span class="selector-hint">{{ t('start.moreSafe') }}</span>
              </button>
            </div>
          </div>
          
          <button class="btn btn-primary" @click="createNewWallet">
            <span class="btn-icon">✨</span>
            <span>{{ t('start.createNew') }}</span>
          </button>

          <div class="divider">
            <span>{{ t('common.or', 'or') }}</span>
          </div>

          <div class="import-section">
            <textarea 
              v-model="inputMnemonic" 
              class="input-area"
              :placeholder="t('start.importPlaceholder')"
              rows="3"
            ></textarea>
            <button class="btn btn-secondary" @click="importWallet">
              <span class="btn-icon">📥</span>
              <span>{{ t('start.import') }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="tips">
        <p>💡 {{ t('start.tip') }}</p>
      </div>
    </div>

    <!-- 备份页面 -->
    <div v-if="step === 'backup'" class="container fade-in">
      <div class="card">
        <div class="card-content">
          <h3 class="card-title">{{ t('backup.title') }}</h3>
          <p class="card-desc">{{ t('backup.description') }}</p>

          <div class="mnemonic-box">
            <div v-if="!showMnemonic" class="mnemonic-hidden" @click="showMnemonic = true">
              <span class="icon">👁️</span>
              <p>{{ t('backup.clickToShow') }}</p>
              <p class="mnemonic-count">{{ wordCount }} {{ t('common.words', 'words') }}</p>
            </div>
            <div v-else :class="['mnemonic-words', { 'words-24': wordCount === 24 }]">
              <span v-for="(word, i) in mnemonic.split(' ')" :key="i" class="word">
                <span class="word-num">{{ i + 1 }}</span>
                {{ word }}
              </span>
            </div>
          </div>

          <button v-if="showMnemonic" class="btn btn-ghost" @click="copy(mnemonic, t('backup.title'))">
            <span class="btn-icon">📋</span>
            <span>{{ t('backup.copyMnemonic') }}</span>
          </button>

          <div class="warning-box">
            <p>⚠️ {{ t('backup.warning.title') }}</p>
            <ul>
              <li>{{ t('backup.warning.tip1') }}</li>
              <li>{{ t('backup.warning.tip2') }}</li>
              <li>{{ t('backup.warning.tip3') }}</li>
            </ul>
          </div>

          <label class="checkbox">
            <input type="checkbox" v-model="understood" />
            <span>{{ t('backup.understand') }}</span>
          </label>

          <button class="btn btn-primary" @click="finishBackup" :disabled="!understood">
            <span>{{ t('backup.finish') }}</span>
          </button>

          <button class="btn btn-ghost" @click="exitWallet">
            <span>{{ t('common.cancel') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 钱包主页 -->
    <div v-if="step === 'wallet'" class="container fade-in">
      <!-- Header -->
      <div class="wallet-header">
        <h2 class="wallet-title">{{ t('wallet.title') }}</h2>
        <button class="btn-icon-only" @click="exitWallet" :title="t('wallet.exit')">
          ❌
        </button>
      </div>

      <!-- 链选择器 -->
      <div class="card">
        <div class="card-content">
          <p class="label">{{ t('wallet.selectChain') }}</p>
          <div class="chain-selector">
            <button
              v-for="chain in chains"
              :key="chain.value"
              :class="['chain-btn', { active: walletStore.selectedChain === chain.value }]"
              @click="walletStore.setSelectedChain(chain.value)"
            >
              <span class="chain-icon">{{ chain.icon }}</span>
              <span class="chain-name">{{ chain.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 地址卡片 -->
      <div class="card">
        <div class="card-content">
          <div class="address-section">
            <div class="address-header">
              <p class="label">{{ t('wallet.myAddress') }}</p>
              <div class="address-actions">
                <div class="chain-badge" :style="{ background: chains.find(c => c.value === walletStore.selectedChain)?.color + '20', color: chains.find(c => c.value === walletStore.selectedChain)?.color }">
                  <span class="chain-badge-icon">{{ chains.find(c => c.value === walletStore.selectedChain)?.icon }}</span>
                  <span>{{ getChainName(walletStore.selectedChain) }}</span>
                </div>
                <button 
                  class="btn-toggle-addresses" 
                  @click="showAllAddresses = !showAllAddresses"
                  :title="showAllAddresses ? t('wallet.hideAllAddresses') : t('wallet.showAllAddresses')"
                >
                  {{ showAllAddresses ? '▲' : '▼' }}
                </button>
              </div>
            </div>
            
            <!-- 当前链地址 -->
            <div class="address-display">
              <code class="address">{{ walletStore.primaryAddress || t('common.loading') }}</code>
              <button 
                class="btn-copy" 
                @click="copy(walletStore.primaryAddress, t('wallet.myAddress'))"
                :title="t('common.copy')"
              >
                📋
              </button>
            </div>
            
            <!-- 所有链地址列表 -->
            <div v-if="showAllAddresses" class="all-addresses animate-slide-down">
              <div 
                v-for="addr in walletStore.addresses" 
                :key="addr.chain"
                class="address-item"
                :class="{ 'address-item-active': addr.chain === walletStore.selectedChain }"
                @click="walletStore.setSelectedChain(addr.chain)"
              >
                <div class="address-item-header">
                  <span class="address-item-icon">{{ chains.find(c => c.value === addr.chain)?.icon }}</span>
                  <span class="address-item-chain">{{ getChainName(addr.chain) }}</span>
                </div>
                <code class="address-item-value">{{ addr.address }}</code>
                <button 
                  class="btn-copy-small" 
                  @click.stop="copy(addr.address, getChainName(addr.chain))"
                  :title="t('common.copy')"
                >
                  📋
                </button>
              </div>
            </div>
            
            <p class="hint">{{ t('wallet.addressHint') }}</p>
          </div>
        </div>
      </div>

      <!-- 签名交易 -->
      <div class="card">
        <div class="card-content">
          <h3 class="card-title">{{ t('wallet.send') }}</h3>
          
          <div v-if="!showSign">
            <button class="btn btn-primary" @click="showSign = true">
              <span class="btn-icon">✍️</span>
              <span>{{ t('wallet.signTransaction') }}</span>
            </button>
            <p class="hint">{{ t('wallet.signHint') }}</p>
          </div>

          <div v-else class="sign-form">
            <div class="form-group">
              <label>{{ t('wallet.toAddress') }}</label>
              <div class="input-wrapper">
                <input 
                  v-model="toAddress" 
                  @input="validateAddressInput"
                  :class="['input', { 'input-error': !addressValid && toAddress }]"
                  :placeholder="getAddressPlaceholder()"
                  type="text"
                />
                <span v-if="addressValid && toAddress" class="input-valid-icon">✓</span>
                <span v-if="!addressValid && toAddress" class="input-error-icon">✕</span>
              </div>
              <p v-if="addressError" class="hint hint-error">{{ addressError }}</p>
              <p v-else class="hint">{{ getAddressHint() }}</p>
            </div>

            <div class="form-group">
              <label>
                {{ t('wallet.amount') }} 
                <span class="amount-unit">({{ getAmountUnit() }})</span>
              </label>
              <div class="amount-input-wrapper">
                <input 
                  v-model="amount" 
                  class="input input-large"
                  :placeholder="t('wallet.amountPlaceholder')"
                  type="text"
                  inputmode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                />
                <span class="amount-unit-badge">{{ getAmountUnit() }}</span>
              </div>
              <p class="hint">{{ getAmountHint() }}</p>
            </div>

            <!-- 专业功能开关 -->
            <div class="advanced-toggle">
              <label class="toggle-label">
                <input type="checkbox" v-model="showAdvanced" />
                <span>{{ t('wallet.advancedMode') }}</span>
              </label>
              <p class="toggle-hint">{{ t('wallet.advancedHint') }}</p>
            </div>

            <!-- 专业选项 -->
            <div v-if="showAdvanced" class="advanced-options animate-slide-down">
              <!-- ETH/BNB 专业选项 -->
              <template v-if="walletStore.selectedChain === 'ETH' || walletStore.selectedChain === 'BNB'">
                <div class="form-group">
                  <label>{{ t('wallet.gasPrice') }} (Wei)</label>
                  <input 
                    v-model="advancedOptions.gasPrice" 
                    class="input"
                    placeholder="20000000000"
                    type="text"
                  />
                  <p class="hint">{{ t('wallet.gasPriceHint') }}</p>
                </div>

                <div class="form-group">
                  <label>{{ t('wallet.gasLimit') }}</label>
                  <input 
                    v-model="advancedOptions.gasLimit" 
                    class="input"
                    placeholder="21000"
                    type="text"
                  />
                  <p class="hint">{{ t('wallet.gasLimitHint') }}</p>
                </div>

                <div class="form-group">
                  <label>{{ t('wallet.nonce') }}</label>
                  <input 
                    v-model="advancedOptions.nonce" 
                    class="input"
                    placeholder="0"
                    type="text"
                  />
                  <p class="hint">{{ t('wallet.nonceHint') }}</p>
                </div>

                <div class="form-group">
                  <label>{{ t('wallet.data') }} ({{ t('common.optional') }})</label>
                  <input 
                    v-model="advancedOptions.data" 
                    class="input"
                    placeholder="0x..."
                    type="text"
                  />
                  <p class="hint">{{ t('wallet.dataHint') }}</p>
                </div>
              </template>

              <!-- BTC 专业选项 -->
              <template v-else-if="walletStore.selectedChain === 'BTC'">
                <div class="form-group">
                  <label>{{ t('wallet.feeRate') }} (sat/vB)</label>
                  <input 
                    v-model="advancedOptions.gasPrice" 
                    class="input"
                    placeholder="10"
                    type="text"
                  />
                  <p class="hint">{{ t('wallet.feeRateHint') }}</p>
                </div>
              </template>

              <!-- SOL 专业选项 -->
              <template v-else-if="walletStore.selectedChain === 'SOL'">
                <div class="form-group">
                  <label>{{ t('wallet.recentBlockhash') }}</label>
                  <input 
                    v-model="advancedOptions.data" 
                    class="input"
                    placeholder="Base58 blockhash..."
                    type="text"
                  />
                  <p class="hint">{{ t('wallet.recentBlockhashHint') }}</p>
                </div>
              </template>

              <!-- TRON 专业选项 -->
              <template v-else-if="walletStore.selectedChain === 'TRON'">
                <div class="form-group">
                  <label>{{ t('wallet.gasPrice') }} (SUN)</label>
                  <input 
                    v-model="advancedOptions.gasPrice" 
                    class="input"
                    placeholder="420"
                    type="text"
                  />
                  <p class="hint">{{ t('wallet.tronGasPriceHint') }}</p>
                </div>

                <div class="form-group">
                  <label>{{ t('wallet.gasLimit') }}</label>
                  <input 
                    v-model="advancedOptions.gasLimit" 
                    class="input"
                    placeholder="21000"
                    type="text"
                  />
                  <p class="hint">{{ t('wallet.tronGasLimitHint') }}</p>
                </div>
              </template>
            </div>

            <button class="btn btn-primary" @click="signTransaction">
              <span class="btn-icon">✅</span>
              <span>{{ t('wallet.confirmSign') }}</span>
            </button>

            <button class="btn btn-ghost" @click="showSign = false">
              <span>{{ t('common.cancel') }}</span>
            </button>

            <!-- 签名结果 -->
            <div v-if="signResult" class="result-box">
              <h4 class="result-title">✅ {{ t('wallet.signSuccess') }}</h4>
              
              <div class="result-item">
                <p class="label">{{ t('wallet.signedData') }}</p>
                <textarea 
                  :value="signResult" 
                  readonly 
                  class="result-text"
                  rows="3"
                ></textarea>
                <button class="btn btn-secondary btn-sm" @click="copy(signResult, t('wallet.signedData'))">
                  {{ t('common.copy') }}
                </button>
              </div>

              <div v-if="qrCode" class="qr-box">
                <p class="label">{{ t('wallet.qrCode') }}</p>
                <img :src="qrCode" class="qr-img" :alt="t('wallet.qrCode')" />
                <p class="hint">{{ t('wallet.qrCodeHint') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 通知 -->
    <ToastContainer />

    <!-- 加载遮罩 -->
    <div v-if="uiStore.isLoading" class="loading">
      <div class="spinner"></div>
      <p v-if="uiStore.loadingMessage">{{ uiStore.loadingMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
/* ==================== 全局样式 ==================== */
.app {
  min-height: 100vh;
  background: linear-gradient(180deg, 
    rgb(255, 0, 122) 0%, 
    rgb(255, 135, 211) 50%,
    rgb(138, 99, 210) 100%
  );
  padding: 1rem;
  position: relative;
}

.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 2rem 0;
}

/* ==================== 动画 ==================== */
.fade-in {
  animation: fadeIn 0.4s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
  }
}

/* ==================== 语言切换 ==================== */
.lang-switcher {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 100;
}

/* ==================== Hero 区域 ==================== */
.hero {
  text-align: center;
  color: white;
  margin-bottom: 3rem;
}

.title {
  font-size: 5rem;
  margin: 0;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.subtitle {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0.5rem 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.description {
  font-size: 1.125rem;
  opacity: 0.9;
  margin: 0;
}

/* ==================== 卡片 ==================== */
.card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.card-content {
  padding: 2rem;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: #1a1a1a;
}

.card-desc {
  color: #666;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

/* ==================== 按钮 ==================== */
.btn {
  width: 100%;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.btn-primary {
  background: linear-gradient(135deg, rgb(255, 0, 122), rgb(255, 100, 180));
  color: white;
  box-shadow: 0 4px 12px rgba(255, 0, 122, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 0, 122, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-ghost {
  background: transparent;
  color: #666;
}

.btn-ghost:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-icon {
  font-size: 1.25em;
}

.btn-icon-only {
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-only:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* ==================== 分割线 ==================== */
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #999;
  margin: 1.5rem 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.divider span {
  padding: 0 1rem;
  font-size: 0.875rem;
}

/* ==================== 导入区域 ==================== */
.import-section {
  margin-top: 1rem;
}

.input-area {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  font-family: monospace;
  resize: none;
  transition: border-color 0.2s;
  margin-bottom: 0.75rem;
}

.input-area:focus {
  outline: none;
  border-color: rgb(255, 0, 122);
}

/* ==================== 提示 ==================== */
.tips {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 1rem 1.5rem;
  text-align: center;
}

.tips p {
  margin: 0;
  color: #666;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* ==================== 助记词数量选择器 ==================== */
.word-count-selector {
  margin: 1.5rem 0;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f8f9ff, #fff5f8);
  border-radius: 16px;
  border: 2px solid rgba(255, 0, 122, 0.1);
}

.selector-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  margin: 0 0 0.75rem 0;
  text-align: center;
}

.selector-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.selector-btn {
  padding: 1rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.selector-btn:hover {
  border-color: rgb(255, 100, 180);
  background: #fff5f8;
  transform: translateY(-2px);
}

.selector-btn.active {
  border-color: rgb(255, 0, 122);
  background: linear-gradient(135deg, rgb(255, 0, 122), rgb(255, 100, 180));
  color: white;
  box-shadow: 0 4px 12px rgba(255, 0, 122, 0.3);
}

.selector-btn.active .selector-hint {
  color: rgba(255, 255, 255, 0.9);
}

.selector-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: #999;
}

/* ==================== 助记词盒子 ==================== */
.mnemonic-box {
  background: linear-gradient(135deg, #ffeef8, #f0e6ff);
  border-radius: 16px;
  padding: 2rem;
  margin: 1.5rem 0;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mnemonic-hidden {
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.mnemonic-hidden:hover {
  transform: scale(1.05);
}

.mnemonic-hidden .icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.mnemonic-hidden p {
  margin: 0;
  color: #666;
  font-weight: 600;
}

.mnemonic-count {
  margin-top: 0.5rem !important;
  font-size: 0.875rem !important;
  color: #999 !important;
  font-weight: 400 !important;
}

.mnemonic-words {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  width: 100%;
}

.mnemonic-words.words-24 {
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.word {
  background: white;
  padding: 0.75rem;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.words-24 .word {
  padding: 0.5rem;
  font-size: 0.75rem;
}

.word-num {
  font-size: 0.75rem;
  color: #999;
  font-weight: 400;
}

/* ==================== 警告盒子 ==================== */
.warning-box {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 12px;
  padding: 1rem;
  margin: 1.5rem 0;
}

.warning-box p {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: #856404;
}

.warning-box ul {
  margin: 0;
  padding-left: 1.5rem;
}

.warning-box li {
  color: #856404;
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

/* ==================== 复选框 ==================== */
.checkbox {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  cursor: pointer;
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f8f8f8;
  border-radius: 12px;
}

.checkbox input {
  margin-top: 0.25rem;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.checkbox span {
  flex: 1;
  line-height: 1.5;
  color: #333;
}

/* ==================== 钱包头部 ==================== */
.wallet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  color: white;
}

.wallet-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

/* ==================== 链选择器 ==================== */
.chain-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.chain-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.chain-btn:hover {
  border-color: rgb(255, 100, 180);
  background: #fff5f8;
  transform: translateY(-2px);
}

.chain-btn.active {
  border-color: rgb(255, 0, 122);
  background: linear-gradient(135deg, rgb(255, 0, 122), rgb(255, 100, 180));
  color: white;
  box-shadow: 0 4px 12px rgba(255, 0, 122, 0.3);
  transform: scale(1.05);
}

.chain-icon {
  font-size: 1.5rem;
}

.chain-name {
  font-weight: 600;
  font-size: 0.75rem;
}

/* ==================== 地址显示 ==================== */
.address-section {
  text-align: center;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.address-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-toggle-addresses {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-toggle-addresses:hover {
  background: rgba(255, 255, 255, 0.3);
}

.all-addresses {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.address-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: #f8f8f8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.address-item:hover {
  background: #f0f0f0;
  transform: translateX(4px);
}

.address-item-active {
  background: linear-gradient(135deg, rgba(255, 0, 122, 0.1), rgba(255, 100, 180, 0.1));
  border: 2px solid rgb(255, 0, 122);
}

.address-item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.address-item-icon {
  font-size: 1.25rem;
}

.address-item-chain {
  font-weight: 600;
  font-size: 0.875rem;
  color: #333;
}

.address-item-value {
  display: block;
  font-size: 0.75rem;
  word-break: break-all;
  margin-bottom: 0.5rem;
  color: #666;
}

.btn-copy-small {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-copy-small:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}

.chain-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.chain-badge-icon {
  font-size: 1rem;
}

.label {
  font-size: 0.875rem;
  color: #999;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.address-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8f8f8;
  padding: 1rem;
  border-radius: 12px;
  margin: 0.5rem 0;
}

.address {
  flex: 1;
  font-family: monospace;
  font-size: 0.75rem;
  word-break: break-all;
  color: #333;
}

.btn-copy {
  background: white;
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-copy:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}

.hint {
  font-size: 0.875rem;
  color: #999;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
}

/* ==================== 表单 ==================== */
.sign-form {
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

/* ==================== 专业功能开关 ==================== */
.advanced-toggle {
  margin: 1.5rem 0;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9ff, #fff5f8);
  border-radius: 12px;
  border: 2px solid rgba(255, 0, 122, 0.1);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.toggle-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  margin: 0;
}

.toggle-hint {
  margin: 0;
  font-size: 0.875rem;
  color: #666;
  line-height: 1.5;
}

/* ==================== 专业选项 ==================== */
.advanced-options {
  margin: 1rem 0;
  padding: 1.5rem;
  background: #f8f8f8;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
}

.advanced-options .form-group {
  margin-bottom: 1.25rem;
}

.advanced-options .form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-large {
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.amount-unit {
  font-size: 0.875rem;
  font-weight: 400;
  color: #999;
}

.amount-input-wrapper {
  position: relative;
}

.amount-unit-badge {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(255, 0, 122);
  pointer-events: none;
}

.input:focus {
  outline: none;
  border-color: rgb(255, 0, 122);
}

.input-error {
  border-color: var(--color-error) !important;
}

.input-wrapper {
  position: relative;
}

.input-valid-icon,
.input-error-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  pointer-events: none;
}

.input-valid-icon {
  color: var(--color-success);
}

.input-error-icon {
  color: var(--color-error);
}

.hint-error {
  color: var(--color-error);
  font-weight: 500;
}

/* ==================== 结果显示 ==================== */
.result-box {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f0fff4;
  border: 2px solid #10b981;
  border-radius: 16px;
}

.result-title {
  margin: 0 0 1rem 0;
  color: #10b981;
  font-size: 1.25rem;
}

.result-item {
  margin: 1rem 0;
}

.result-text {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.75rem;
  resize: none;
  background: white;
  margin: 0.5rem 0;
}

/* ==================== 二维码 ==================== */
.qr-box {
  margin-top: 1.5rem;
  text-align: center;
}

.qr-img {
  max-width: 250px;
  width: 100%;
  border-radius: 12px;
  margin: 1rem auto;
  display: block;
}

/* ==================== 加载动画 ==================== */
.loading {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 1000;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading p {
  color: white;
  font-size: 1.125rem;
}

/* ==================== 响应式 ==================== */
@media (max-width: 640px) {
  .container {
    padding: 1rem 0;
  }

  .card-content {
    padding: 1.5rem;
  }

  .mnemonic-words {
    grid-template-columns: repeat(2, 1fr);
  }

  .mnemonic-words.words-24 {
    grid-template-columns: repeat(3, 1fr);
  }

  .title {
    font-size: 4rem;
  }

  .subtitle {
    font-size: 2rem;
  }
  
  .selector-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
