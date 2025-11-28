<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NDrawer, NDrawerContent, NDivider, NText, NButton, useDialog } from 'naive-ui';
import LanguageSwitcher from './LanguageSwitcher.vue';
import ThemeSwitcher from './ThemeSwitcher.vue';
import { useAppMessage } from '../composables/useMessage';

const { t } = useI18n();
const dialog = useDialog();

const props = defineProps<{
  show: boolean;
  showExit?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'exit'): void;
}>();

function handleExit() {
  dialog.warning({
    title: t('wallet.exitConfirm.title'),
    content: t('wallet.exitConfirm.content'),
    positiveText: t('wallet.exitConfirm.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: () => {
      emit('exit');
      try {
        const message = useAppMessage();
        message.success(t('wallet.exitSuccess'));
      } catch (error) {
        console.log('Exit successful');
      }
    },
  });
}

const showDrawer = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
});
</script>

<template>
  <n-drawer
    v-model:show="showDrawer"
    :width="320"
    placement="right"
    :mask-closable="true"
    class="settings-drawer"
  >
    <n-drawer-content :title="t('menu.title')" :closable="true">
      <div class="settings-content">
        <!-- 主题设置 -->
        <div class="settings-section">
          <n-text depth="3" class="settings-section-label">
            {{ t('settings.theme') }}
          </n-text>
          <ThemeSwitcher />
        </div>

        <n-divider />

        <!-- 语言设置 -->
        <div class="settings-section">
          <n-text depth="3" class="settings-section-label">
            {{ t('settings.language') }}
          </n-text>
          <LanguageSwitcher />
        </div>

        <!-- 退出钱包 -->
        <n-divider v-if="props.showExit" />

        <div v-if="props.showExit" class="settings-section">
          <n-button
            type="error"
            block
            size="large"
            class="exit-wallet-btn"
            @click="handleExit"
          >
            {{ t('wallet.exit') }}
          </n-button>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped>
.settings-drawer {
  z-index: 1000;
}

.settings-content {
  padding: var(--apple-spacing-md) 0;
}

.settings-section {
  margin-bottom: var(--apple-spacing-lg);
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section-label {
  display: block;
  font-size: var(--apple-font-size-footnote);
  font-weight: var(--apple-font-weight-medium);
  margin-bottom: var(--apple-spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--apple-text-tertiary);
}

.exit-wallet-btn {
  margin-top: var(--apple-spacing-md);
}

</style>
