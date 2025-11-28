<script setup lang="ts">
import { computed } from 'vue';
import { NEllipsis } from 'naive-ui';

const props = defineProps<{
  address: string;
  prefixLength?: number;
  suffixLength?: number;
  tooltip?: boolean;
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
  if (props.copyable) {
    emit('copy', props.address);
  }
}
</script>

<template>
  <n-ellipsis
    :tooltip="tooltip !== false"
    :line-clamp="1"
    style="max-width: 100%"
    @click="handleCopy"
  >
    <code class="address-ellipsis-text">{{ displayAddress }}</code>
  </n-ellipsis>
</template>

<style scoped>
.address-ellipsis-text {
  font-family: var(--apple-font-mono);
  font-size: var(--apple-font-size-footnote);
  color: var(--apple-text-primary);
  word-break: break-all;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s ease;
}

.address-ellipsis-text:hover {
  opacity: 0.7;
}

@media (max-width: 640px) {
  .address-ellipsis-text {
    font-size: var(--apple-font-size-caption-1);
  }
}
</style>

