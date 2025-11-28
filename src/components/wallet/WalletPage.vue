<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton, NDrawer, NDrawerContent } from 'naive-ui';
import { CloseOutline } from '@vicons/ionicons5';
import { NIcon } from 'naive-ui';
import ChainSelector from './ChainSelector.vue';
import AddressDisplay from './AddressDisplay.vue';
import TransactionForm from './TransactionForm.vue';
import ReceivePage from './ReceivePage.vue';

const { t } = useI18n();
const showSendDrawer = ref(false);
const showReceiveDrawer = ref(false);
</script>

<template>
  <div class="wallet-page">
    <!-- 顶部区域：网络选择和地址显示 -->
    <div class="wallet-header">
      <ChainSelector />
      <AddressDisplay />
    </div>
    
    <!-- 操作按钮区域 -->
    <div class="wallet-actions">
      <n-button
        type="primary"
        size="large"
        block
        class="action-button"
        @click="showSendDrawer = true"
      >
        {{ t('wallet.send') }}
      </n-button>
      
      <n-button
        type="default"
        size="large"
        block
        class="action-button"
        @click="showReceiveDrawer = true"
      >
        {{ t('wallet.receive') }}
      </n-button>
    </div>

    <!-- 离线发送 Drawer -->
    <n-drawer
      v-model:show="showSendDrawer"
      :width="'100%'"
      :placement="'right'"
      :mask-closable="false"
      class="fullscreen-drawer"
    >
      <n-drawer-content>
        <template #header>
          <div class="drawer-header">
            <span class="drawer-title">{{ t('wallet.send') }}</span>
            <n-button
              quaternary
              circle
              size="large"
              @click="showSendDrawer = false"
            >
              <template #icon>
                <n-icon :component="CloseOutline" :size="24" />
              </template>
            </n-button>
          </div>
        </template>
        <TransactionForm @close="showSendDrawer = false" />
      </n-drawer-content>
    </n-drawer>

    <!-- 接收 Drawer -->
    <n-drawer
      v-model:show="showReceiveDrawer"
      :width="'100%'"
      :placement="'right'"
      :mask-closable="false"
      class="fullscreen-drawer"
    >
      <n-drawer-content>
        <template #header>
          <div class="drawer-header">
            <span class="drawer-title">{{ t('wallet.receive') }}</span>
            <n-button
              quaternary
              circle
              size="large"
              @click="showReceiveDrawer = false"
            >
              <template #icon>
                <n-icon :component="CloseOutline" :size="24" />
              </template>
            </n-button>
          </div>
        </template>
        <ReceivePage @close="showReceiveDrawer = false" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<style scoped>
.wallet-page {
  max-width: 480px;
  margin: 0 auto;
  padding: var(--apple-spacing-md);
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-lg);
  /* 确保内容可以正常滚动 */
  min-height: 0;
  flex: 1;
}

.wallet-header {
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-md);
}

.wallet-actions {
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-md);
}

.action-button {
  height: 56px;
  font-size: var(--apple-font-size-body);
  font-weight: var(--apple-font-weight-semibold);
  border-radius: var(--apple-radius-lg);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 var(--apple-spacing-sm);
}

.drawer-title {
  font-size: var(--apple-font-size-title-3);
  font-weight: var(--apple-font-weight-semibold);
  color: var(--apple-text-primary);
}

/* 全屏 Drawer 样式 */
:deep(.fullscreen-drawer .n-drawer) {
  width: 100% !important;
  max-width: 100% !important;
}

:deep(.fullscreen-drawer .n-drawer-content) {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

:deep(.fullscreen-drawer .n-drawer-body-content-wrapper) {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 响应式优化 */
@media (max-width: 480px) {
  .wallet-page {
    padding: var(--apple-spacing-sm);
    gap: var(--apple-spacing-md);
  }
}

@media (min-width: 768px) {
  .wallet-page {
    max-width: 600px;
    padding: var(--apple-spacing-xl);
  }
  
  :deep(.fullscreen-drawer .n-drawer) {
    width: 600px !important;
    max-width: 90vw !important;
  }
}
</style>
