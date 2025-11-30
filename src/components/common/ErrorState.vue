<script setup lang="ts">
import { NResult, NButton } from 'naive-ui';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  title?: string;
  description?: string;
  showRetry?: boolean;
}>();

const emit = defineEmits<{
  (e: 'retry'): void;
}>();
</script>

<template>
  <div class="error-state">
    <NResult
      status="error"
      :title="title || t('error.generic.title')"
      :description="description || t('error.generic.description')"
    >
      <template v-if="showRetry" #footer>
        <NButton type="primary" @click="emit('retry')">
          {{ t('error.generic.retry') }}
        </NButton>
      </template>
    </NResult>
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--apple-spacing-xl);
  min-height: 300px;
}
</style>
