<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialog } from 'naive-ui';
import { useWalletStore } from '../stores/wallet';
import { useUIStore } from '../stores/ui';
import { clearAllWalletData } from '../composables/useWalletStorage';

const { t } = useI18n();
const walletStore = useWalletStore();
const uiStore = useUIStore();
const dialog = useDialog();

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'confirmed'): void;
}>();

let dialogInstance: { destroy: () => void } | null = null;
const isLoading = ref(false);

function showExitDialog() {
  isLoading.value = false;

  dialogInstance = dialog.warning({
    title: t('wallet.exitConfirm.title'),
    content: t('wallet.exitConfirm.content'),
    positiveText: t('wallet.exitConfirm.confirm'),
    negativeText: t('wallet.exitConfirm.cancel'),
    positiveButtonProps: {
      loading: isLoading.value,
    },
    onPositiveClick: async () => {
      // 用户确认退出，开始清除数据
      isLoading.value = true;

      try {
        // 清除所有数据（包括加密助记词和生物识别密码）
        walletStore.clearWallet();
        await clearAllWalletData();

        // 成功清除数据，关闭对话框
        isLoading.value = false;
        if (dialogInstance) {
          dialogInstance.destroy();
        }
        uiStore.showSuccess(t('wallet.exitSuccess'));
        emit('confirmed');
        emit('update:show', false);
        return true; // 允许对话框关闭
      } catch (error) {
        console.error('Failed to clear wallet data:', error);
        isLoading.value = false;
        uiStore.showError(t('wallet.exitConfirm.error'));
        return false; // 阻止对话框关闭，让用户重试
      }
    },
    onNegativeClick: () => {
      // 用户取消，放弃操作
      isLoading.value = false;
      emit('update:show', false);
      return true; // 允许对话框关闭
    },
  });
}

// 监听 show 变化，当变为 true 时显示对话框
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      showExitDialog();
    }
  }
);
</script>

<template>
  <div style="display: none"></div>
</template>
