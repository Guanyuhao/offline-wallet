<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { NModal, NCard, NText, NButton, NSpace, NAlert } from 'naive-ui';

defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'enable'): void;
  (e: 'skip'): void;
}>();

const { t } = useI18n();

function handleEnable() {
  emit('update:show', false);
  emit('enable');
}

function handleSkip() {
  emit('update:show', false);
  emit('skip');
}
</script>

<template>
  <NModal
    :show="show"
    :mask-closable="false"
    :close-on-esc="false"
    preset="card"
    style="width: 90%; max-width: 480px"
    :title="t('security.enableEncryptionTitle')"
  >
    <NCard>
      <NSpace vertical :size="16">
        <NText depth="3">
          {{ t('security.enableEncryptionDesc') }}
        </NText>

        <NAlert type="warning">
          <NText depth="3">
            {{ t('security.enableEncryptionWarning') }}
          </NText>
        </NAlert>

        <NSpace vertical :size="12" style="margin-top: 16px">
          <NButton type="primary" size="large" block @click="handleEnable">
            {{ t('security.enableNow') }}
          </NButton>
          <NButton type="default" size="large" block @click="handleSkip">
            {{ t('security.later') }}
          </NButton>
        </NSpace>
      </NSpace>
    </NCard>
  </NModal>
</template>

<style scoped>
:deep(.n-card) {
  padding: 0;
}
</style>
