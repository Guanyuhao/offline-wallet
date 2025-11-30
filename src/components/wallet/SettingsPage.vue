<script setup lang="ts">
import SecuritySettings from '../SecuritySettings.vue';
import { useI18n } from 'vue-i18n';
import { NCard, NButton, NText } from 'naive-ui';

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'exit'): void;
}>();

function handleExit() {
  // 直接触发 exit 事件，让 App.vue 统一管理对话框
  emit('exit');
}
</script>

<template>
  <div class="settings-page">
    <NCard class="settings-card">
      <div class="settings-header">
        <NText strong class="settings-title">{{ t('settings.title') }}</NText>
      </div>

      <!-- 安全设置 -->
      <SecuritySettings />

      <!-- 退出钱包 -->
      <div class="exit-section">
        <NButton type="error" block size="large" class="exit-wallet-btn" @click="handleExit">
          {{ t('wallet.exit') }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.settings-page {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: var(--apple-spacing-md);
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.settings-card {
  flex: 1;
}

.settings-header {
  margin-bottom: var(--apple-spacing-lg);
}

.settings-title {
  font-size: var(--apple-font-size-title-3);
  font-weight: var(--apple-font-weight-semibold);
}

.exit-section {
  margin-top: var(--apple-spacing-xl);
  padding-top: var(--apple-spacing-lg);
  border-top: 0.5px solid var(--apple-separator);
}

.exit-wallet-btn {
  margin-top: var(--apple-spacing-md);
}

@media (max-width: 640px) {
  .settings-page {
    padding: var(--apple-spacing-sm);
  }
}
</style>
