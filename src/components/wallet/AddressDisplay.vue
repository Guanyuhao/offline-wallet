<script setup lang="ts">
import { ref, computed } from 'vue';
import { NCard, NButton, NText, NCollapse, NCollapseItem, NSkeleton, NDrawer, NDrawerContent } from 'naive-ui';
import { ChevronDownOutline } from '@vicons/ionicons5';
import { NIcon } from 'naive-ui';
import { useWalletStore, type ChainType } from '../../stores/wallet';
import { useUIStore } from '../../stores/ui';
import { useI18n } from 'vue-i18n';
import AddressEllipsis from '../common/AddressEllipsis.vue';

const { t } = useI18n();
const walletStore = useWalletStore();
const uiStore = useUIStore();

const showChainDrawer = ref(false);

const chains = [
  { value: 'BTC' as ChainType, name: 'Bitcoin', symbol: 'BTC', icon: '/icons/btc.png' },
  { value: 'ETH' as ChainType, name: 'Ethereum', symbol: 'ETH', icon: '/icons/eth.png' },
  { value: 'BNB' as ChainType, name: 'BNB Chain', symbol: 'BNB', icon: '/icons/bnb.png' },
  { value: 'SOL' as ChainType, name: 'Solana', symbol: 'SOL', icon: '/icons/sol.png' },
  { value: 'TRON' as ChainType, name: 'Tron', symbol: 'TRX', icon: '/icons/tron.png' },
];

function getChainName(chain: ChainType): string {
  return chains.find(c => c.value === chain)?.name || chain;
}

const currentChain = computed(() => {
  return chains.find(c => c.value === walletStore.selectedChain);
});

function copyAddress(address: string, label: string) {
  navigator.clipboard.writeText(address).then(() => {
    uiStore.showSuccess(`${label} ${t('common.copy')} ${t('common.success')}`);
  });
}

function handleSelectChain(chain: ChainType) {
  walletStore.setSelectedChain(chain);
  showChainDrawer.value = false;
}

const isLoadingAddress = computed(() => !walletStore.primaryAddress);
</script>

<template>
  <n-card class="address-card">
    <!-- 网络选择器 - 放在左上角 -->
    <div class="chain-selector-header">
      <div class="chain-selector-trigger" @click="showChainDrawer = true">
        <n-text depth="3" class="chain-label">{{ t('wallet.selectNetwork') }}</n-text>
        <n-icon :component="ChevronDownOutline" :size="16" class="chain-arrow" />
      </div>
      <div v-if="currentChain" class="current-chain-tag">
        <img
          v-if="currentChain.icon"
          :src="currentChain.icon"
          :alt="currentChain.name"
          class="chain-tag-icon"
        />
        <span class="chain-tag-text">{{ currentChain.symbol }}</span>
      </div>
    </div>

    <div class="address-display">
      <n-skeleton
        v-if="isLoadingAddress"
        :width="'100%'"
        :height="20"
        :animated="true"
        class="address-skeleton"
      />
      <div v-else class="address-content">
        <AddressEllipsis
          :address="walletStore.primaryAddress"
          :prefix-length="6"
          :suffix-length="4"
          :copyable="true"
          @copy="copyAddress(walletStore.primaryAddress, t('wallet.myAddress'))"
        />
        <n-button
          size="small"
          type="default"
          class="copy-btn"
          @click="copyAddress(walletStore.primaryAddress, t('wallet.myAddress'))"
        >
          {{ t('common.copy') }}
        </n-button>
      </div>
    </div>

    <n-collapse class="all-addresses-collapse">
      <n-collapse-item :title="t('wallet.showAllAddresses')" name="all">
        <div class="all-addresses-list">
          <div
            v-for="addr in walletStore.addresses"
            :key="addr.chain"
            class="address-item"
            :class="{ active: addr.chain === walletStore.selectedChain }"
            @click="walletStore.setSelectedChain(addr.chain)"
          >
            <div class="address-item-header">
              <span class="chain-symbol-small">{{ chains.find(c => c.value === addr.chain)?.symbol }}</span>
              <span class="chain-name-small">{{ getChainName(addr.chain) }}</span>
            </div>
            <AddressEllipsis
              :address="addr.address"
              :prefix-length="6"
              :suffix-length="4"
              :copyable="true"
              @copy="copyAddress(addr.address, getChainName(addr.chain))"
            />
            <n-button
              size="tiny"
              type="default"
              class="copy-btn-small"
              @click.stop="copyAddress(addr.address, getChainName(addr.chain))"
            >
              {{ t('common.copy') }}
            </n-button>
          </div>
        </div>
      </n-collapse-item>
    </n-collapse>

    <n-text depth="3" class="hint">{{ t('wallet.addressHint') }}</n-text>
    
    <!-- 网络选择 Drawer -->
    <n-drawer
      v-model:show="showChainDrawer"
      :width="'100%'"
      :height="'calc(100vh - 200px)'"
      placement="bottom"
      :mask-closable="true"
      :auto-focus="false"
      class="network-drawer"
    >
      <n-drawer-content :title="t('wallet.selectNetwork')" :closable="true">
        <div class="network-list">
          <div
            v-for="chain in chains"
            :key="chain.value"
            :class="['network-item', { 'network-item--active': walletStore.selectedChain === chain.value }]"
            @click="handleSelectChain(chain.value)"
          >
            <img
              :src="chain.icon"
              :alt="chain.name"
              class="network-item-icon"
            />
            <div class="network-item-info">
              <n-text strong class="network-item-name">{{ chain.name }}</n-text>
              <n-text depth="3" class="network-item-symbol">{{ chain.symbol }}</n-text>
            </div>
            <div v-if="walletStore.selectedChain === chain.value" class="network-item-check">
              ✓
            </div>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>
  </n-card>
</template>

<style scoped>
.address-card {
  margin-bottom: 0;
  border-radius: var(--apple-radius-lg);
  box-shadow: var(--apple-shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 0.5px solid var(--apple-separator);
  background: var(--apple-bg-primary);
}

.address-card:hover {
  box-shadow: var(--apple-shadow-md);
  transform: translateY(-2px);
  border-color: var(--apple-blue);
}

.chain-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--apple-spacing-md);
}

.chain-selector-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--apple-spacing-xs);
  cursor: pointer;
  padding: var(--apple-spacing-xs) var(--apple-spacing-sm);
  border-radius: var(--apple-radius-sm);
  transition: all 0.2s ease;
  user-select: none;
}

.chain-selector-trigger:hover {
  background: var(--apple-bg-secondary);
}

.chain-label {
  font-size: var(--apple-font-size-footnote);
  font-weight: var(--apple-font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chain-arrow {
  color: var(--apple-text-tertiary);
  transition: transform 0.2s ease;
}

.chain-selector-trigger:hover .chain-arrow {
  transform: translateY(2px);
}

.current-chain-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--apple-spacing-sm);
  padding: var(--apple-spacing-sm) var(--apple-spacing-md);
  border-radius: var(--apple-radius-md);
  font-weight: var(--apple-font-weight-medium);
  background: var(--apple-bg-secondary);
  border: 0.5px solid var(--apple-separator);
  transition: all 0.2s ease;
}

.current-chain-tag:hover {
  background: var(--apple-bg-tertiary);
  border-color: var(--apple-blue);
  transform: translateY(-1px);
  box-shadow: var(--apple-shadow-sm);
}

.chain-tag-icon {
  width: 20px;
  height: 20px;
  border-radius: var(--apple-radius-sm);
  object-fit: contain;
  flex-shrink: 0;
}

.chain-tag-text {
  font-size: var(--apple-font-size-body);
  font-weight: var(--apple-font-weight-semibold);
  color: var(--apple-text-primary);
}

.network-drawer {
  z-index: 1000;
}

.network-list {
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-xs);
  padding: var(--apple-spacing-md) 0;
}

.network-item {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-md);
  padding: var(--apple-spacing-md);
  border-radius: var(--apple-radius-md);
  cursor: pointer;
  transition: all var(--apple-transition-fast);
  background: var(--apple-bg-primary);
  border: 0.5px solid transparent;
}

.network-item:hover {
  background: var(--apple-bg-secondary);
}

.network-item--active {
  background: var(--apple-bg-secondary);
  border-color: var(--apple-blue);
}

.network-item-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--apple-radius-md);
  object-fit: contain;
  flex-shrink: 0;
}

.network-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.network-item-name {
  font-size: var(--apple-font-size-body);
  font-weight: var(--apple-font-weight-semibold);
  color: var(--apple-text-primary);
}

.network-item-symbol {
  font-size: var(--apple-font-size-caption-1);
}

.network-item-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--apple-blue);
  color: white;
  font-size: var(--apple-font-size-caption-1);
  font-weight: var(--apple-font-weight-bold);
  flex-shrink: 0;
}

.address-display {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-sm);
  background: var(--apple-bg-secondary);
  padding: var(--apple-spacing-md);
  border-radius: var(--apple-radius-md);
  margin-bottom: var(--apple-spacing-md);
  min-height: 56px;
  transition: all 0.2s ease;
  border: 0.5px solid transparent;
}

.address-display:hover {
  background: var(--apple-bg-tertiary);
  border-color: var(--apple-separator);
}

.address-skeleton {
  flex: 1;
}

.address-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-sm);
  min-width: 0; /* 允许 flex 子元素缩小 */
}

.copy-btn {
  flex-shrink: 0;
}

.all-addresses-collapse {
  margin-bottom: var(--apple-spacing-md);
}

.all-addresses-list {
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-sm);
  margin-top: var(--apple-spacing-sm);
}

.address-item {
  padding: var(--apple-spacing-sm);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius-sm);
  cursor: pointer;
  transition: all var(--apple-transition-fast);
  position: relative;
}

.address-item:hover {
  background: var(--apple-bg-tertiary);
}

.address-item.active {
  background: rgba(0, 122, 255, 0.1);
  border: 0.5px solid var(--apple-blue);
}

.address-item-header {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-xs);
  margin-bottom: var(--apple-spacing-xs);
}

.chain-symbol-small {
  font-weight: var(--apple-font-weight-bold);
  font-size: var(--apple-font-size-caption-1);
}

.chain-name-small {
  font-size: var(--apple-font-size-caption-1);
  font-weight: var(--apple-font-weight-medium);
}

.address-item-value {
  display: block;
  font-family: var(--apple-font-mono);
  font-size: var(--apple-font-size-caption-2);
  word-break: break-all;
  color: var(--apple-text-secondary);
  margin-bottom: var(--apple-spacing-xs);
}

.copy-btn-small {
  position: absolute;
  top: var(--apple-spacing-sm);
  right: var(--apple-spacing-sm);
}

.hint {
  display: block;
  font-size: var(--apple-font-size-caption-1);
  margin-top: var(--apple-spacing-sm);
  line-height: 1.5;
}
</style>

