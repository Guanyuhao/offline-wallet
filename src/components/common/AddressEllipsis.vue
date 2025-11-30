<script setup lang="ts">
import { computed } from 'vue';
import { NText, NPopover } from 'naive-ui';

const props = defineProps<{
  address: string;
  prefixLength?: number;
  suffixLength?: number;
  copyable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'copy', address: string): void;
}>();

const prefixLength = computed(() => props.prefixLength ?? 6);
const suffixLength = computed(() => props.suffixLength ?? 4);

const displayAddress = computed(() => {
  if (!props.address) return '';
  if (props.address.length <= prefixLength.value + suffixLength.value + 3) {
    return props.address;
  }
  const prefix = props.address.slice(0, prefixLength.value);
  const suffix = props.address.slice(-suffixLength.value);
  return `${prefix}...${suffix}`;
});

function handleCopy() {
  if (props.copyable && props.address) {
    emit('copy', props.address);
  }
}
</script>

<template>
  <NPopover
    v-if="props.address && props.address.length > prefixLength + suffixLength + 3"
    trigger="hover"
  >
    <template #trigger>
      <NText class="address-ellipsis-text" :class="{ 'is-copyable': copyable }" @click="handleCopy">
        {{ displayAddress }}
      </NText>
    </template>
    <code class="address-full">{{ address }}</code>
  </NPopover>
  <NText
    v-else
    class="address-ellipsis-text"
    :class="{ 'is-copyable': copyable }"
    @click="handleCopy"
  >
    {{ displayAddress }}
  </NText>
</template>

<style scoped>
.address-ellipsis-text {
  font-family: var(--apple-font-mono);
  font-size: var(--apple-font-size-footnote);
  color: var(--apple-text-primary);
  word-break: break-all;
  user-select: text;
}

.address-ellipsis-text.is-copyable {
  cursor: copy;
  transition: opacity 0.2s ease;
}

.address-ellipsis-text.is-copyable:hover {
  opacity: 0.7;
}

.address-full {
  font-family: var(--apple-font-mono);
  font-size: var(--apple-font-size-caption-1);
  word-break: break-all;
  max-width: 300px;
  display: block;
}

@media (max-width: 640px) {
  .address-ellipsis-text {
    font-size: var(--apple-font-size-caption-1);
  }

  .address-full {
    max-width: 250px;
  }
}
</style>
