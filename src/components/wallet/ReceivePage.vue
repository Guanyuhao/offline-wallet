<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { NCard, NButton, NText, NImage, NSkeleton, NTabs, NTabPane, NUpload, NUploadDragger, NInput } from 'naive-ui';
import { useWalletStore, type ChainType } from '../../stores/wallet';
import { useUIStore } from '../../stores/ui';
import { invoke } from '@tauri-apps/api/core';
import { usePlatform } from '../../composables/usePlatform';
import type { UploadFileInfo } from 'naive-ui';

const { t } = useI18n();
const walletStore = useWalletStore();
const uiStore = useUIStore();
const { isDesktop, isMobile } = usePlatform();

const activeTab = ref('yourQR');
const qrCode = ref('');
const isLoadingQR = ref(false);
const scannedResult = ref('');
const isScanning = ref(false);

const chains = [
  { value: 'ETH' as ChainType, name: 'Ethereum', symbol: 'ETH' },
  { value: 'BTC' as ChainType, name: 'Bitcoin', symbol: 'BTC' },
  { value: 'BNB' as ChainType, name: 'BNB Chain', symbol: 'BNB' },
  { value: 'SOL' as ChainType, name: 'Solana', symbol: 'SOL' },
  { value: 'TRON' as ChainType, name: 'Tron', symbol: 'TRX' },
];

function getChainDisplayName(chain: ChainType): string {
  const chainInfo = chains.find(c => c.value === chain);
  if (chain === 'BNB') return 'BNB Smart Chain';
  return chainInfo?.name || chain;
}

const currentAddress = computed(() => walletStore.primaryAddress);
const currentChainName = computed(() => getChainDisplayName(walletStore.selectedChain));

async function generateQRCode() {
  if (!currentAddress.value) return;
  
  isLoadingQR.value = true;
  try {
    qrCode.value = await invoke<string>('generate_qrcode_cmd', {
      data: currentAddress.value
    });
  } catch (error) {
    uiStore.showError(t('receive.generateQRFailed') + ': ' + error);
  } finally {
    isLoadingQR.value = false;
  }
}

function copyAddress() {
  if (!currentAddress.value) return;
  navigator.clipboard.writeText(currentAddress.value).then(() => {
    uiStore.showSuccess(t('receive.addressCopied'));
  });
}

function copyScannedResult() {
  if (!scannedResult.value) return;
  navigator.clipboard.writeText(scannedResult.value).then(() => {
    uiStore.showSuccess(t('common.copy') + ' ' + t('common.success'));
  });
}

function formatAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 20) return address;
  return `${address.slice(0, 10)}...${address.slice(-10)}`;
}

// 扫描二维码（桌面端：文件上传）
async function handleFileUpload(options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  const file = options.file.file;
  if (!file) return;

  isScanning.value = true;
  scannedResult.value = '';

  try {
    // 动态导入 jsQR（桌面端需要）
    let jsQR: any;
    try {
      // @ts-ignore - 动态导入
      const jsQRModule = await import('jsqr');
      jsQR = jsQRModule.default || jsQRModule;
    } catch (importError: any) {
      uiStore.showError('请先安装 jsQR: pnpm add jsqr');
      isScanning.value = false;
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          uiStore.showError(t('receive.scanQRFailed'));
          isScanning.value = false;
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          scannedResult.value = code.data;
          uiStore.showSuccess(t('receive.scanQRSuccess'));
        } else {
          uiStore.showError(t('receive.noQRCodeFound'));
        }
        isScanning.value = false;
      };
      img.onerror = () => {
        uiStore.showError(t('receive.scanQRFailed'));
        isScanning.value = false;
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      uiStore.showError(t('receive.scanQRFailed'));
      isScanning.value = false;
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Failed to load jsQR:', error);
    uiStore.showError(t('receive.scanQRFailed') + ': ' + error);
    isScanning.value = false;
  }
}

// 移动端摄像头扫描（需要安装 barcode-scanner 插件）
async function startCameraScan() {
  try {
    // 动态导入 barcode-scanner（移动端需要）
    let barcodeScanner: any;
    try {
      // @ts-ignore - 动态导入
      barcodeScanner = await import('@tauri-apps/plugin-barcode-scanner');
    } catch (importError: any) {
      uiStore.showError('请先安装 barcode-scanner 插件: pnpm tauri add barcode-scanner');
      return;
    }
    
    const { scan, Format } = barcodeScanner;
    const result = await scan({ 
      windowed: true, 
      formats: [Format.QRCode] 
    });
    scannedResult.value = result;
    uiStore.showSuccess(t('receive.scanQRSuccess'));
  } catch (error: any) {
    uiStore.showError(t('receive.scanQRFailed') + ': ' + (error.message || error));
  }
}

// 监听地址变化，自动生成二维码
watch(() => walletStore.primaryAddress, (newAddress) => {
  if (newAddress && activeTab.value === 'yourQR') {
    generateQRCode();
  } else {
    qrCode.value = '';
  }
}, { immediate: true });

// 监听网络变化，重新生成二维码
watch(() => walletStore.selectedChain, () => {
  if (currentAddress.value && activeTab.value === 'yourQR') {
    generateQRCode();
  }
});

// 监听标签页切换
watch(() => activeTab.value, (newTab) => {
  if (newTab === 'yourQR' && currentAddress.value) {
    generateQRCode();
  }
});
</script>

<template>
  <div class="receive-page">
    <n-card class="receive-card">
      <div class="receive-header">
        <n-text strong class="receive-title">{{ t('receive.title') }}</n-text>
        <n-text depth="3" class="network-name">{{ currentChainName }}</n-text>
      </div>

      <n-tabs v-model:value="activeTab" type="segment" class="receive-tabs">
        <!-- 扫描二维码标签页 -->
        <n-tab-pane name="scanQR" :tab="t('receive.scanQR')">
          <div class="scan-section">
            <!-- 桌面端：文件上传 -->
            <div v-if="isDesktop()" class="scan-desktop">
              <n-upload
                :file-list="[]"
                :max="1"
                accept="image/*"
                :on-change="handleFileUpload"
                :show-file-list="false"
              >
                <n-upload-dragger>
                  <div class="upload-content">
                    <n-text strong>{{ t('receive.selectImage') }}</n-text>
                    <n-text depth="3" class="upload-hint">{{ t('receive.scanQRHint') }}</n-text>
                  </div>
                </n-upload-dragger>
              </n-upload>
            </div>

            <!-- 移动端：摄像头扫描 -->
            <div v-else-if="isMobile()" class="scan-mobile">
              <n-button
                type="info"
                size="large"
                block
                :loading="isScanning"
                @click="startCameraScan"
              >
                {{ t('receive.scanQR') }}
              </n-button>
              <n-text depth="3" class="scan-hint">
                {{ t('receive.scanQRHint') }}
              </n-text>
            </div>

            <!-- 扫描结果 -->
            <div v-if="scannedResult" class="scan-result">
              <n-text strong class="result-label">{{ t('receive.scanQRSuccess') }}</n-text>
              <n-input
                :value="scannedResult"
                type="textarea"
                readonly
                :rows="3"
                class="result-text"
              />
              <n-button
                type="default"
                size="medium"
                block
                @click="copyScannedResult"
              >
                {{ t('common.copy') }}
              </n-button>
            </div>
          </div>
        </n-tab-pane>

        <!-- 您的二维码标签页 -->
        <n-tab-pane name="yourQR" :tab="t('receive.yourQR')">
          <div class="qr-container">
            <div v-if="isLoadingQR || !currentAddress" class="qr-skeleton">
              <n-skeleton
                :width="280"
                :height="280"
                :animated="true"
                class="qr-skeleton-item"
              />
            </div>
            <div v-else-if="qrCode" class="qr-code-wrapper">
              <n-image :src="qrCode" class="qr-image" />
            </div>
          </div>

          <div v-if="currentAddress" class="address-section">
            <n-text depth="3" class="account-label">{{ t('receive.accountLabel') }}</n-text>
            <div class="address-display">
              <n-text class="address-text">{{ formatAddress(currentAddress) }}</n-text>
            </div>
            <div class="address-full">
              <n-text class="address-full-text">{{ currentAddress }}</n-text>
            </div>
            <n-button
              type="default"
              size="medium"
              block
              class="copy-address-btn"
              @click="copyAddress"
            >
              {{ t('receive.copyAddress') }}
            </n-button>
          </div>

          <div v-else class="loading-section">
            <n-skeleton
              :width="'100%'"
              :height="20"
              :animated="true"
            />
            <n-skeleton
              :width="'80%'"
              :height="20"
              :animated="true"
              style="margin-top: 8px;"
            />
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<style scoped>
.receive-page {
  width: 100%;
}

.receive-card {
  border-radius: var(--apple-radius-lg);
  padding: var(--apple-spacing-xl);
}

.receive-header {
  text-align: center;
  margin-bottom: var(--apple-spacing-lg);
}

.receive-title {
  display: block;
  font-size: var(--apple-font-size-title-2);
  font-weight: var(--apple-font-weight-semibold);
  margin-bottom: var(--apple-spacing-xs);
  color: var(--apple-text-primary);
}

.network-name {
  display: block;
  font-size: var(--apple-font-size-subheadline);
  margin-top: var(--apple-spacing-xs);
}

.receive-tabs {
  margin-top: var(--apple-spacing-md);
}

:deep(.n-tabs-nav) {
  margin-bottom: var(--apple-spacing-lg);
}

.scan-section {
  padding: var(--apple-spacing-md) 0;
}

.scan-desktop {
  margin-bottom: var(--apple-spacing-lg);
}

.upload-content {
  text-align: center;
  padding: var(--apple-spacing-lg);
}

.upload-hint {
  display: block;
  margin-top: var(--apple-spacing-sm);
  font-size: var(--apple-font-size-caption-1);
}

.scan-mobile {
  text-align: center;
}

.scan-hint {
  display: block;
  margin-top: var(--apple-spacing-md);
  font-size: var(--apple-font-size-caption-1);
}

.scan-result {
  margin-top: var(--apple-spacing-xl);
  padding-top: var(--apple-spacing-lg);
  border-top: 0.5px solid var(--apple-separator);
}

.result-label {
  display: block;
  font-size: var(--apple-font-size-subheadline);
  margin-bottom: var(--apple-spacing-sm);
}

.result-text {
  margin-bottom: var(--apple-spacing-md);
  font-family: var(--apple-font-mono);
}

.qr-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: var(--apple-spacing-xl) 0;
  min-height: 300px;
}

.qr-skeleton {
  display: flex;
  justify-content: center;
  align-items: center;
}

.qr-skeleton-item {
  border-radius: var(--apple-radius-md);
}

.qr-code-wrapper {
  padding: var(--apple-spacing-md);
  background: var(--apple-bg-primary);
  border-radius: var(--apple-radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qr-image {
  width: 280px;
  height: 280px;
  border-radius: var(--apple-radius-md);
}

.address-section {
  margin-top: var(--apple-spacing-xl);
  text-align: center;
}

.account-label {
  display: block;
  font-size: var(--apple-font-size-caption-1);
  margin-bottom: var(--apple-spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.address-display {
  margin-bottom: var(--apple-spacing-sm);
}

.address-text {
  font-size: var(--apple-font-size-body);
  font-weight: var(--apple-font-weight-medium);
  color: var(--apple-text-primary);
  font-family: var(--apple-font-mono);
}

.address-full {
  margin-bottom: var(--apple-spacing-lg);
  padding: var(--apple-spacing-sm);
  background: var(--apple-bg-secondary);
  border-radius: var(--apple-radius-sm);
  word-break: break-all;
}

.address-full-text {
  font-size: var(--apple-font-size-caption-1);
  font-family: var(--apple-font-mono);
  color: var(--apple-text-secondary);
  line-height: 1.5;
}

.copy-address-btn {
  margin-top: var(--apple-spacing-md);
}

.loading-section {
  margin-top: var(--apple-spacing-xl);
  text-align: center;
}

@media (max-width: 480px) {
  .qr-image {
    width: 240px;
    height: 240px;
  }
  
  .qr-skeleton-item {
    width: 240px !important;
    height: 240px !important;
  }
}
</style>
