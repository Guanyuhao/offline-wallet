import { ref, onMounted } from 'vue';

export type PlatformType = 'desktop' | 'mobile' | 'unknown';

const platform = ref<PlatformType>('unknown');

export function usePlatform() {
  function detectPlatform() {
    try {
      // 通过 user agent 判断
      const userAgent = navigator.userAgent.toLowerCase();
      
      // 检查是否是移动设备
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // 在 Tauri 环境中，可以通过检查 window 对象来判断
      const tauriMetadata = (window as any).__TAURI_METADATA__;
      const isTauriMobile = tauriMetadata?.platform === 'ios' || tauriMetadata?.platform === 'android';
      
      if (isMobileUA || isTauriMobile) {
        platform.value = 'mobile';
      } else {
        platform.value = 'desktop';
      }
    } catch (error) {
      // 如果不在 Tauri 环境中，默认为桌面端
      platform.value = 'desktop';
    }
  }

  onMounted(() => {
    detectPlatform();
  });

  return {
    platform,
    isDesktop: () => platform.value === 'desktop',
    isMobile: () => platform.value === 'mobile',
  };
}

