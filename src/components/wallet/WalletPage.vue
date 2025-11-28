<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { NTabs, NTabPane } from 'naive-ui';
import ChainSelector from './ChainSelector.vue';
import AddressDisplay from './AddressDisplay.vue';
import TransactionForm from './TransactionForm.vue';
import ReceivePage from './ReceivePage.vue';

const { t } = useI18n();
const activeTab = ref('send');
</script>

<template>
  <div class="wallet-page">
    <!-- 顶部区域：网络选择和地址显示 -->
    <div class="wallet-header">
      <ChainSelector />
      <AddressDisplay />
    </div>
    
    <!-- 操作区域：发送/接收标签页 -->
    <div class="wallet-actions">
      <n-tabs 
        v-model:value="activeTab" 
        type="segment" 
        class="wallet-tabs"
        size="large"
      >
        <n-tab-pane name="send" :tab="t('wallet.send')">
          <div class="tab-content">
            <TransactionForm />
          </div>
        </n-tab-pane>
        <n-tab-pane name="receive" :tab="t('receive.title')">
          <div class="tab-content">
            <ReceivePage />
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>

<style scoped>
.wallet-page {
  max-width: 480px;
  margin: 0 auto;
  padding: var(--apple-spacing-md);
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-lg);
}

.wallet-header {
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-md);
  position: sticky;
  top: var(--apple-spacing-md);
  z-index: 10;
  background: var(--apple-bg-primary);
  padding-bottom: var(--apple-spacing-sm);
  margin-bottom: var(--apple-spacing-xs);
}

.wallet-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.wallet-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.n-tabs-nav) {
  margin-bottom: var(--apple-spacing-md);
  padding: var(--apple-spacing-xs);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius-lg);
}

:deep(.n-tabs-tab) {
  padding: var(--apple-spacing-sm) var(--apple-spacing-md);
  border-radius: var(--apple-radius-md);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: var(--apple-font-weight-medium);
}

:deep(.n-tabs-tab--active) {
  background: var(--apple-bg-primary);
  box-shadow: var(--apple-shadow-sm);
  color: var(--apple-text-primary);
}

:deep(.n-tabs-pane-wrapper) {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式优化 */
@media (max-width: 480px) {
  .wallet-page {
    padding: var(--apple-spacing-sm);
    gap: var(--apple-spacing-md);
  }
  
  .wallet-header {
    position: relative;
    top: 0;
  }
}

@media (min-width: 768px) {
  .wallet-page {
    max-width: 600px;
    padding: var(--apple-spacing-xl);
  }
}

/* 深色模式优化 */
.dark :deep(.n-tabs-nav) {
  background: var(--apple-gray-dark-2);
}

.dark :deep(.n-tabs-tab--active) {
  background: var(--apple-gray-dark-1);
  color: var(--apple-text-primary);
}
</style>
