<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  modelValue: string;
  type?: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  maxlength?: number;
  autocomplete?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
  rows: 3,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
}>();

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>();
const isFocused = ref(false);

const isTextarea = computed(() => props.type === 'textarea');

const inputClass = computed(() => [
  'base-input__field',
  {
    'base-input__field--error': props.error,
    'base-input__field--focused': isFocused.value,
  },
]);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  emit('update:modelValue', target.value);
};

const handleFocus = () => {
  isFocused.value = true;
  emit('focus');
};

const handleBlur = () => {
  isFocused.value = false;
  emit('blur');
};

const focus = () => {
  inputRef.value?.focus();
};

defineExpose({ focus });
</script>

<template>
  <div class="base-input">
    <label v-if="label" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required" aria-label="required">*</span>
    </label>
    
    <textarea
      v-if="isTextarea"
      ref="inputRef"
      :class="inputClass"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      :maxlength="maxlength"
      :autocomplete="autocomplete"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${$.uid}-error` : hint ? `${$.uid}-hint` : undefined"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    
    <input
      v-else
      ref="inputRef"
      :class="inputClass"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :maxlength="maxlength"
      :autocomplete="autocomplete"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${$.uid}-error` : hint ? `${$.uid}-hint` : undefined"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    
    <p v-if="hint && !error" :id="`${$.uid}-hint`" class="base-input__hint">
      {{ hint }}
    </p>
    
    <p v-if="error" :id="`${$.uid}-error`" class="base-input__error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.base-input {
  width: 100%;
}

.base-input__label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.base-input__required {
  color: var(--color-error);
  margin-left: var(--spacing-1);
}

.base-input__field {
  width: 100%;
  height: var(--input-height-base);
  padding: 0 var(--spacing-3);
  font-family: inherit;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background-color: var(--bg-primary);
  border: var(--input-border-width) solid var(--border-primary);
  border-radius: var(--radius-base);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

textarea.base-input__field {
  height: auto;
  padding: var(--spacing-3);
  resize: vertical;
  font-family: var(--font-family-mono);
  line-height: var(--line-height-relaxed);
}

.base-input__field:hover:not(:disabled) {
  border-color: var(--border-secondary);
}

.base-input__field:focus,
.base-input__field--focused {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.base-input__field--error {
  border-color: var(--color-error);
}

.base-input__field--error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.base-input__field:disabled {
  background-color: var(--bg-tertiary);
  color: var(--text-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}

.base-input__field::placeholder {
  color: var(--text-tertiary);
}

.base-input__hint {
  margin-top: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.base-input__error {
  margin-top: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
}
</style>

