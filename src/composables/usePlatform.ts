import { ref, onMounted } from 'vue';

export type PlatformType = 'desktop' | 'mobile' | 'unknown';

const platform = ref<PlatformType>('unknown');

export function usePlatform() {
  function detectPlatform() {
    try {
      // 在 Tauri 环境中，优先检查 Tauri 元数据
      const tauriMetadata = (window as any).__TAURI_METADATA__;
      if (tauriMetadata?.platform === 'ios' || tauriMetadata?.platform === 'android') {
        platform.value = 'mobile';
        return;
      }
      
      // 通过 user agent 判断
      const userAgent = navigator.userAgent.toLowerCase();
      
      // 检查是否是移动设备
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // 检查屏幕尺寸（移动端通常小于 768px）
      const isMobileScreen = window.innerWidth < 768;
      
      if (isMobileUA || isMobileScreen) {
        platform.value = 'mobile';
      } else {
        platform.value = 'desktop';
      }
    } catch (error) {
      // 如果不在 Tauri 环境中，根据屏幕尺寸判断
      const isMobileScreen = window.innerWidth < 768;
      platform.value = isMobileScreen ? 'mobile' : 'desktop';
    }
  }

  // 立即检测，不等待 mounted
  detectPlatform();
  
  // 监听窗口大小变化
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', detectPlatform);
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

