<script setup lang="ts">
import { ref, computed } from 'vue';
import { NCard, NButton, NText, NDrawer, NDrawerContent } from 'naive-ui';
import { useWalletStore, type ChainType } from '../../stores/wallet';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const walletStore = useWalletStore();

const showDrawer = ref(false);

const chains = [
  { value: 'BTC' as ChainType, name: 'Bitcoin', symbol: 'BTC', icon: '/icons/btc.png' },
  { value: 'ETH' as ChainType, name: 'Ethereum', symbol: 'ETH', icon: '/icons/eth.png' },
  { value: 'BNB' as ChainType, name: 'BNB Chain', symbol: 'BNB', icon: '/icons/bnb.png' },
  { value: 'SOL' as ChainType, name: 'Solana', symbol: 'SOL', icon: '/icons/sol.png' },
  { value: 'TRON' as ChainType, name: 'Tron', symbol: 'TRX', icon: '/icons/tron.png' },
];

const currentChain = computed(() => {
  return chains.find((c) => c.value === walletStore.selectedChain);
});

function handleSelectChain(chain: ChainType) {
  walletStore.setSelectedChain(chain);
  showDrawer.value = false;
}

function openDrawer() {
  showDrawer.value = true;
}
</script>

<template>
  <NCard class="chain-selector-card">
    <NText depth="3" class="label">{{ t('wallet.selectNetwork') }}</NText>
    <NButton block class="network-selector-btn" @click="openDrawer">
      <div class="network-selector-content">
        <img
          v-if="currentChain"
          :src="currentChain.icon"
          :alt="currentChain.name"
          class="network-icon"
        />
        <div class="network-info">
          <NText strong class="network-name">{{ currentChain?.name }}</NText>
          <NText depth="3" class="network-symbol">{{ currentChain?.symbol }}</NText>
        </div>
        <NText depth="3" class="network-arrow">›</NText>
      </div>
    </NButton>
  </NCard>

  <NDrawer
    v-model:show="showDrawer"
    :width="'100%'"
    :height="'calc(100vh - 200px)'"
    placement="bottom"
    :mask-closable="true"
    :auto-focus="false"
    class="network-drawer"
  >
    <NDrawerContent :title="t('wallet.selectNetwork')" :closable="true">
      <div class="network-list">
        <div
          v-for="chain in chains"
          :key="chain.value"
          :class="[
            'network-item',
            { 'network-item--active': walletStore.selectedChain === chain.value },
          ]"
          @click="handleSelectChain(chain.value)"
        >
          <img :src="chain.icon" :alt="chain.name" class="network-item-icon" />
          <div class="network-item-info">
            <NText strong class="network-item-name">{{ chain.name }}</NText>
            <NText depth="3" class="network-item-symbol">{{ chain.symbol }}</NText>
          </div>
          <div v-if="walletStore.selectedChain === chain.value" class="network-item-check">✓</div>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.chain-selector-card {
  margin-bottom: 0;
  border-radius: var(--apple-radius-lg);
  box-shadow: var(--apple-shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 0.5px solid var(--apple-separator);
}

.chain-selector-card:hover {
  box-shadow: var(--apple-shadow-md);
  transform: translateY(-1px);
}

.label {
  display: block;
  font-size: var(--apple-font-size-footnote);
  font-weight: var(--apple-font-weight-medium);
  margin-bottom: var(--apple-spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.network-selector-btn {
  margin-top: var(--apple-spacing-sm);
  padding: var(--apple-spacing-md);
  height: auto;
  min-height: 64px;
  border-radius: var(--apple-radius-md);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 0.5px solid var(--apple-separator);
}

.network-selector-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--apple-shadow-sm);
}

.network-selector-content {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-md);
  width: 100%;
}

.network-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--apple-radius-md);
  object-fit: contain;
  flex-shrink: 0;
}

.network-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.network-name {
  font-size: var(--apple-font-size-subheadline);
  font-weight: var(--apple-font-weight-semibold);
  color: var(--apple-text-primary);
}

.network-symbol {
  font-size: var(--apple-font-size-caption-1);
}

.network-arrow {
  font-size: var(--apple-font-size-title-2);
  line-height: 1;
  color: var(--apple-text-tertiary);
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
</style>
