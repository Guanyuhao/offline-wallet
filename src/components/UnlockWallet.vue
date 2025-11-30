<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { NCard, NButton, NInput, NText, NAlert } from 'naive-ui';
import { useWalletStore } from '../stores/wallet';
import { useUIStore } from '../stores/ui';
import { retrieveEncryptedMnemonic } from '../composables/useWalletStorage';
import { isBiometricAvailable, unlockWithBiometric } from '../composables/useBiometric';

const { t } = useI18n();
const walletStore = useWalletStore();
const uiStore = useUIStore();

const password = ref('');
const isUnlocking = ref(false);
const errorMessage = ref('');
const biometricAvailable = ref(false);
const biometricEnabled = ref(false);

const emit = defineEmits<{
  (e: 'unlocked'): void;
  (e: 'forgotPassword'): void;
}>();

// 检查生物识别是否可用
onMounted(async () => {
  try {
    biometricAvailable.value = await isBiometricAvailable();
    // 检查是否启用了生物识别（从 localStorage 读取）
    const enabled = localStorage.getItem('biometric_enabled') === 'true';
    biometricEnabled.value = enabled && biometricAvailable.value;

    // 如果启用了生物识别，自动尝试认证
    if (biometricEnabled.value) {
      tryBiometricUnlock();
    }
  } catch (error) {
    console.error('Failed to check biometric availability:', error);
  }
});

async function tryBiometricUnlock() {
  try {
    const mnemonic = await unlockWithBiometric();
    if (mnemonic) {
      // 生物识别成功，解锁钱包（使用新的 API）
      await walletStore.unlockWallet(mnemonic, '');
      emit('unlocked');
      uiStore.showSuccess(t('security.biometricUnlockSuccess') || '钱包已通过生物识别解锁');
    }
  } catch (error: any) {
    console.error('Biometric unlock failed:', error);
    // 生物识别失败，继续使用密码解锁
  }
}

async function handleBiometricUnlock() {
  try {
    isUnlocking.value = true;
    errorMessage.value = '';

    const mnemonic = await unlockWithBiometric();
    if (mnemonic) {
      // 生物识别成功，解锁钱包（使用新的 API）
      await walletStore.unlockWallet(mnemonic, '');
      emit('unlocked');
      uiStore.showSuccess(t('security.biometricUnlockSuccess') || '钱包已通过生物识别解锁');
    } else {
      errorMessage.value = t('security.biometricFailed') || '生物识别失败，请使用密码解锁';
    }
  } catch (error: any) {
    errorMessage.value = error.message || '生物识别失败，请使用密码解锁';
  } finally {
    isUnlocking.value = false;
  }
}

async function handleUnlock() {
  if (!password.value) {
    errorMessage.value = t('security.passwordRequired') || '请输入密码';
    return;
  }

  try {
    isUnlocking.value = true;
    errorMessage.value = '';

    // 从系统级存储读取并解密助记词
    const mnemonic = await retrieveEncryptedMnemonic(password.value);

    // 使用新的解锁 API（会自动加密存储到内存）
    await walletStore.unlockWallet(mnemonic, '');

    // 触发解锁事件
    emit('unlocked');
    uiStore.showSuccess(t('security.walletUnlocked') || '钱包已解锁');
  } catch (error: any) {
    errorMessage.value = error.message || t('security.passwordError') || '密码错误，请重试';
  } finally {
    isUnlocking.value = false;
  }
}

function handleForgotPassword() {
  emit('forgotPassword');
}
</script>

<template>
  <div class="unlock-wallet">
    <NCard class="unlock-card">
      <div class="unlock-header">
        <h2 class="unlock-title">{{ t('wallet.unlock') }}</h2>
        <NText depth="3" class="unlock-subtitle"> 请输入密码以解锁钱包 </NText>
      </div>

      <NAlert v-if="errorMessage" type="error" class="error-alert">
        {{ errorMessage }}
      </NAlert>

      <div class="password-input-wrapper">
        <NInput
          v-model:value="password"
          type="password"
          :placeholder="t('security.enterPassword') || '请输入密码'"
          show-password-on="click"
          size="large"
          class="password-input"
          :disabled="isUnlocking"
          @keyup.enter="handleUnlock"
        />
      </div>

      <!-- 生物识别按钮 -->
      <NButton
        v-if="biometricAvailable && biometricEnabled"
        type="primary"
        size="large"
        block
        :loading="isUnlocking"
        class="biometric-button"
        @click="handleBiometricUnlock"
      >
        <NText>{{ t('security.useBiometricUnlock') || '使用 Face ID / Touch ID 解锁' }}</NText>
      </NButton>

      <div v-if="biometricAvailable && biometricEnabled" class="divider">
        <NText depth="3">{{ t('common.or') || '或' }}</NText>
      </div>

      <NButton
        type="primary"
        size="large"
        block
        :loading="isUnlocking"
        class="unlock-button"
        @click="handleUnlock"
      >
        {{ t('wallet.unlock') }}
      </NButton>

      <div class="forgot-password-section">
        <NButton
          type="default"
          size="medium"
          text
          block
          class="forgot-password-button"
          @click="handleForgotPassword"
        >
          {{ t('security.forgotPassword') }}
        </NButton>
        <NText depth="3" class="hint-text">
          {{ t('security.forgotPasswordDesc') }}
        </NText>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.unlock-wallet {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: var(--apple-spacing-xl);
}

.unlock-card {
  max-width: 400px;
  width: 100%;
  border-radius: var(--apple-radius-lg);
}

.unlock-header {
  text-align: center;
  margin-bottom: var(--apple-spacing-xl);
}

.unlock-title {
  font-size: var(--apple-font-size-title-1);
  font-weight: var(--apple-font-weight-bold);
  margin: 0 0 var(--apple-spacing-sm) 0;
  color: var(--apple-text-primary);
}

.unlock-subtitle {
  font-size: var(--apple-font-size-body);
  display: block;
}

.error-alert {
  margin-bottom: var(--apple-spacing-md);
}

.password-input-wrapper {
  margin-bottom: var(--apple-spacing-lg);
}

.password-input {
  width: 100%;
}

.biometric-button {
  margin-bottom: var(--apple-spacing-md);
}

.divider {
  text-align: center;
  margin: var(--apple-spacing-md) 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: var(--apple-border-color);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.unlock-button {
  margin-bottom: var(--apple-spacing-md);
}

.forgot-password-section {
  margin-top: var(--apple-spacing-lg);
  text-align: center;
}

.forgot-password-button {
  margin-bottom: var(--apple-spacing-sm);
  color: var(--apple-text-secondary);
}

.forgot-password-button:hover {
  color: var(--apple-text-primary);
}

.hint-text {
  display: block;
  text-align: center;
  font-size: var(--apple-font-size-caption-1);
  line-height: 1.5;
  margin-top: var(--apple-spacing-xs);
}
</style>
