<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NDrawer, NDrawerContent, NSelect, NText } from 'naive-ui';
import { useUIStore, type ThemeType } from '../stores/ui';
import { availableLanguages, setLanguage } from '../i18n';

const { t, locale } = useI18n();
const uiStore = useUIStore();

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
}>();

const showDrawer = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
});

const themeOptions = [
  { label: t('theme.system'), value: 'auto' },
  { label: t('theme.light'), value: 'light' },
  { label: t('theme.dark'), value: 'dark' },
];

const languageOptions = availableLanguages.map((lang) => ({
  label: lang.nativeName,
  value: lang.code,
}));

function handleThemeChange(value: string) {
  uiStore.setTheme(value as ThemeType);
}

function handleLanguageChange(value: string) {
  setLanguage(value);
}
</script>

<template>
  <NDrawer
    v-model:show="showDrawer"
    :width="320"
    placement="right"
    :mask-closable="true"
    class="settings-drawer"
  >
    <NDrawerContent :title="t('menu.title')" :closable="true">
      <div class="settings-content">
        <!-- 主题设置 -->
        <div class="settings-section">
          <NText depth="3" class="settings-section-label">
            {{ t('settings.theme') }}
          </NText>
          <NSelect
            :value="uiStore.theme"
            :options="themeOptions"
            class="settings-select"
            @update:value="handleThemeChange"
          />
        </div>

        <!-- 语言设置 -->
        <div class="settings-section">
          <NText depth="3" class="settings-section-label">
            {{ t('settings.language') }}
          </NText>
          <NSelect
            :value="locale"
            :options="languageOptions"
            class="settings-select"
            @update:value="handleLanguageChange"
          />
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
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

.settings-select {
  width: 100%;
}
</style>
