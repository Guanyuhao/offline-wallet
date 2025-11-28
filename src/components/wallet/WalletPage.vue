<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { NCard, NDrawer, NDrawerContent } from 'naive-ui';
import { CloseOutline } from '@vicons/ionicons5';
import { NIcon, NText } from 'naive-ui';
import AddressDisplay from './AddressDisplay.vue';
import TransactionForm from './TransactionForm.vue';
import ReceivePage from './ReceivePage.vue';

const { t } = useI18n();
const showSendDrawer = ref(false);
const showReceiveDrawer = ref(false);
</script>

<template>
  <div class="wallet-page">
    <!-- 顶部操作卡片：离线发送和接收 -->
    <div class="wallet-actions">
      <n-card class="action-card" @click="showSendDrawer = true">
        <div class="action-card-content">
          <n-text strong class="action-card-title">{{ t('wallet.send') }}</n-text>
          <n-text depth="3" class="action-card-subtitle">{{ t('wallet.offlineSend') }}</n-text>
        </div>
      </n-card>
      
      <n-card class="action-card" @click="showReceiveDrawer = true">
        <div class="action-card-content">
          <n-text strong class="action-card-title">{{ t('wallet.receive') }}</n-text>
          <n-text depth="3" class="action-card-subtitle">{{ t('wallet.offlineReceive') }}</n-text>
        </div>
      </n-card>
    </div>
    
    <!-- 地址显示区域 -->
    <AddressDisplay />

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

.wallet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--apple-spacing-md);
  margin-bottom: var(--apple-spacing-md);
}

.action-card {
  cursor: pointer;
  border-radius: var(--apple-radius-lg);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 0.5px solid var(--apple-separator);
  padding: var(--apple-spacing-md);
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--apple-shadow-md);
  border-color: var(--apple-blue);
}

.action-card-content {
  text-align: center;
  width: 100%;
}

.action-card-title {
  display: block;
  font-size: var(--apple-font-size-body);
  font-weight: var(--apple-font-weight-semibold);
  margin-bottom: var(--apple-spacing-xs);
  color: var(--apple-text-primary);
}

.action-card-subtitle {
  display: block;
  font-size: var(--apple-font-size-caption-1);
  color: var(--apple-text-secondary);
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
