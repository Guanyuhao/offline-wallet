<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { availableLanguages, setLanguage } from '../i18n';

const { locale } = useI18n();

const currentLanguage = computed(() => {
  return availableLanguages.find(lang => lang.code === locale.value);
});

const handleLanguageChange = (langCode: string) => {
  setLanguage(langCode);
};
</script>

<template>
  <div class="language-switcher">
    <button
      v-for="lang in availableLanguages"
      :key="lang.code"
      :class="['language-switcher__button', { 'language-switcher__button--active': locale === lang.code }]"
      @click="handleLanguageChange(lang.code)"
      :aria-label="`Switch to ${lang.name}`"
      :aria-current="locale === lang.code"
    >
      {{ lang.nativeName }}
    </button>
  </div>
</template>

<style scoped>
.language-switcher {
  display: inline-flex;
  gap: var(--spacing-2);
  padding: var(--spacing-1);
  background-color: var(--bg-tertiary);
  border-radius: var(--radius-base);
}

.language-switcher__button {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.language-switcher__button:hover {
  color: var(--text-primary);
  background-color: var(--color-hover);
}

.language-switcher__button--active {
  color: white;
  background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-secondary-500) 100%);
  box-shadow: var(--shadow-sm);
}

.language-switcher__button:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
</style>

