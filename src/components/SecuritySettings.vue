<script setup lang="ts">
import { ref, watch } from 'vue';
import { NCard, NButton, NInput, NText, NAlert, NSwitch, NProgress, useDialog } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import { useWalletStore } from '../stores/wallet';
import { useUIStore } from '../stores/ui';
import {
  hasEncryptedMnemonic,
  storeEncryptedMnemonic,
  deleteEncryptedMnemonic,
  storeBiometricPassword,
  deleteBiometricPassword,
  hasBiometricPassword,
  retrieveEncryptedMnemonic,
  syncWalletToStorage,
  clearWalletData,
} from '../composables/useWalletStorage';
import {
  checkPasswordStrength,
  type PasswordStrengthResult,
} from '../composables/usePasswordStrength';
import { useAutoLock } from '../composables/useAutoLock';
import { isBiometricAvailable } from '../composables/useBiometric';

const { t } = useI18n();
const walletStore = useWalletStore();
const uiStore = useUIStore();
const dialog = useDialog();

const encryptionEnabled = ref(false);
const showPasswordInput = ref(false);
const password = ref('');
const confirmPassword = ref('');
const passwordHint = ref('');
const isSettingPassword = ref(false);
const passwordStrength = ref<PasswordStrengthResult | null>(null);
const isEnablingBiometric = ref(false); // 标记是否正在启用生物识别

// 自动锁定
const { isAutoLockEnabled } = useAutoLock();

// 生物识别
const biometricAvailable = ref(false);
const biometricEnabled = ref(false);

// 检查是否已启用加密存储
hasEncryptedMnemonic().then((enabled) => {
  encryptionEnabled.value = enabled;
});

// 检查生物识别是否可用
isBiometricAvailable().then(async (available) => {
  biometricAvailable.value = available;
  // 检查是否已启用生物识别
  if (available) {
    const hasPassword = await hasBiometricPassword();
    biometricEnabled.value = hasPassword && encryptionEnabled.value;
  }
});

async function handleBiometricToggle(enabled: boolean) {
  if (!encryptionEnabled.value) {
    uiStore.showError(t('security.enablePasswordFirst') || '请先开启密码');
    return;
  }

  try {
    if (enabled) {
      // 启用生物识别：需要用户输入密码来存储
      // 提示用户输入密码以启用生物识别
      isEnablingBiometric.value = true;
      showPasswordInput.value = true;
      uiStore.showInfo(t('security.enableBiometricPrompt') || '请输入密码以启用生物识别');
    } else {
      // 禁用生物识别
      await deleteBiometricPassword();
      biometricEnabled.value = false;
      uiStore.showSuccess(t('security.biometricDisabled') || '生物识别已禁用');
    }
  } catch (error: any) {
    uiStore.showError(error.message || '操作失败');
  }
}

// 监听密码变化，检测强度
watch(password, async (newPassword) => {
  if (newPassword.length > 0) {
    try {
      passwordStrength.value = await checkPasswordStrength(newPassword);
    } catch (error) {
      console.error('Failed to check password strength:', error);
    }
  } else {
    passwordStrength.value = null;
  }
});

function handleEnableEncryption() {
  // 修复：检查钱包是否已创建，而不是检查 mnemonic（因为 mnemonic 在创建后会被清空）
  if (!walletStore.isWalletCreated) {
    uiStore.showError(t('security.createWalletFirst') || '请先导入或创建钱包');
    return;
  }

  showPasswordInput.value = true;
}

async function handleSetPassword() {
  if (!password.value || password.value.length < 8) {
    uiStore.showError(t('security.passwordMinLength') || '密码至少需要8个字符');
    return;
  }

  // 检查密码强度
  if (passwordStrength.value && !passwordStrength.value.is_sufficient) {
    uiStore.showError(
      t('security.passwordStrengthInsufficient') || '密码强度不足，请使用更强的密码'
    );
    return;
  }

  if (password.value !== confirmPassword.value) {
    uiStore.showError(t('security.passwordMismatch') || '两次输入的密码不一致');
    return;
  }

  try {
    isSettingPassword.value = true;

    // 如果是启用加密存储
    if (!encryptionEnabled.value) {
      await storeEncryptedMnemonic(walletStore.mnemonic, password.value);

      // 如果生物识别可用，自动启用生物识别
      if (biometricAvailable.value) {
        try {
          await storeBiometricPassword(password.value);
          biometricEnabled.value = true;
          uiStore.showSuccess(t('security.biometricAutoEnabled') || '生物识别已自动启用');
        } catch (error) {
          console.error('Failed to store biometric password:', error);
          // 不影响主流程，只显示加密存储成功
          uiStore.showSuccess(t('security.encryptionEnabled') || '加密存储已启用');
        }
      } else {
        uiStore.showSuccess('加密存储已启用');
      }

      encryptionEnabled.value = true;

      // 启用加密存储后，立即保存地址到 localStorage
      if (walletStore.isWalletCreated) {
        await syncWalletToStorage();
      }
    } else if (isEnablingBiometric.value) {
      // 如果是手动启用生物识别，先验证密码是否正确
      try {
        await retrieveEncryptedMnemonic(password.value);
        // 密码正确，存储到生物识别密钥库
        await storeBiometricPassword(password.value);
        biometricEnabled.value = true;
        uiStore.showSuccess(t('security.biometricEnabled') || '生物识别已启用');
        isEnablingBiometric.value = false;
      } catch (error: any) {
        // 密码错误
        uiStore.showError(t('security.passwordError') || '密码错误，请重试');
        throw error;
      }
    }

    showPasswordInput.value = false;
    password.value = '';
    confirmPassword.value = '';
    passwordHint.value = '';
    passwordStrength.value = null;
  } catch (error: any) {
    uiStore.showError(error.message || '操作失败');
  } finally {
    isSettingPassword.value = false;
  }
}

function handleDisableEncryption() {
  // 显示确认对话框
  dialog.warning({
    title: t('security.disableEncryptionTitle') || '关闭加密存储',
    content:
      t('security.disableEncryptionContent') ||
      '关闭加密存储后，应用重启时需要重新输入助记词才能使用钱包。当前会话中的钱包仍可正常使用。\n\n确定要关闭加密存储吗？',
    positiveText: t('common.confirm') || '确定',
    negativeText: t('common.cancel') || '取消',
    onPositiveClick: async () => {
      try {
        // 删除系统级存储的加密助记词
        await deleteEncryptedMnemonic();

        // 同时禁用生物识别
        if (biometricEnabled.value) {
          try {
            await deleteBiometricPassword();
            biometricEnabled.value = false;
          } catch (error) {
            console.error('Failed to delete biometric password:', error);
          }
        }

        encryptionEnabled.value = false;

        // 禁用加密存储后，立即清除地址缓存
        // 因为地址是从助记词派生的，没有加密助记词就没有意义
        clearWalletData();

        uiStore.showSuccess(t('security.encryptionDisabled') || '加密存储已禁用');

        // 注意：当前内存中的助记词仍然保留，钱包可以继续使用
        // 但下次应用重启时，如果没有加密存储，用户需要重新导入助记词

        return true; // 允许对话框关闭
      } catch (error: any) {
        uiStore.showError(
          error.message || t('security.disableEncryptionError') || '禁用加密存储失败'
        );
        return false; // 阻止对话框关闭，让用户重试
      }
    },
  });
}

function handleCancel() {
  showPasswordInput.value = false;
  password.value = '';
  confirmPassword.value = '';
  passwordHint.value = '';
  passwordStrength.value = null;
  isEnablingBiometric.value = false;
}

function getStrengthColor(strength: string): string {
  switch (strength) {
    case '非常弱':
    case 'Very Weak':
      return '#ff4d4f';
    case '弱':
    case 'Weak':
      return '#ff7875';
    case '中等':
    case 'Medium':
      return '#faad14';
    case '强':
    case 'Strong':
      return '#52c41a';
    case '非常强':
    case 'Very Strong':
      return '#389e0d';
    default:
      return '#d9d9d9';
  }
}
</script>

<template>
  <NCard class="security-card">
    <div class="security-header">
      <NText strong class="security-title">安全设置</NText>
    </div>

    <div class="security-item">
      <div class="security-item-content">
        <div>
          <NText strong>{{ t('security.enableEncryptionTitle') || '开启密码' }}</NText>
          <NText depth="3" class="security-desc" style="white-space: pre-line">
            {{
              t('security.enableEncryptionDesc') ||
              '在系统级别安全加密存储你的助记词\n\n应用关闭后仍可保留钱包，下次打开时输入密码即可解锁\n\n重要提示：如果忘记密码，需要使用助记词重新导入钱包。'
            }}
          </NText>
        </div>
        <NSwitch
          :value="encryptionEnabled"
          @update:value="encryptionEnabled ? handleDisableEncryption() : handleEnableEncryption()"
        />
      </div>

      <div v-if="showPasswordInput" class="password-input-section">
        <NAlert v-if="isEnablingBiometric" type="info" class="password-alert">
          <NText depth="3">{{
            t('security.enterPasswordForBiometric') || '请输入您的密码以启用生物识别功能'
          }}</NText>
        </NAlert>
        <NInput
          v-model:value="password"
          type="password"
          :placeholder="
            isEnablingBiometric
              ? t('security.enterPassword') || '请输入密码'
              : t('security.setPasswordPlaceholder') || '设置密码（至少8个字符）'
          "
          show-password-on="click"
          class="password-input"
        />

        <!-- 密码强度指示器 - 仅在设置新密码时显示 -->
        <div v-if="passwordStrength && !isEnablingBiometric" class="password-strength">
          <div class="strength-bar">
            <NProgress
              type="line"
              :percentage="(passwordStrength.score / 4) * 100"
              :color="getStrengthColor(passwordStrength.strength)"
              :show-indicator="false"
            />
          </div>
          <NText
            :style="{ color: getStrengthColor(passwordStrength.strength) }"
            class="strength-text"
          >
            强度: {{ passwordStrength.strength }}
          </NText>
          <div v-if="passwordStrength.feedback.length > 0" class="strength-feedback">
            <NText
              v-for="(item, index) in passwordStrength.feedback"
              :key="index"
              depth="3"
              class="feedback-item"
            >
              {{ item }}
            </NText>
          </div>
        </div>

        <NInput
          v-if="!isEnablingBiometric"
          v-model:value="confirmPassword"
          type="password"
          :placeholder="t('security.confirmPasswordPlaceholder') || '确认密码'"
          show-password-on="click"
          class="password-input"
        />

        <!-- 密码提示（可选） - 仅在设置新密码时显示 -->
        <NInput
          v-if="!isEnablingBiometric"
          v-model:value="passwordHint"
          :placeholder="t('security.passwordHintPlaceholder') || '密码提示（可选，帮助您记住密码）'"
          class="password-input"
        />

        <div class="password-actions">
          <NButton @click="handleCancel">{{ t('common.cancel') || '取消' }}</NButton>
          <NButton type="primary" :loading="isSettingPassword" @click="handleSetPassword">
            {{ t('common.confirm') || '确认' }}
          </NButton>
        </div>
      </div>
    </div>

    <!-- 生物识别设置 -->
    <div v-if="biometricAvailable" class="security-item">
      <div class="security-item-content">
        <div>
          <NText strong>生物识别解锁</NText>
          <NText depth="3" class="security-desc" style="white-space: pre-line">
            {{
              t('security.biometricDesc') ||
              '启用后，可以使用 Face ID / Touch ID 快速解锁钱包。\n\n注意：需要先开启密码才能使用生物识别。'
            }}
          </NText>
        </div>
        <NSwitch
          :value="biometricEnabled && encryptionEnabled"
          :disabled="!encryptionEnabled"
          @update:value="handleBiometricToggle"
        />
      </div>
      <NAlert v-if="!encryptionEnabled" type="warning" class="security-alert">
        <NText depth="3">
          {{ t('security.biometricRequirePassword') || '请先开启密码才能使用生物识别功能。' }}
        </NText>
      </NAlert>
      <NAlert v-else-if="biometricEnabled" type="success" class="security-alert">
        <NText depth="3">
          {{
            t('security.biometricUnlockDesc') ||
            '生物识别已启用。解锁时将优先使用生物识别，不可用时将使用密码。'
          }}
        </NText>
      </NAlert>
    </div>

    <!-- 自动锁定设置 -->
    <div class="security-item">
      <div class="security-item-content">
        <div>
          <NText strong>自动锁定</NText>
          <NText depth="3" class="security-desc">
            启用后，应用在无操作一段时间后会自动锁定钱包。
          </NText>
        </div>
        <NSwitch v-model:value="isAutoLockEnabled" />
      </div>
    </div>

    <NAlert v-if="encryptionEnabled" type="info" class="security-alert">
      <NText depth="3">
        <strong>{{ t('security.enableEncryptionTitle') || '已启用密码' }}</strong
        ><br />
        {{
          t('security.enableEncryptionDesc')?.split('\n\n')[1] ||
          '应用关闭后仍可保留钱包，下次打开时输入密码即可解锁。'
        }}
      </NText>
    </NAlert>

    <NAlert v-else type="warning" class="security-alert">
      <NText depth="3">
        <strong>{{ t('security.notEnabledTitle') || '未启用加密存储' }}</strong
        ><br />
        {{
          t('security.notEnabledDesc') ||
          '应用关闭后需要重新输入助记词才能使用。建议启用加密存储以便下次快速解锁。'
        }}
      </NText>
    </NAlert>
  </NCard>
</template>

<style scoped>
.security-card {
  margin-bottom: var(--apple-spacing-md);
}

.security-header {
  margin-bottom: var(--apple-spacing-lg);
}

.security-title {
  font-size: var(--apple-font-size-title-3);
  font-weight: var(--apple-font-weight-semibold);
}

.security-item {
  margin-bottom: var(--apple-spacing-md);
}

.security-item-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--apple-spacing-md);
  margin-bottom: var(--apple-spacing-md);
}

.security-desc {
  display: block;
  margin-top: var(--apple-spacing-xs);
  font-size: var(--apple-font-size-caption-1);
  line-height: 1.5;
}

.password-input-section {
  margin-top: var(--apple-spacing-md);
  padding: var(--apple-spacing-md);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius-md);
}

.password-input {
  margin-bottom: var(--apple-spacing-sm);
}

.password-alert {
  margin-bottom: var(--apple-spacing-sm);
}

.password-actions {
  display: flex;
  gap: var(--apple-spacing-sm);
  justify-content: flex-end;
  margin-top: var(--apple-spacing-sm);
}

.security-alert {
  margin-top: var(--apple-spacing-md);
}

.password-strength {
  margin-bottom: var(--apple-spacing-sm);
  padding: var(--apple-spacing-sm);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius-sm);
}

.strength-bar {
  margin-bottom: var(--apple-spacing-xs);
}

.strength-text {
  display: block;
  font-size: var(--apple-font-size-caption-1);
  font-weight: var(--apple-font-weight-medium);
  margin-bottom: var(--apple-spacing-xs);
}

.strength-feedback {
  margin-top: var(--apple-spacing-xs);
}

.feedback-item {
  display: block;
  font-size: var(--apple-font-size-caption-2);
  line-height: 1.5;
  margin-top: var(--apple-spacing-xs);
}
</style>
