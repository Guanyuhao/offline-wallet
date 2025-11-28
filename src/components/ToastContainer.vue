<script setup lang="ts">
import { useUIStore } from '../stores/ui';

const uiStore = useUIStore();

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    case 'info': return 'ℹ';
    default: return '';
  }
};
</script>

<template>
  <div class="toast-container" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="toast">
      <div
        v-for="toast in uiStore.toasts"
        :key="toast.id"
        :class="['toast', `toast--${toast.type}`]"
        role="alert"
      >
        <span class="toast__icon" aria-hidden="true">{{ getIcon(toast.type) }}</span>
        <span class="toast__message">{{ toast.message }}</span>
        <button
          class="toast__close"
          @click="uiStore.removeToast(toast.id)"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--spacing-6);
  right: var(--spacing-6);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 300px;
  max-width: 400px;
  padding: var(--spacing-4);
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  pointer-events: auto;
  border-left: 4px solid;
}

.toast--success {
  border-left-color: var(--color-success);
}

.toast--error {
  border-left-color: var(--color-error);
}

.toast--warning {
  border-left-color: var(--color-warning);
}

.toast--info {
  border-left-color: var(--color-info);
}

.toast__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.toast--success .toast__icon {
  color: var(--color-success);
}

.toast--error .toast__icon {
  color: var(--color-error);
}

.toast--warning .toast__icon {
  color: var(--color-warning);
}

.toast--info .toast__icon {
  color: var(--color-info);
}

.toast__message {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.toast__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.toast__close:hover {
  background-color: var(--color-hover);
  color: var(--text-primary);
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(50%);
}

/* Mobile */
@media (max-width: 640px) {
  .toast-container {
    left: var(--spacing-4);
    right: var(--spacing-4);
    top: var(--spacing-4);
  }
  
  .toast {
    min-width: auto;
    max-width: none;
  }
}
</style>

