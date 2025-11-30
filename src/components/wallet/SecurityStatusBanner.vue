<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { NAlert, NButton, NText } from 'naive-ui';
import { hasEncryptedMnemonic } from '../../composables/useWalletStorage';

const { t } = useI18n();
const encryptionEnabled = ref(false);
const bannerDismissed = ref(false);

const STORAGE_KEY = 'security_banner_dismissed';

const emit = defineEmits<{
  (e: 'enable'): void;
}>();

// 检查是否已关闭提示
function checkBannerDismissed() {
  try {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    bannerDismissed.value = dismissed === 'true';
  } catch (error) {
    console.error('Failed to check banner dismissed status:', error);
    bannerDismissed.value = false;
  }
}

// 关闭提示
function handleDismiss() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
    bannerDismissed.value = true;
  } catch (error) {
    console.error('Failed to save banner dismissed status:', error);
  }
}

// 检查加密状态
async function checkEncryptionStatus() {
  encryptionEnabled.value = await hasEncryptedMnemonic();
}

let intervalId: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  checkBannerDismissed();
  await checkEncryptionStatus();

  // 定期检查加密状态变化（每1秒检查一次，确保及时更新）
  intervalId = setInterval(async () => {
    await checkEncryptionStatus();
  }, 1000);

  // 监听页面可见性变化，当页面重新可见时检查状态
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 监听窗口焦点变化
  window.addEventListener('focus', checkEncryptionStatus);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('focus', checkEncryptionStatus);
});

async function handleVisibilityChange() {
  if (!document.hidden) {
    await checkEncryptionStatus();
  }
}

function handleEnableClick() {
  emit('enable');
}
</script>

<template>
  <div v-if="!encryptionEnabled && !bannerDismissed" class="security-banner">
    <NAlert
      type="warning"
      :show-icon="true"
      :closable="true"
      class="security-alert"
      @close="handleDismiss"
    >
      <div class="alert-content">
        <div class="alert-text">
          <NText strong>{{ t('security.notEnabledTitle') }}</NText>
          <NText depth="3" class="alert-desc">
            {{ t('security.notEnabledDesc') }}
          </NText>
        </div>
        <NButton type="primary" size="small" class="enable-btn" @click="handleEnableClick">
          {{ t('security.enableNow') }}
        </NButton>
      </div>
    </NAlert>
  </div>
</template>

<style scoped>
.security-banner {
  margin: var(--apple-spacing-md) 0;
  padding: 0 var(--apple-spacing-md);
}

.security-alert {
  border-radius: var(--apple-radius-md);
}

.alert-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--apple-spacing-md);
  flex-wrap: wrap;
}

.alert-text {
  flex: 1;
  min-width: 200px;
}

.alert-desc {
  display: block;
  margin-top: var(--apple-spacing-xs);
  font-size: var(--apple-font-size-caption-1);
  line-height: 1.5;
}

.enable-btn {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .alert-content {
    flex-direction: column;
    align-items: stretch;
  }

  .enable-btn {
    width: 100%;
  }
}
</style>
