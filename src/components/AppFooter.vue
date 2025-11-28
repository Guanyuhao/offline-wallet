<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { NText } from 'naive-ui';

const { t } = useI18n();
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__content">
      <n-text depth="3" class="app-footer__text">
        {{ t('app.subtitle') }}
      </n-text>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: auto;
  border-top: 0.5px solid var(--apple-separator);
  background: var(--apple-bg-primary);
  flex-shrink: 0; /* 防止 footer 被压缩 */
}

.app-footer__content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--apple-spacing-md) var(--apple-spacing-lg);
  text-align: center;
}

.app-footer__text {
  font-size: var(--apple-font-size-caption-1);
}

@media (max-width: 640px) {
  .app-footer__content {
    padding: var(--apple-spacing-sm) var(--apple-spacing-md);
  }
}
</style>

