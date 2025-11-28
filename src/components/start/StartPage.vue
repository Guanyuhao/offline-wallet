<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { NCard, NButton, NRadioGroup, NRadio, NInput, NText, NAlert } from 'naive-ui';
import { useWalletStore } from '../../stores/wallet';
import { useUIStore } from '../../stores/ui';
import { getFriendlyErrorMessage } from '../../utils/errorHandler';

const { t } = useI18n();
const walletStore = useWalletStore();
const uiStore = useUIStore();

const wordCount = ref<12 | 24>(12);
const inputMnemonic = ref('');

const emit = defineEmits<{
  (e: 'create', data: { wordCount: 12 | 24; mnemonic: string }): void;
  (e: 'import', mnemonic: string): void;
}>();

async function handleCreate() {
  try {
    uiStore.showLoading(t('common.loading'));
    const generatedMnemonic = await walletStore.generateMnemonic(wordCount.value);
    emit('create', { wordCount: wordCount.value, mnemonic: generatedMnemonic });
  } catch (error) {
    const friendlyError = getFriendlyErrorMessage(error, t);
    if (friendlyError) {
      uiStore.showError(friendlyError);
    }
  } finally {
    uiStore.hideLoading();
  }
}

async function handleImport() {
  const mnemonic = inputMnemonic.value.trim();
  if (!mnemonic) {
    uiStore.showError(t('start.importPlaceholder'));
    return;
  }

  try {
    uiStore.showLoading();
    const isValid = await walletStore.validateMnemonic(mnemonic);
    if (!isValid) {
      uiStore.showError(t('messages.invalidMnemonicShort'));
      return;
    }
    emit('import', mnemonic);
  } catch (error) {
    // 友好的错误处理
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('invalid') || errorMessage.includes('无效')) {
      uiStore.showError(t('messages.invalidMnemonicShort'));
    } else {
      uiStore.showError(t('messages.unknownError'));
    }
  } finally {
    uiStore.hideLoading();
  }
}
</script>

<template>
  <div class="start-page">
    <n-card class="start-card">
      <h2 class="card-title">{{ t('start.title') }}</h2>

      <div class="word-count-section">
        <n-text depth="3" class="section-label">{{ t('start.wordCountLabel') }}</n-text>
        <n-radio-group v-model:value="wordCount" class="word-count-radio">
          <n-radio :value="12">
            {{ t('start.words12') }}
            <n-text depth="3" class="recommend-badge">{{ t('start.recommended') }}</n-text>
          </n-radio>
          <n-radio :value="24">
            {{ t('start.words24') }}
            <n-text depth="3" class="recommend-badge">{{ t('start.moreSafe') }}</n-text>
          </n-radio>
        </n-radio-group>
      </div>

      <n-button
        type="info"
        size="large"
        block
        class="action-button"
        @click="handleCreate"
      >
        {{ t('start.createNew') }}
      </n-button>

      <div class="divider">
        <n-text depth="3">{{ t('common.or') }}</n-text>
      </div>

      <div class="import-section">
        <n-input
          v-model:value="inputMnemonic"
          type="textarea"
          :placeholder="t('start.importPlaceholder')"
          :rows="3"
          class="mnemonic-input"
          autocomplete="off"
          :show-count="false"
        />
        <n-button
          type="default"
          size="large"
          block
          class="action-button"
          @click="handleImport"
        >
          {{ t('start.import') }}
        </n-button>
      </div>
    </n-card>

    <n-alert type="info" class="tip-alert">
      {{ t('start.tip') }}
    </n-alert>

    <div class="features-section">
      <div class="feature-item">
        <div class="feature-icon">●</div>
        <div class="feature-content">
          <n-text strong class="feature-title">{{ t('start.features.offline.title') }}</n-text>
          <n-text depth="3" class="feature-desc">{{ t('start.features.offline.desc') }}</n-text>
        </div>
      </div>
      <div class="feature-item">
        <div class="feature-icon">●</div>
        <div class="feature-content">
          <n-text strong class="feature-title">{{ t('start.features.secure.title') }}</n-text>
          <n-text depth="3" class="feature-desc">{{ t('start.features.secure.desc') }}</n-text>
        </div>
      </div>
      <div class="feature-item">
        <div class="feature-icon">●</div>
        <div class="feature-content">
          <n-text strong class="feature-title">{{ t('start.features.erase.title') }}</n-text>
          <n-text depth="3" class="feature-desc">{{ t('start.features.erase.desc') }}</n-text>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.start-page {
  max-width: 480px;
  margin: 0 auto;
  padding: var(--apple-spacing-xl) var(--apple-spacing-md);
}

.start-card {
  margin-bottom: var(--apple-spacing-lg);
  border-radius: var(--apple-radius-lg);
}

.card-title {
  font-size: var(--apple-font-size-title-3);
  font-weight: var(--apple-font-weight-semibold);
  margin: 0 0 var(--apple-spacing-lg) 0;
  color: var(--apple-text-primary);
}

.word-count-section {
  margin-bottom: var(--apple-spacing-lg);
}

.section-label {
  display: block;
  font-size: var(--apple-font-size-footnote);
  font-weight: var(--apple-font-weight-medium);
  margin-bottom: var(--apple-spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.word-count-radio {
  display: flex;
  gap: var(--apple-spacing-md);
}

.recommend-badge {
  font-size: var(--apple-font-size-caption-1);
  margin-left: var(--apple-spacing-xs);
}

.action-button {
  margin-top: var(--apple-spacing-md);
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: var(--apple-spacing-lg) 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 0.5px;
  background: var(--apple-separator);
}

.divider > * {
  padding: 0 var(--apple-spacing-md);
}

.import-section {
  margin-top: var(--apple-spacing-md);
}

.mnemonic-input {
  margin-bottom: var(--apple-spacing-md);
}

.tip-alert {
  border-radius: var(--apple-radius-md);
  margin-bottom: var(--apple-spacing-lg);
}

.features-section {
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-md);
  padding: var(--apple-spacing-lg);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius-lg);
  border: 0.5px solid var(--apple-separator);
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: var(--apple-spacing-md);
}

.feature-icon {
  font-size: var(--apple-font-size-body);
  color: var(--apple-blue);
  line-height: 1.5;
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-xs);
}

.feature-title {
  display: block;
  font-size: var(--apple-font-size-subheadline);
  font-weight: var(--apple-font-weight-semibold);
  color: var(--apple-text-primary);
}

.feature-desc {
  display: block;
  font-size: var(--apple-font-size-caption-1);
  line-height: 1.5;
  color: var(--apple-text-secondary);
}
</style>

