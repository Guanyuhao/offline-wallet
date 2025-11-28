<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  fullWidth: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const buttonClass = computed(() => [
  'base-button',
  `base-button--${props.variant}`,
  `base-button--${props.size}`,
  { 
    'base-button--full-width': props.fullWidth,
    'base-button--loading': props.loading 
  },
]);

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<template>
  <button
    :class="buttonClass"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :aria-busy="loading"
    @click="handleClick"
  >
    <span v-if="loading" class="base-button__spinner" aria-hidden="true"></span>
    <span v-if="icon && !loading" class="base-button__icon" aria-hidden="true">{{ icon }}</span>
    <span class="base-button__content">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.base-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  text-align: center;
  border: none;
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
  white-space: nowrap;
}

/* Sizes */
.base-button--sm {
  height: var(--button-height-sm);
  padding: 0 var(--spacing-3);
  font-size: var(--font-size-sm);
}

.base-button--md {
  height: var(--button-height-base);
  padding: 0 var(--spacing-4);
  font-size: var(--font-size-base);
}

.base-button--lg {
  height: var(--button-height-lg);
  padding: 0 var(--spacing-6);
  font-size: var(--font-size-lg);
}

/* Variants */
.base-button--primary {
  background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-secondary-500) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.base-button--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.base-button--primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.base-button--secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.base-button--secondary:hover:not(:disabled) {
  background-color: var(--color-hover);
}

.base-button--outline {
  background-color: transparent;
  color: var(--color-primary-500);
  border: 2px solid var(--color-primary-500);
}

.base-button--outline:hover:not(:disabled) {
  background-color: var(--color-primary-50);
}

.dark .base-button--outline:hover:not(:disabled) {
  background-color: rgba(126, 160, 255, 0.1);
}

.base-button--ghost {
  background-color: transparent;
  color: var(--text-secondary);
}

.base-button--ghost:hover:not(:disabled) {
  background-color: var(--color-hover);
  color: var(--text-primary);
}

.base-button--danger {
  background-color: var(--color-error);
  color: white;
  box-shadow: var(--shadow-sm);
}

.base-button--danger:hover:not(:disabled) {
  background-color: var(--color-error-dark);
  box-shadow: var(--shadow-md);
}

/* States */
.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.base-button:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.base-button--full-width {
  width: 100%;
}

.base-button--loading {
  pointer-events: none;
}

/* Spinner */
.base-button__spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.base-button__icon {
  font-size: 1.2em;
  line-height: 1;
}

.base-button__content {
  display: inline-flex;
  align-items: center;
}
</style>

