<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NMenu } from 'naive-ui';
import { availableLanguages, setLanguage } from '../i18n';

const { locale } = useI18n();

const menuOptions = computed(() =>
  availableLanguages.map((lang) => ({
    label: lang.nativeName,
    key: lang.code,
  }))
);

function handleSelectLanguage(key: string) {
  setLanguage(key);
}
</script>

<template>
  <NMenu
    :options="menuOptions"
    :value="locale"
    class="language-menu"
    @update:value="handleSelectLanguage"
  />
</template>

<style scoped>
.language-menu {
  border-radius: var(--apple-radius-md);
  border: 0.5px solid var(--apple-separator);
}
</style>
