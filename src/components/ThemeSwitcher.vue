<script setup lang="ts">
import { computed, h } from 'vue';
import { useI18n } from 'vue-i18n';
import { NMenu } from 'naive-ui';
import { useUIStore, type ThemeType } from '../stores/ui';

const { t } = useI18n();
const uiStore = useUIStore();

const menuOptions = computed(() => [
  {
    label: () => h('span', { style: 'display: flex; align-items: center; gap: 8px;' }, [
      h('span', '◐'),
      h('span', t('theme.system'))
    ]),
    key: 'auto',
  },
  {
    label: () => h('span', { style: 'display: flex; align-items: center; gap: 8px;' }, [
      h('span', '○'),
      h('span', t('theme.light'))
    ]),
    key: 'light',
  },
  {
    label: () => h('span', { style: 'display: flex; align-items: center; gap: 8px;' }, [
      h('span', '●'),
      h('span', t('theme.dark'))
    ]),
    key: 'dark',
  },
]);

function handleSelectTheme(key: string) {
  uiStore.setTheme(key as ThemeType);
}
</script>

<template>
  <n-menu
    :options="menuOptions"
    :value="uiStore.theme"
    @update:value="handleSelectTheme"
    class="theme-menu"
  />
</template>

<style scoped>
.theme-menu {
  border-radius: var(--apple-radius-md);
  border: 0.5px solid var(--apple-separator);
}
</style>
