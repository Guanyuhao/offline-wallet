<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { NTabs, NTabPane } from 'naive-ui';
import TransactionForm from './TransactionForm.vue';
import ReceivePage from './ReceivePage.vue';

const { t } = useI18n();
const activeTab = ref<'send' | 'receive'>('send');
</script>

<template>
  <div class="transaction-page">
    <NTabs v-model:value="activeTab" type="segment" class="transaction-tabs">
      <!-- 离线发送标签页 -->
      <NTabPane name="send" :tab="t('wallet.offlineSend')">
        <div class="tab-content">
          <TransactionForm />
        </div>
      </NTabPane>

      <!-- 离线接收标签页 -->
      <NTabPane name="receive" :tab="t('wallet.offlineReceive')">
        <div class="tab-content">
          <ReceivePage />
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.transaction-page {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: var(--apple-spacing-md);
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.transaction-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 标签页内容区域 */
.tab-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  /* 优化移动端滚动性能 */
  will-change: scroll-position;
  transform: translateZ(0);
  min-height: 0;
  padding: var(--apple-spacing-md) 0;
}

/* 标签页样式优化 */
:deep(.transaction-tabs .n-tabs-nav) {
  margin-bottom: var(--apple-spacing-md);
  padding: 0 var(--apple-spacing-sm);
}

:deep(.transaction-tabs .n-tabs-tab) {
  flex: 1;
  text-align: center;
  font-weight: var(--apple-font-weight-semibold);
}

:deep(.transaction-tabs .n-tabs-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.transaction-tabs .n-tabs-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 响应式优化 */
@media (max-width: 640px) {
  .transaction-page {
    padding: var(--apple-spacing-sm);
  }

  .tab-content {
    padding: var(--apple-spacing-sm) 0;
  }
}
</style>
