<script setup lang="ts">
import { NEmpty, NButton, NText } from 'naive-ui';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  title?: string;
  description?: string;
  actionText?: string;
  showAction?: boolean;
}>();

const emit = defineEmits<{
  (e: 'action'): void;
}>();
</script>

<template>
  <div class="empty-state">
    <NEmpty :description="description || t('common.empty')" :size="'medium'">
      <template #extra>
        <div v-if="title" style="margin-top: 12px">
          <NText strong>{{ title }}</NText>
        </div>
        <NButton
          v-if="showAction && actionText"
          type="primary"
          style="margin-top: 12px"
          @click="emit('action')"
        >
          {{ actionText }}
        </NButton>
      </template>
    </NEmpty>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--apple-spacing-xl);
  min-height: 300px;
}
</style>
