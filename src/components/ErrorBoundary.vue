<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import { NResult, NButton, NCard } from 'naive-ui';
import { useI18n } from 'vue-i18n';

const { t: _t } = useI18n();

defineProps<{
  fallback?: () => any;
}>();

const emit = defineEmits<{
  (e: 'error', error: Error, instance: any, info: string): void;
}>();

const hasError = ref(false);
const error = ref<Error | null>(null);

onErrorCaptured((err: Error, instance: any, info: string) => {
  hasError.value = true;
  error.value = err;

  // 发送错误到监控服务
  console.error('ErrorBoundary caught an error:', err, info);
  emit('error', err, instance, info);

  // 阻止错误继续传播
  return false;
});

function handleReset() {
  hasError.value = false;
  error.value = null;
  window.location.reload();
}
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <NCard>
      <NResult
        status="error"
        :title="$t('error.boundary.title')"
        :description="$t('error.boundary.description')"
      >
        <template #footer>
          <NButton type="primary" @click="handleReset">
            {{ $t('error.boundary.reload') }}
          </NButton>
        </template>
      </NResult>

      <div v-if="error" class="error-details">
        <details>
          <summary>{{ $t('error.boundary.details') }}</summary>
          <pre>{{ error.message }}</pre>
          <pre v-if="error.stack">{{ error.stack }}</pre>
        </details>
      </div>
    </NCard>
  </div>
  <slot v-else />
</template>

<style scoped>
.error-boundary {
  padding: var(--apple-spacing-lg);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-details {
  margin-top: var(--apple-spacing-lg);
  padding: var(--apple-spacing-md);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius-md);
}

.error-details pre {
  margin: var(--apple-spacing-sm) 0;
  font-size: var(--apple-font-size-footnote);
  color: var(--apple-text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
}

.error-details details {
  cursor: pointer;
}

.error-details summary {
  margin-bottom: var(--apple-spacing-sm);
  font-weight: var(--apple-font-weight-medium);
  color: var(--apple-text-primary);
}
</style>
