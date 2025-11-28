<script setup lang="ts">
import { NCard, NButton, NText, NCollapse, NCollapseItem, NSkeleton } from 'naive-ui';
import { useWalletStore, type ChainType } from '../../stores/wallet';
import { useUIStore } from '../../stores/ui';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t } = useI18n();
const walletStore = useWalletStore();
const uiStore = useUIStore();

const chains = [
  { value: 'ETH' as ChainType, name: 'Ethereum', symbol: 'ETH' },
  { value: 'BTC' as ChainType, name: 'Bitcoin', symbol: 'BTC' },
  { value: 'BNB' as ChainType, name: 'BNB Chain', symbol: 'BNB' },
  { value: 'SOL' as ChainType, name: 'Solana', symbol: 'SOL' },
  { value: 'TRON' as ChainType, name: 'Tron', symbol: 'TRX' },
];

function getChainName(chain: ChainType): string {
  return chains.find(c => c.value === chain)?.name || chain;
}

function copyAddress(address: string, label: string) {
  navigator.clipboard.writeText(address).then(() => {
    uiStore.showSuccess(`${label} ${t('common.copy')} ${t('common.success')}`);
  });
}

const isLoadingAddress = computed(() => !walletStore.primaryAddress);
</script>

<template>
  <n-card class="address-card">
    <div class="address-header">
      <n-text depth="3" class="label">{{ t('wallet.myAddress') }}</n-text>
      <div class="chain-badge">
        <span class="chain-symbol">{{ chains.find(c => c.value === walletStore.selectedChain)?.symbol }}</span>
        <span>{{ getChainName(walletStore.selectedChain) }}</span>
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
      <code v-else class="address-text">{{ walletStore.primaryAddress }}</code>
      <n-button
        v-if="!isLoadingAddress"
        size="small"
        type="default"
        class="copy-btn"
        @click="copyAddress(walletStore.primaryAddress, t('wallet.myAddress'))"
      >
        {{ t('common.copy') }}
      </n-button>
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
            <code class="address-item-value">{{ addr.address }}</code>
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
  </n-card>
</template>

<style scoped>
.address-card {
  margin-bottom: 0;
  border-radius: var(--apple-radius-lg);
  box-shadow: var(--apple-shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 0.5px solid var(--apple-separator);
}

.address-card:hover {
  box-shadow: var(--apple-shadow-md);
  transform: translateY(-1px);
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--apple-spacing-sm);
}

.label {
  font-size: var(--apple-font-size-footnote);
  font-weight: var(--apple-font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chain-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--apple-spacing-xs);
  padding: var(--apple-spacing-xs) var(--apple-spacing-sm);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius-sm);
  font-size: var(--apple-font-size-caption-1);
  font-weight: var(--apple-font-weight-medium);
}

.chain-symbol {
  font-weight: var(--apple-font-weight-bold);
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

.address-text {
  flex: 1;
  font-family: var(--apple-font-mono);
  font-size: var(--apple-font-size-footnote);
  word-break: break-all;
  color: var(--apple-text-primary);
  line-height: 1.5;
  letter-spacing: 0.01em;
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

