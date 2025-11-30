<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { NTabs, NTabPane, NText } from 'naive-ui';
import { useWalletStore, type ChainType } from '../../stores/wallet';
import TransactionForm from './TransactionForm.vue';
import ReceivePage from './ReceivePage.vue';

const { t } = useI18n();
const walletStore = useWalletStore();
const activeTab = ref<'send' | 'receive'>('send');

/**
 * 查找包含目标元素的滚动容器
 */
function findScrollContainer(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    if (
      style.overflowY === 'auto' ||
      style.overflowY === 'scroll' ||
      style.overflow === 'auto' ||
      style.overflow === 'scroll'
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/**
 * 处理输入框聚焦时的滚动
 * 确保输入框在键盘弹起时可见
 */
function handleInputFocus(event: FocusEvent) {
  const target = event.target as HTMLElement;
  if (!target) return;

  // 延迟执行，等待键盘完全弹起
  setTimeout(() => {
    if (!window.visualViewport) return;

    const rect = target.getBoundingClientRect();
    const viewport = window.visualViewport;

    // 如果输入框被键盘遮挡
    if (rect.bottom > viewport.height) {
      // 计算需要滚动的距离
      const scrollOffset = rect.bottom - viewport.height + 20; // 20px 额外间距

      // 查找滚动容器
      const scrollContainer = findScrollContainer(target);

      if (scrollContainer) {
        // 滚动到可视区域
        scrollContainer.scrollBy({
          top: scrollOffset,
          behavior: 'smooth',
        });
      } else {
        // 如果没有找到滚动容器，尝试滚动窗口
        window.scrollBy({
          top: scrollOffset,
          behavior: 'smooth',
        });
      }
    }
  }, 300); // 等待键盘动画完成
}

onMounted(() => {
  // 监听所有输入框的聚焦事件
  const handleFocus = (e: FocusEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      handleInputFocus(e);
    }
  };

  document.addEventListener('focusin', handleFocus, true);

  onUnmounted(() => {
    document.removeEventListener('focusin', handleFocus, true);
  });
});

// 链信息配置
const chains = [
  { value: 'BTC' as ChainType, name: 'Bitcoin', displayName: 'Bitcoin' },
  { value: 'ETH' as ChainType, name: 'Ethereum', displayName: 'Ethereum' },
  { value: 'BNB' as ChainType, name: 'BNB Chain', displayName: 'BNB Smart Chain' },
  { value: 'SOL' as ChainType, name: 'Solana', displayName: 'Solana' },
  { value: 'TRON' as ChainType, name: 'Tron', displayName: 'Tron' },
];

// 当前网络显示名称
const currentNetworkName = computed(() => {
  const chain = chains.find((c) => c.value === walletStore.selectedChain);
  return chain?.displayName || chain?.name || walletStore.selectedChain;
});
</script>

<template>
  <div class="transaction-page">
    <!-- 当前网络显示 - 简化样式，参考图片设计 -->
    <div class="network-header">
      <NText strong class="network-name">{{ currentNetworkName }}</NText>
    </div>

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
  gap: var(--apple-spacing-md);
}

.network-header {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-xs);
  padding: 0 var(--apple-spacing-sm);
  margin-bottom: var(--apple-spacing-xs);
}

.network-label {
  font-size: var(--apple-font-size-caption-1);
  line-height: 1.2;
  color: var(--apple-text-tertiary);
}

.network-name {
  font-size: var(--apple-font-size-body);
  line-height: 1.2;
  color: var(--apple-text-primary);
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
  /* 确保内容区域可以正确滚动，避免键盘遮挡 */
  position: relative;
  /* 防止出现不合理区域 */
  contain: layout style paint;
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
