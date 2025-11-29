<script setup lang="ts">
import { NSpin, NText } from 'naive-ui';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  size?: 'small' | 'medium' | 'large';
  text?: string;
}>();
</script>

<template>
  <div class="loading-state">
    <NSpin :size="size || 'medium'">
      <template #description>
        <NText v-if="text" depth="3">{{ text }}</NText>
        <NText v-else depth="3">{{ t('common.loading') }}</NText>
      </template>
    </NSpin>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--apple-spacing-xl);
  min-height: 200px;
}
</style>
