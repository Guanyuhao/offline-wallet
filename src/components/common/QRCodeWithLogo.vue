<script setup lang="ts">
import { ref, watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { NSkeleton } from 'naive-ui';

interface Props {
  value: string;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 280,
});

const qrCodeImage = ref<string>('');
const isLoading = ref(false);
const error = ref<string>('');

async function generateQRCode() {
  if (!props.value) {
    qrCodeImage.value = '';
    return;
  }

  isLoading.value = true;
  error.value = '';
  
  try {
    // 使用 Rust 方案生成带 logo 的二维码（logo 自动从 src-tauri/icons 目录加载）
    const result = await invoke<string>('generate_qrcode_with_logo_cmd', {
      data: props.value,
      logoPath: null,
    });
    qrCodeImage.value = result;
  } catch (err: any) {
    console.error('Failed to generate QR code:', err);
    error.value = err?.toString() || 'Failed to generate QR code';
    // 如果 Rust 方案失败，尝试不使用 logo
    try {
      const result = await invoke<string>('generate_qrcode_cmd', {
        data: props.value,
      });
      qrCodeImage.value = result;
    } catch (fallbackErr: any) {
      console.error('Fallback QR code generation also failed:', fallbackErr);
      error.value = fallbackErr?.toString() || 'Failed to generate QR code';
    }
  } finally {
    isLoading.value = false;
  }
}

// 监听 value 变化
watch(() => props.value, generateQRCode, { immediate: true });
</script>

<template>
  <div class="qr-code-container">
    <div v-if="isLoading" class="qr-skeleton">
      <n-skeleton
        :width="size"
        :height="size"
        :animated="true"
        class="qr-skeleton-item"
      />
    </div>
    <div v-else-if="error" class="qr-error">
      <n-text depth="3">{{ error }}</n-text>
    </div>
    <img
      v-else-if="qrCodeImage"
      :src="qrCodeImage"
      :width="size"
      :height="size"
      alt="QR Code"
      class="qr-code-image"
    />
  </div>
</template>

<style scoped>
.qr-code-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 280px;
}

.qr-skeleton {
  display: flex;
  justify-content: center;
  align-items: center;
}

.qr-skeleton-item {
  border-radius: var(--apple-radius-md);
}

.qr-error {
  text-align: center;
  padding: var(--apple-spacing-md);
  color: var(--apple-red);
}

.qr-code-image {
  border-radius: var(--apple-radius-md);
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
</style>

