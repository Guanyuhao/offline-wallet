<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  NCard,
  NButton,
  NInput,
  NCollapse,
  NCollapseItem,
  NText,
  NAlert,
  NForm,
  NFormItem,
  NSpace,
  useDialog,
} from 'naive-ui';
import { useWalletStore, type ChainType } from '../../stores/wallet';
import { useUIStore } from '../../stores/ui';
import { invoke } from '@tauri-apps/api/core';
import { getFriendlyErrorMessage } from '../../utils/errorHandler';
import QRCodeWithLogo from '../common/QRCodeWithLogo.vue';

defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
const walletStore = useWalletStore();
const uiStore = useUIStore();
const dialog = useDialog();

const signResult = ref('');
const qrCodeData = ref('');
const showAdvanced = ref(false);
const expandedNames = computed({
  get: () => (showAdvanced.value ? ['advanced'] : []),
  set: (val) => {
    showAdvanced.value = val.includes('advanced');
  },
});

const formRef = ref();
const formRules = computed(() => {
  const chain = walletStore.selectedChain;
  const rules: any = {
    toAddress: [
      {
        required: true,
        message: `${t('wallet.toAddress')} ${t('common.required')}`,
        trigger: ['input', 'blur'],
      },
      {
        validator: async (_rule: any, value: string): Promise<void> => {
          if (!value) return;
          const sanitized = sanitizeInput(value);
          if (!validateAddressFormat(sanitized, chain)) {
            throw new Error(t('messages.invalidAddress'));
          }
          // 后端验证
          try {
            const isValid = await invoke<boolean>('validate_address_cmd', {
              chain,
              address: sanitized,
            });
            if (!isValid) {
              throw new Error(t('messages.invalidAddress'));
            }
          } catch (error) {
            throw new Error(getFriendlyErrorMessage(error, t));
          }
        },
        trigger: ['input', 'blur'],
      },
    ],
    amount: [
      {
        required: true,
        message: `${t('wallet.amount')} ${t('common.required')}`,
        trigger: ['input', 'blur'],
      },
      {
        validator: (_rule: any, value: string): void => {
          if (!value) return;
          const sanitized = sanitizeInput(value);
          if (!validateAmount(sanitized)) {
            throw new Error(t('messages.invalidAmount'));
          }
        },
        trigger: ['input', 'blur'],
      },
    ],
  };

  // 高级模式验证规则
  if (showAdvanced.value) {
    if (chain === 'ETH' || chain === 'BNB') {
      rules.gasPrice = [
        {
          validator: (_rule: any, value: string): void => {
            if (!value || !value.trim()) return;
            const sanitized = sanitizeInput(value.trim());
            if (!/^\d+$/.test(sanitized)) {
              throw new Error(t('messages.invalidFormat'));
            }
          },
          trigger: ['input', 'blur'],
        },
      ];
      rules.gasLimit = [
        {
          validator: (_rule: any, value: string): void => {
            if (!value || !value.trim()) return;
            const sanitized = sanitizeInput(value.trim());
            if (!/^\d+$/.test(sanitized)) {
              throw new Error(t('messages.invalidFormat'));
            }
          },
          trigger: ['input', 'blur'],
        },
      ];
      rules.nonce = [
        {
          validator: (_rule: any, value: string): void => {
            if (!value || !value.trim()) return;
            const sanitized = sanitizeInput(value.trim());
            if (!/^\d+$/.test(sanitized)) {
              throw new Error(t('messages.invalidFormat'));
            }
          },
          trigger: ['input', 'blur'],
        },
      ];
      rules.data = [
        {
          validator: (_rule: any, value: string): void => {
            if (!value || !value.trim()) return;
            const sanitized = sanitizeInput(value.trim());
            if (!validateHexData(sanitized)) {
              throw new Error(t('messages.invalidFormat'));
            }
          },
          trigger: ['input', 'blur'],
        },
      ];
    }
  }

  return rules;
});

const formModel = ref({
  toAddress: '',
  amount: '',
  gasPrice: '20000000000',
  gasLimit: '21000',
  nonce: '0',
  data: '',
});

// 安全输入验证 - 防止XSS和注入攻击
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>"']/g, '');
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

watch(
  () => walletStore.selectedChain,
  () => {
    formModel.value.toAddress = '';
    formModel.value.amount = '';
    signResult.value = '';
    qrCodeData.value = '';
    formRef.value?.restoreValidation();
  }
);

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
  try {
    // Form 验证
    await formRef.value?.validate();
  } catch (error) {
    // 验证失败，Form 组件会自动显示错误信息
    return;
  }

  // 检查钱包是否锁定
  if (walletStore.isLocked) {
    dialog.warning({
      title: t('security.mnemonicRequired'),
      content: t('security.mnemonicRequiredDesc') || '钱包已锁定，请先解锁钱包',
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
    });
    return;
  }

  const chain = walletStore.selectedChain;

  // 安全验证：清理输入
  const address = sanitizeInput(formModel.value.toAddress);
  const amountStr = sanitizeInput(formModel.value.amount);
  const amountNum = parseFloat(amountStr);

  try {
    uiStore.showLoading(t('common.loading'));

    let result: { raw_transaction: string; transaction_hash: string };

    if (chain === 'ETH' || chain === 'BNB') {
      const valueInWei = (amountNum * 1e18).toString();
      const gasPrice =
        showAdvanced.value && formModel.value.gasPrice.trim()
          ? sanitizeInput(formModel.value.gasPrice.trim())
          : '20000000000';
      const gasLimit =
        showAdvanced.value && formModel.value.gasLimit.trim()
          ? sanitizeInput(formModel.value.gasLimit.trim())
          : '21000';
      const nonce =
        showAdvanced.value && formModel.value.nonce.trim()
          ? sanitizeInput(formModel.value.nonce.trim())
          : '0';
      const data =
        showAdvanced.value && formModel.value.data.trim()
          ? sanitizeInput(formModel.value.data.trim())
          : undefined;

      // 获取助记词（从加密内存）
      const { mnemonic: mnemonicVal, passphrase: passphraseVal } =
        await walletStore.getMnemonicForSigning();

      if (chain === 'ETH') {
        result = await invoke<{ raw_transaction: string; transaction_hash: string }>(
          'sign_eth_transaction_cmd',
          {
            mnemonic: mnemonicVal,
            passphrase: passphraseVal || null,
            index: 0,
            transaction: {
              to: address,
              value: valueInWei,
              gas_price: gasPrice,
              gas_limit: gasLimit,
              nonce,
              data,
            },
          }
        );
      } else {
        result = await invoke<{ raw_transaction: string; transaction_hash: string }>(
          'sign_bnb_transaction_cmd',
          {
            mnemonic: mnemonicVal,
            passphrase: passphraseVal || null,
            index: 0,
            transaction: {
              to: address,
              value: valueInWei,
              gas_price: gasPrice,
              gas_limit: gasLimit,
              nonce,
              data,
            },
          }
        );
      }
    } else if (chain === 'BTC') {
      const feeRate =
        showAdvanced.value && formModel.value.gasPrice.trim()
          ? sanitizeInput(formModel.value.gasPrice.trim())
          : undefined;

      // 获取助记词（从加密内存）
      const { mnemonic: mnemonicVal, passphrase: passphraseVal } =
        await walletStore.getMnemonicForSigning();

      result = await invoke<{ raw_transaction: string; transaction_hash: string }>(
        'sign_btc_transaction_cmd',
        {
          mnemonic: mnemonicVal,
          passphrase: passphraseVal || null,
          index: 0,
          transaction: {
            to: address,
            amount: amountNum.toFixed(8),
            fee_rate: feeRate,
          },
        }
      );
    } else if (chain === 'SOL') {
      const recentBlockhash =
        showAdvanced.value && formModel.value.data.trim()
          ? sanitizeInput(formModel.value.data.trim())
          : undefined;

      // 获取助记词（从加密内存）
      const { mnemonic: mnemonicVal, passphrase: passphraseVal } =
        await walletStore.getMnemonicForSigning();

      const solResult = await invoke<{ raw_transaction: string; signature: string }>(
        'sign_sol_transaction_cmd',
        {
          mnemonic: mnemonicVal,
          passphrase: passphraseVal || null,
          index: 0,
          transaction: {
            to: address,
            amount: amountNum.toString(),
            recent_blockhash: recentBlockhash,
          },
        }
      );

      result = {
        raw_transaction: solResult.raw_transaction,
        transaction_hash: solResult.signature,
      };
    } else if (chain === 'TRON') {
      const gasPrice =
        showAdvanced.value && formModel.value.gasPrice.trim()
          ? sanitizeInput(formModel.value.gasPrice.trim())
          : undefined;
      const gasLimit =
        showAdvanced.value && formModel.value.gasLimit.trim()
          ? sanitizeInput(formModel.value.gasLimit.trim())
          : undefined;

      const valueInSun = (amountNum * 1e6).toString();

      // 获取助记词（从加密内存）
      const { mnemonic: mnemonicVal, passphrase: passphraseVal } =
        await walletStore.getMnemonicForSigning();

      result = await invoke<{ raw_transaction: string; transaction_hash: string }>(
        'sign_tron_transaction_cmd',
        {
          mnemonic: mnemonicVal,
          passphrase: passphraseVal || null,
          index: 0,
          transaction: {
            to: address,
            value: valueInSun,
            gas_price: gasPrice,
            gas_limit: gasLimit,
          },
        }
      );
    } else {
      throw new Error('Unsupported chain');
    }

    signResult.value = result.raw_transaction;

    // 生成二维码数据，QRCodeWithLogo 组件会调用 Rust 后端生成
    qrCodeData.value = result.raw_transaction;

    uiStore.showSuccess(t('messages.signSuccess'));
  } catch (error) {
    uiStore.showError(`${t('messages.signFailed')}: ${error}`);
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
  formModel.value = {
    toAddress: '',
    amount: '',
    gasPrice: '20000000000',
    gasLimit: '21000',
    nonce: '0',
    data: '',
  };
  signResult.value = '';
  qrCodeData.value = '';
  showAdvanced.value = false;
  formRef.value?.restoreValidation();
}
</script>

<template>
  <div class="transaction-container">
    <NCard class="transaction-card">
      <NForm
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        :show-label="false"
        :show-feedback="true"
        class="sign-form"
      >
        <NFormItem path="toAddress" class="form-group">
          <NInput
            v-model:value="formModel.toAddress"
            :placeholder="getAddressPlaceholder()"
            autocomplete="off"
            spellcheck="false"
            clearable
          />
          <template #feedback>
            <NText depth="3" class="hint">{{ getAddressHint() }}</NText>
          </template>
        </NFormItem>

        <NFormItem path="amount" class="form-group">
          <NInput
            v-model:value="formModel.amount"
            :placeholder="t('wallet.amountPlaceholder')"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            clearable
          >
            <template #suffix>
              <NText depth="3" class="amount-unit">{{ getAmountUnit() }}</NText>
            </template>
          </NInput>
          <template #feedback>
            <NText depth="3" class="hint">{{ getAmountHint() }}</NText>
          </template>
        </NFormItem>

        <NCollapse v-model:expanded-names="expandedNames">
          <NCollapseItem name="advanced" :title="t('wallet.advancedMode')">
            <NText depth="3" class="hint">{{ t('wallet.advancedHint') }}</NText>

            <template
              v-if="walletStore.selectedChain === 'ETH' || walletStore.selectedChain === 'BNB'"
            >
              <NFormItem path="gasPrice" class="form-group">
                <NInput
                  v-model:value="formModel.gasPrice"
                  :placeholder="'20000000000'"
                  autocomplete="off"
                  spellcheck="false"
                />
                <template #feedback>
                  <NText depth="3" class="hint">{{ t('wallet.gasPriceHint') }}</NText>
                </template>
              </NFormItem>
              <NFormItem path="gasLimit" class="form-group">
                <NInput
                  v-model:value="formModel.gasLimit"
                  :placeholder="'21000'"
                  autocomplete="off"
                  spellcheck="false"
                />
                <template #feedback>
                  <NText depth="3" class="hint">{{ t('wallet.gasLimitHint') }}</NText>
                </template>
              </NFormItem>
              <NFormItem path="nonce" class="form-group">
                <NInput
                  v-model:value="formModel.nonce"
                  :placeholder="'0'"
                  autocomplete="off"
                  spellcheck="false"
                />
                <template #feedback>
                  <NText depth="3" class="hint">{{ t('wallet.nonceHint') }}</NText>
                </template>
              </NFormItem>
              <NFormItem path="data" class="form-group">
                <NInput
                  v-model:value="formModel.data"
                  :placeholder="'0x...'"
                  autocomplete="off"
                  spellcheck="false"
                />
                <template #feedback>
                  <NText depth="3" class="hint">{{ t('wallet.dataHint') }}</NText>
                </template>
              </NFormItem>
            </template>

            <template v-else-if="walletStore.selectedChain === 'BTC'">
              <NFormItem path="gasPrice" class="form-group">
                <NInput
                  v-model:value="formModel.gasPrice"
                  :placeholder="'10'"
                  autocomplete="off"
                  spellcheck="false"
                />
                <template #feedback>
                  <NText depth="3" class="hint">{{ t('wallet.feeRateHint') }}</NText>
                </template>
              </NFormItem>
            </template>

            <template v-else-if="walletStore.selectedChain === 'SOL'">
              <NFormItem path="data" class="form-group">
                <NInput
                  v-model:value="formModel.data"
                  :placeholder="'Base58 blockhash...'"
                  autocomplete="off"
                  spellcheck="false"
                />
                <template #feedback>
                  <NText depth="3" class="hint">{{ t('wallet.recentBlockhashHint') }}</NText>
                </template>
              </NFormItem>
            </template>

            <template v-else-if="walletStore.selectedChain === 'TRON'">
              <NFormItem path="gasPrice" class="form-group">
                <NInput
                  v-model:value="formModel.gasPrice"
                  :placeholder="'420'"
                  autocomplete="off"
                  spellcheck="false"
                />
                <template #feedback>
                  <NText depth="3" class="hint">{{ t('wallet.tronGasPriceHint') }}</NText>
                </template>
              </NFormItem>
              <NFormItem path="gasLimit" class="form-group">
                <NInput
                  v-model:value="formModel.gasLimit"
                  :placeholder="'21000'"
                  autocomplete="off"
                  spellcheck="false"
                />
                <template #feedback>
                  <NText depth="3" class="hint">{{ t('wallet.tronGasLimitHint') }}</NText>
                </template>
              </NFormItem>
            </template>
          </NCollapseItem>
        </NCollapse>

        <NSpace vertical :size="12">
          <NButton type="info" size="large" block @click="signTransaction">
            {{ t('wallet.confirmSign') }}
          </NButton>
          <NButton type="default" size="large" block @click="resetForm">
            {{ t('common.cancel') }}
          </NButton>
        </NSpace>

        <div v-if="signResult" class="result-section">
          <NAlert type="success" class="success-alert">
            {{ t('wallet.signSuccess') }}
          </NAlert>

          <div class="result-item">
            <NText strong class="result-label">{{ t('wallet.signedData') }}</NText>
            <NInput :value="signResult" type="textarea" readonly :rows="3" class="result-text" />
            <NButton
              type="default"
              size="small"
              block
              @click="copy(signResult, t('wallet.signedData'))"
            >
              {{ t('common.copy') }}
            </NButton>
          </div>

          <div v-if="qrCodeData" class="qr-section">
            <NText strong class="result-label">{{ t('wallet.qrCode') }}</NText>
            <div class="qr-code-wrapper">
              <QRCodeWithLogo :value="qrCodeData" :size="280" />
            </div>
            <NText depth="3" class="hint">{{ t('wallet.qrCodeHint') }}</NText>
          </div>
        </div>
      </NForm>
    </NCard>
  </div>
</template>

<style scoped>
.transaction-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
}

.transaction-card {
  border-radius: var(--apple-radius-lg);
  box-shadow: none;
  border: none;
  background: transparent;
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
  margin-bottom: var(--apple-spacing-md);
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
  margin-top: var(--apple-spacing-lg);
  padding-top: var(--apple-spacing-md);
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
  margin-top: var(--apple-spacing-lg);
}

.qr-code-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--apple-spacing-md);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius-lg);
  margin: var(--apple-spacing-md) auto;
  max-width: 300px;
}
</style>
