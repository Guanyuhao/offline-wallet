<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { NAlert, NButton, NText } from 'naive-ui';
import { hasEncryptedMnemonic } from '../../composables/useWalletStorage';

const { t } = useI18n();
const encryptionEnabled = ref(false);

const emit = defineEmits<{
  (e: 'enable'): void;
}>();

onMounted(async () => {
  encryptionEnabled.value = await hasEncryptedMnemonic();
});

function handleEnableClick() {
  emit('enable');
}
</script>

<template>
  <div v-if="!encryptionEnabled" class="security-banner">
    <NAlert type="warning" :show-icon="true" class="security-alert">
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
