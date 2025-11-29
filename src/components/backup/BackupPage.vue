<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { NCard, NButton, NCheckbox, NAlert, NText, NSpace } from 'naive-ui';
import { useUIStore } from '../../stores/ui';

const { t } = useI18n();
const uiStore = useUIStore();

const props = defineProps<{
  mnemonic: string;
  wordCount: 12 | 24;
}>();

const emit = defineEmits<{
  (e: 'finish'): void;
  (e: 'cancel'): void;
}>();

const showMnemonic = ref(false);
const understood = ref(false);

function copyMnemonic() {
  navigator.clipboard.writeText(props.mnemonic).then(() => {
    uiStore.showSuccess(`${t('backup.copyMnemonic')} ${t('common.success')}`);
  });
}

function handleFinish() {
  if (!understood.value) {
    uiStore.showWarning(t('backup.confirmBackup'));
    return;
  }
  emit('finish');
}
</script>

<template>
  <div class="backup-page">
    <NCard class="backup-card">
      <h2 class="card-title">{{ t('backup.title') }}</h2>
      <NText depth="3" class="card-description">{{ t('backup.description') }}</NText>

      <div class="mnemonic-container">
        <div v-if="!showMnemonic" class="mnemonic-hidden" @click="showMnemonic = true">
          <div class="hidden-icon">●</div>
          <NText depth="3">{{ t('backup.clickToShow') }}</NText>
          <NText depth="3" class="word-count-text">{{ wordCount }} {{ t('common.words') }}</NText>
        </div>
        <div v-else class="mnemonic-words" :class="{ 'words-24': wordCount === 24 }">
          <span v-for="(word, i) in mnemonic.split(' ')" :key="i" class="word-item">
            <span class="word-number">{{ i + 1 }}</span>
            <span class="word-text">{{ word }}</span>
          </span>
        </div>
      </div>

      <NButton
        v-if="showMnemonic"
        type="default"
        size="medium"
        block
        class="copy-button"
        @click="copyMnemonic"
      >
        {{ t('backup.copyMnemonic') }}
      </NButton>

      <NAlert type="warning" class="warning-alert">
        <template #header>
          <NText strong>{{ t('backup.warning.title') }}</NText>
        </template>
        <ul class="warning-list">
          <li>{{ t('backup.warning.tip1') }}</li>
          <li>{{ t('backup.warning.tip2') }}</li>
          <li>{{ t('backup.warning.tip3') }}</li>
        </ul>
      </NAlert>

      <NCheckbox v-model:checked="understood" class="understand-checkbox">
        {{ t('backup.understand') }}
      </NCheckbox>

      <NSpace vertical :size="12">
        <NButton type="info" size="large" block :disabled="!understood" @click="handleFinish">
          {{ t('backup.finish') }}
        </NButton>
        <NButton type="default" size="large" block @click="emit('cancel')">
          {{ t('common.cancel') }}
        </NButton>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped>
.backup-page {
  max-width: 480px;
  margin: 0 auto;
  padding: var(--apple-spacing-xl) var(--apple-spacing-md);
}

.backup-card {
  border-radius: var(--apple-radius-lg);
}

.card-title {
  font-size: var(--apple-font-size-title-3);
  font-weight: var(--apple-font-weight-semibold);
  margin: 0 0 var(--apple-spacing-sm) 0;
  color: var(--apple-text-primary);
}

.card-description {
  display: block;
  margin-bottom: var(--apple-spacing-lg);
  font-size: var(--apple-font-size-subheadline);
  line-height: 1.5;
}

.mnemonic-container {
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius-md);
  padding: var(--apple-spacing-lg);
  margin-bottom: var(--apple-spacing-lg);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mnemonic-hidden {
  text-align: center;
  cursor: pointer;
  transition: transform var(--apple-transition-fast);
}

.mnemonic-hidden:hover {
  transform: scale(1.05);
}

.hidden-icon {
  font-size: 3rem;
  color: var(--apple-text-tertiary);
  margin-bottom: var(--apple-spacing-sm);
  line-height: 1;
}

.word-count-text {
  display: block;
  margin-top: var(--apple-spacing-xs);
  font-size: var(--apple-font-size-caption-1);
}

.mnemonic-words {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--apple-spacing-sm);
  width: 100%;
}

.mnemonic-words.words-24 {
  grid-template-columns: repeat(4, 1fr);
  gap: var(--apple-spacing-xs);
}

.word-item {
  background: var(--apple-bg-primary);
  padding: var(--apple-spacing-sm);
  border-radius: var(--apple-radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: var(--apple-font-size-caption-1);
}

.words-24 .word-item {
  padding: var(--apple-spacing-xs);
  font-size: var(--apple-font-size-caption-2);
}

.word-number {
  font-size: var(--apple-font-size-caption-2);
  color: var(--apple-text-tertiary);
  font-weight: var(--apple-font-weight-regular);
}

.word-text {
  font-weight: var(--apple-font-weight-semibold);
  color: var(--apple-text-primary);
}

.copy-button {
  margin-bottom: var(--apple-spacing-lg);
}

.warning-alert {
  margin-bottom: var(--apple-spacing-lg);
  border-radius: var(--apple-radius-md);
}

.warning-list {
  margin: var(--apple-spacing-sm) 0 0 0;
  padding-left: var(--apple-spacing-lg);
}

.warning-list li {
  margin: var(--apple-spacing-xs) 0;
  font-size: var(--apple-font-size-subheadline);
}

.understand-checkbox {
  margin-bottom: var(--apple-spacing-lg);
  display: flex;
  align-items: center;
}

.understand-checkbox :deep(.n-checkbox-box) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.understand-checkbox :deep(.n-checkbox__label) {
  display: flex;
  align-items: center;
  line-height: 1.5;
}
</style>
