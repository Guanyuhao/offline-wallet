<script setup lang="ts">
import AccountPage from './AccountPage.vue';
import TransactionPage from './TransactionPage.vue';
import SettingsPage from './SettingsPage.vue';

defineProps<{
  activeTab: 'account' | 'transaction' | 'settings';
  showSettingsDrawer?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:showSettingsDrawer', value: boolean): void;
  (e: 'exit'): void;
}>();

function handleExit() {
  emit('exit');
}
</script>

<template>
  <div class="wallet-page">
    <AccountPage v-if="activeTab === 'account'" />
    <TransactionPage v-if="activeTab === 'transaction'" />
    <SettingsPage v-if="activeTab === 'settings'" @exit="handleExit" />
  </div>
</template>

<style scoped>
.wallet-page {
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
