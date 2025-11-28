<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NCard, NButton, NInput, NCollapse, NCollapseItem, NText, NAlert, NImage } from 'naive-ui';
import { useWalletStore, type ChainType } from '../../stores/wallet';
import { useUIStore } from '../../stores/ui';
import { invoke } from '@tauri-apps/api/core';

const { t } = useI18n();
const walletStore = useWalletStore();
const uiStore = useUIStore();

const showForm = ref(false);
const toAddress = ref('');
const amount = ref('');
const signResult = ref('');
const qrCode = ref('');
const addressValid = ref(true);
const addressError = ref('');
const showAdvanced = ref(false);
const expandedNames = computed({
  get: () => showAdvanced.value ? ['advanced'] : [],
  set: (val) => {
    showAdvanced.value = val.includes('advanced');
  }
});

const advancedOptions = ref({
  gasPrice: '20000000000',
  gasLimit: '21000',
  nonce: '0',
  data: '',
});


// 安全输入验证 - 防止XSS和注入攻击
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"']/g, '');
}

function validateAddressFormat(address: string, chain: ChainType): boolean {
  const sanitized = sanitizeInput(address);
  
  if (chain === 'ETH' || chain === 'BNB') {
    return /^0x[a-fA-F0-9]{40}$/.test(sanitized);
  } else if (chain === 'BTC') {
    return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(sanitized);
  } else if (chain === 'SOL') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(sanitized);
  } else if (chain === 'TRON') {
    return /^T[A-Za-z1-9]{33}$/.test(sanitized);
  }
  return false;
}

function validateAmount(amountStr: string): boolean {
  const sanitized = sanitizeInput(amountStr);
  const num = parseFloat(sanitized);
  return !isNaN(num) && num > 0 && isFinite(num);
}

function validateHexData(data: string): boolean {
  if (!data.trim()) return true;
  const sanitized = sanitizeInput(data);
  return /^0x[a-fA-F0-9]*$/.test(sanitized);
}

// 实时验证地址
async function validateAddressInput() {
  const address = sanitizeInput(toAddress.value);
  if (!address) {
    addressValid.value = true;
    addressError.value = '';
    return;
  }

  // 格式验证
  if (!validateAddressFormat(address, walletStore.selectedChain)) {
    addressValid.value = false;
    addressError.value = t('messages.invalidAddress');
    return;
  }

  // 后端验证
  try {
    const isValid = await invoke<boolean>('validate_address_cmd', {
      chain: walletStore.selectedChain,
      address: address,
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

watch(() => walletStore.selectedChain, () => {
  toAddress.value = '';
  amount.value = '';
  addressValid.value = true;
  addressError.value = '';
  signResult.value = '';
  qrCode.value = '';
});

function getAmountUnit(): string {
  const chain = walletStore.selectedChain;
  if (chain === 'BTC') return 'BTC';
  if (chain === 'SOL') return 'SOL';
  if (chain === 'TRON') return 'TRX';
  return 'ETH';
}

function getAddressPlaceholder(): string {
  const chain = walletStore.selectedChain;
  if (chain === 'BTC') return 'bc1... 或 1... 或 3...';
  if (chain === 'SOL') return 'Base58 地址...';
  if (chain === 'TRON') return 'T...';
  return '0x...';
}

function getAddressHint(): string {
  const chain = walletStore.selectedChain;
  if (chain === 'BTC') return '支持 Legacy、SegWit、Native SegWit 地址';
  if (chain === 'SOL') return 'Solana 地址（Base58 编码）';
  if (chain === 'TRON') return 'Tron 地址（T 开头）';
  return '以太坊地址（0x 开头，42字符）';
}

function getAmountHint(): string {
  const chain = walletStore.selectedChain;
  if (chain === 'BTC') return '例如：0.001 表示转账 0.001 个 BTC';
  if (chain === 'SOL') return '例如：1.5 表示转账 1.5 个 SOL';
  if (chain === 'TRON') return '例如：100 表示转账 100 个 TRX';
  return '例如：0.1 表示转账 0.1 个 ETH';
}

async function signTransaction() {
  const chain = walletStore.selectedChain;
  
  // 安全验证：清理输入
  const address = sanitizeInput(toAddress.value);
  const amountStr = sanitizeInput(amount.value);
  
  if (!address) {
    uiStore.showError(t('wallet.toAddress') + ' ' + t('common.required'));
    return;
  }
  
  if (!amountStr) {
    uiStore.showError(t('wallet.amount') + ' ' + t('common.required'));
    return;
  }
  
  // 格式验证
  if (!validateAddressFormat(address, chain)) {
    uiStore.showError(t('messages.invalidAddress'));
    return;
  }
  
  if (!validateAmount(amountStr)) {
    uiStore.showError(t('messages.invalidAmount'));
    return;
  }
  
  const amountNum = parseFloat(amountStr);
  
  // 高级选项验证
  if (showAdvanced.value) {
    if (chain === 'ETH' || chain === 'BNB') {
      if (advancedOptions.value.data && !validateHexData(advancedOptions.value.data)) {
        uiStore.showError(t('wallet.data') + ' ' + t('messages.invalidFormat'));
        return;
      }
    }
  }

  try {
    uiStore.showLoading(t('common.loading'));
    
    // 双重验证地址
    const isValidAddress = await invoke<boolean>('validate_address_cmd', {
      chain: chain,
      address: address,
    });
    
    if (!isValidAddress) {
      uiStore.showError(t('messages.invalidAddress'));
      addressValid.value = false;
      return;
    }
    
    let result: { raw_transaction: string; transaction_hash: string };
    
    if (chain === 'ETH' || chain === 'BNB') {
      const valueInWei = (amountNum * 1e18).toString();
      const gasPrice = showAdvanced.value && advancedOptions.value.gasPrice.trim() 
        ? sanitizeInput(advancedOptions.value.gasPrice.trim())
        : '20000000000';
      const gasLimit = showAdvanced.value && advancedOptions.value.gasLimit.trim() 
        ? sanitizeInput(advancedOptions.value.gasLimit.trim())
        : '21000';
      const nonce = showAdvanced.value && advancedOptions.value.nonce.trim() 
        ? sanitizeInput(advancedOptions.value.nonce.trim())
        : '0';
      const data = showAdvanced.value && advancedOptions.value.data.trim() 
        ? sanitizeInput(advancedOptions.value.data.trim())
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
      const feeRate = showAdvanced.value && advancedOptions.value.gasPrice.trim()
        ? sanitizeInput(advancedOptions.value.gasPrice.trim())
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
      const recentBlockhash = showAdvanced.value && advancedOptions.value.data.trim()
        ? sanitizeInput(advancedOptions.value.data.trim())
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
      
      result = {
        raw_transaction: solResult.raw_transaction,
        transaction_hash: solResult.signature,
      };
    } else if (chain === 'TRON') {
      const gasPrice = showAdvanced.value && advancedOptions.value.gasPrice.trim()
        ? sanitizeInput(advancedOptions.value.gasPrice.trim())
        : undefined;
      const gasLimit = showAdvanced.value && advancedOptions.value.gasLimit.trim()
        ? sanitizeInput(advancedOptions.value.gasLimit.trim())
        : undefined;
      
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

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    uiStore.showSuccess(`${label} ${t('common.copy')} ${t('common.success')}`);
  });
}

function resetForm() {
  showForm.value = false;
  toAddress.value = '';
  amount.value = '';
  signResult.value = '';
  qrCode.value = '';
  addressValid.value = true;
  addressError.value = '';
  showAdvanced.value = false;
}
</script>

<template>
  <div class="transaction-container">
    <div v-if="!showForm" class="send-init">
      <n-button
        type="info"
        size="large"
        block
        class="send-button"
        @click="showForm = true"
      >
        {{ t('wallet.send') }}
      </n-button>
      <n-text depth="3" class="hint">{{ t('wallet.signHint') }}</n-text>
    </div>

    <n-card v-else class="transaction-card">
      <div class="sign-form">
      <div class="form-group">
        <n-input
          v-model:value="toAddress"
          :placeholder="getAddressPlaceholder()"
          :status="addressValid || !toAddress ? undefined : 'error'"
          @input="validateAddressInput"
          autocomplete="off"
          spellcheck="false"
        />
        <n-text v-if="addressError" type="error" class="error-text">{{ addressError }}</n-text>
        <n-text v-else depth="3" class="hint">{{ getAddressHint() }}</n-text>
      </div>

      <div class="form-group">
        <n-input
          v-model:value="amount"
          :placeholder="t('wallet.amountPlaceholder')"
          type="text"
          inputmode="decimal"
          autocomplete="off"
        >
          <template #suffix>
            <n-text depth="3" class="amount-unit">{{ getAmountUnit() }}</n-text>
          </template>
        </n-input>
        <n-text depth="3" class="hint">{{ getAmountHint() }}</n-text>
      </div>

      <n-collapse v-model:expanded-names="expandedNames">
        <n-collapse-item name="advanced" :title="t('wallet.advancedMode')">
          <n-text depth="3" class="hint">{{ t('wallet.advancedHint') }}</n-text>
          
          <template v-if="walletStore.selectedChain === 'ETH' || walletStore.selectedChain === 'BNB'">
            <div class="form-group">
              <n-input
                v-model:value="advancedOptions.gasPrice"
                :placeholder="'20000000000'"
                autocomplete="off"
                spellcheck="false"
              />
              <n-text depth="3" class="hint">{{ t('wallet.gasPriceHint') }}</n-text>
            </div>
            <div class="form-group">
              <n-input
                v-model:value="advancedOptions.gasLimit"
                :placeholder="'21000'"
                autocomplete="off"
                spellcheck="false"
              />
              <n-text depth="3" class="hint">{{ t('wallet.gasLimitHint') }}</n-text>
            </div>
            <div class="form-group">
              <n-input
                v-model:value="advancedOptions.nonce"
                :placeholder="'0'"
                autocomplete="off"
                spellcheck="false"
              />
              <n-text depth="3" class="hint">{{ t('wallet.nonceHint') }}</n-text>
            </div>
            <div class="form-group">
              <n-input
                v-model:value="advancedOptions.data"
                :placeholder="'0x...'"
                autocomplete="off"
                spellcheck="false"
              />
              <n-text depth="3" class="hint">{{ t('wallet.dataHint') }}</n-text>
            </div>
          </template>

          <template v-else-if="walletStore.selectedChain === 'BTC'">
            <div class="form-group">
              <n-input
                v-model:value="advancedOptions.gasPrice"
                :placeholder="'10'"
                autocomplete="off"
                spellcheck="false"
              />
              <n-text depth="3" class="hint">{{ t('wallet.feeRateHint') }}</n-text>
            </div>
          </template>

          <template v-else-if="walletStore.selectedChain === 'SOL'">
            <div class="form-group">
              <n-input
                v-model:value="advancedOptions.data"
                :placeholder="'Base58 blockhash...'"
                autocomplete="off"
                spellcheck="false"
              />
              <n-text depth="3" class="hint">{{ t('wallet.recentBlockhashHint') }}</n-text>
            </div>
          </template>

          <template v-else-if="walletStore.selectedChain === 'TRON'">
            <div class="form-group">
              <n-input
                v-model:value="advancedOptions.gasPrice"
                :placeholder="'420'"
                autocomplete="off"
                spellcheck="false"
              />
              <n-text depth="3" class="hint">{{ t('wallet.tronGasPriceHint') }}</n-text>
            </div>
            <div class="form-group">
              <n-input
                v-model:value="advancedOptions.gasLimit"
                :placeholder="'21000'"
                autocomplete="off"
                spellcheck="false"
              />
              <n-text depth="3" class="hint">{{ t('wallet.tronGasLimitHint') }}</n-text>
            </div>
          </template>
        </n-collapse-item>
      </n-collapse>

      <n-space vertical :size="12">
        <n-button
          type="info"
          size="large"
          block
          @click="signTransaction"
        >
          {{ t('wallet.confirmSign') }}
        </n-button>
        <n-button
          type="default"
          size="large"
          block
          @click="resetForm"
        >
          {{ t('common.cancel') }}
        </n-button>
      </n-space>

      <div v-if="signResult" class="result-section">
        <n-alert type="success" class="success-alert">
          {{ t('wallet.signSuccess') }}
        </n-alert>
        
        <div class="result-item">
          <n-text strong class="result-label">{{ t('wallet.signedData') }}</n-text>
          <n-input
            :value="signResult"
            type="textarea"
            readonly
            :rows="3"
            class="result-text"
          />
          <n-button
            type="default"
            size="small"
            block
            @click="copy(signResult, t('wallet.signedData'))"
          >
            {{ t('common.copy') }}
          </n-button>
        </div>

        <div v-if="qrCode" class="qr-section">
          <n-text strong class="result-label">{{ t('wallet.qrCode') }}</n-text>
          <n-image :src="qrCode" class="qr-image" />
          <n-text depth="3" class="hint">{{ t('wallet.qrCodeHint') }}</n-text>
        </div>
      </div>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.transaction-container {
  width: 100%;
}

.send-init {
  text-align: center;
  padding: var(--apple-spacing-xl) 0;
}

.send-button {
  margin-bottom: var(--apple-spacing-md);
  height: 48px;
  font-size: var(--apple-font-size-body);
  font-weight: var(--apple-font-weight-semibold);
}

.transaction-card {
  border-radius: var(--apple-radius-lg);
}

.hint {
  display: block;
  font-size: var(--apple-font-size-caption-1);
  margin-top: var(--apple-spacing-xs);
  line-height: 1.5;
}

.sign-form {
  margin-top: var(--apple-spacing-lg);
}

.form-group {
  margin-bottom: var(--apple-spacing-lg);
}

.error-text {
  display: block;
  font-size: var(--apple-font-size-caption-1);
  margin-top: var(--apple-spacing-xs);
}

.amount-unit {
  font-size: var(--apple-font-size-caption-1);
  padding-right: var(--apple-spacing-xs);
}

.result-section {
  margin-top: var(--apple-spacing-xl);
  padding-top: var(--apple-spacing-lg);
  border-top: 0.5px solid var(--apple-separator);
}

.success-alert {
  margin-bottom: var(--apple-spacing-lg);
}

.result-item {
  margin-bottom: var(--apple-spacing-lg);
}

.result-label {
  display: block;
  font-size: var(--apple-font-size-subheadline);
  margin-bottom: var(--apple-spacing-sm);
}

.result-text {
  margin-bottom: var(--apple-spacing-sm);
  font-family: var(--apple-font-mono);
}

.qr-section {
  text-align: center;
}

.qr-image {
  max-width: 250px;
  width: 100%;
  border-radius: var(--apple-radius-md);
  margin: var(--apple-spacing-md) 0;
}
</style>

