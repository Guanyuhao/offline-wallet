<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton, NDrawer, NDrawerContent, NText } from 'naive-ui';
import { CloseOutline } from '@vicons/ionicons5';
import { NIcon } from 'naive-ui';
import { useWalletStore, type ChainType } from '../../stores/wallet';
import AddressDisplay from './AddressDisplay.vue';
import TransactionForm from './TransactionForm.vue';
import ReceivePage from './ReceivePage.vue';

const { t } = useI18n();
const walletStore = useWalletStore();
const showSendDrawer = ref(false);
const showReceiveDrawer = ref(false);

const chains = [
  { value: 'BTC' as ChainType, name: 'Bitcoin', symbol: 'BTC' },
  { value: 'ETH' as ChainType, name: 'Ethereum', symbol: 'ETH' },
  { value: 'BNB' as ChainType, name: 'BNB Smart Chain', symbol: 'BNB' },
  { value: 'SOL' as ChainType, name: 'Solana', symbol: 'SOL' },
  { value: 'TRON' as ChainType, name: 'Tron', symbol: 'TRX' },
];

function getChainDisplayName(chain: ChainType): string {
  const chainInfo = chains.find(c => c.value === chain);
  if (chain === 'BNB') return 'BNB Smart Chain';
  return chainInfo?.name || chain;
}

const currentChainName = computed(() => getChainDisplayName(walletStore.selectedChain));
</script>

<template>
  <div class="wallet-page">
    <!-- 顶部操作按钮：离线发送和接收 -->
    <div class="wallet-actions">
      <n-button
        type="primary"
        size="medium"
        class="action-button"
        @click="showSendDrawer = true"
      >
        {{ t('wallet.send') }}
      </n-button>
      
      <n-button
        type="default"
        size="medium"
        class="action-button"
        @click="showReceiveDrawer = true"
      >
        {{ t('wallet.receive') }}
      </n-button>
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
            <div class="drawer-title-section">
              <n-text strong class="drawer-title">{{ t('wallet.send') }}</n-text>
              <n-text depth="3" class="drawer-subtitle">{{ currentChainName }}</n-text>
            </div>
            <n-button
              quaternary
              circle
              size="large"
              class="drawer-close-btn"
              @click="showSendDrawer = false"
            >
              <template #icon>
                <n-icon :component="CloseOutline" :size="20" />
              </template>
            </n-button>
          </div>
        </template>
        <TransactionForm @close="showSendDrawer = false" />
      </n-drawer-content>
    </n-drawer>

    <!-- 离线接收 Drawer -->
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
            <div class="drawer-title-section">
              <n-text strong class="drawer-title">{{ t('wallet.receive') }}</n-text>
              <n-text depth="3" class="drawer-subtitle">{{ currentChainName }}</n-text>
            </div>
            <n-button
              quaternary
              circle
              size="large"
              class="drawer-close-btn"
              @click="showReceiveDrawer = false"
            >
              <template #icon>
                <n-icon :component="CloseOutline" :size="20" />
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

.wallet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--apple-spacing-md);
  margin-bottom: var(--apple-spacing-md);
}

.action-button {
  height: 48px;
  font-size: var(--apple-font-size-body);
  font-weight: var(--apple-font-weight-semibold);
  border-radius: var(--apple-radius-lg);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--apple-spacing-sm) var(--apple-spacing-md);
  position: sticky;
  top: 0;
  z-index: 10;
  min-height: 56px;
}

.drawer-title-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  flex: 1;
}

.drawer-title {
  font-size: var(--apple-font-size-title-3);
  font-weight: var(--apple-font-weight-semibold);
  color: var(--apple-text-primary);
  line-height: 1.2;
}

.drawer-subtitle {
  font-size: var(--apple-font-size-caption-1);
  color: var(--apple-text-secondary);
  line-height: 1.2;
}

.drawer-close-btn {
  min-width: 36px;
  min-height: 36px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.drawer-close-btn:hover {
  background: var(--apple-bg-secondary);
  transform: scale(1.1);
}

.drawer-close-btn:active {
  transform: scale(0.95);
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
  background: var(--apple-bg-primary);
}

:deep(.fullscreen-drawer .n-drawer-body-content-wrapper) {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--apple-spacing-md);
  max-width: 100%;
  box-sizing: border-box;
  background: var(--apple-bg-primary);
}

:deep(.fullscreen-drawer .n-drawer-body) {
  padding: 0;
  background: var(--apple-bg-primary);
}

:deep(.fullscreen-drawer .n-drawer-mask) {
  background: rgba(0, 0, 0, 0.3);
}

/* 桌面端最大宽度限制 */
@media (min-width: 768px) {
  :deep(.fullscreen-drawer .n-drawer) {
    max-width: 600px !important;
  }
  
  :deep(.fullscreen-drawer .n-drawer-content) {
    max-width: 600px;
    margin: 0 auto;
  }
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
