<script setup lang="ts">
// 账户页面：显示地址和网络选择
import AddressDisplay from './AddressDisplay.vue';
</script>

<template>
  <div class="account-page">
    <AddressDisplay />
  </div>
</template>

<style scoped>
.account-page {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: var(--apple-spacing-md);
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 640px) {
  .account-page {
    padding: var(--apple-spacing-sm);
  }
}
</style>
