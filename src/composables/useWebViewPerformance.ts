/**
 * WebView 性能监控和优化
 *
 * 参考：https://tech.meituan.com/2017/06/09/webviewperf.html
 */

import { invoke } from '@tauri-apps/api/core';
import { onMounted, onUnmounted } from 'vue';

export interface PerformanceMetrics {
  webview_init_time: number;
  page_load_time: number;
  first_contentful_paint: number | null;
  resource_load_times: Record<string, number>;
}

/**
 * WebView 性能监控 Composable
 */
export function useWebViewPerformance() {
  let performanceObserver: PerformanceObserver | null = null;

  /**
   * 记录页面加载开始时间
   */
  const recordPageLoadStart = () => {
    const startTime = performance.now();
    // 可以在这里记录到 Rust 后端
    console.log('Page load started at:', startTime);
  };

  /**
   * 记录首次内容绘制 (FCP) - 前端监控
   */
  const recordFCP = () => {
    try {
      const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[];
      const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');

      if (fcpEntry) {
        console.log('First Contentful Paint:', fcpEntry.startTime, 'ms');
        // 同时记录到 Rust 后端
        recordFirstContentfulPaint().catch(() => {
          // 忽略错误
        });
      }
    } catch (error) {
      console.warn('Failed to record FCP:', error);
    }
  };

  /**
   * 监控资源加载性能
   */
  const observeResourcePerformance = () => {
    try {
      // 监控资源加载
      performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart;

            // 只记录关键资源（CSS、JS、字体等）
            const isCriticalResource =
              resourceEntry.name.includes('.css') ||
              resourceEntry.name.includes('.js') ||
              resourceEntry.name.includes('.woff') ||
              resourceEntry.name.includes('.woff2') ||
              resourceEntry.name.includes('.ttf');

            if (isCriticalResource && loadTime > 100) {
              console.log(`Resource load: ${resourceEntry.name} - ${loadTime.toFixed(2)}ms`);
            }
          }
        }
      });

      performanceObserver.observe({ entryTypes: ['resource', 'paint'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  };

  /**
   * 获取性能指标
   */
  const getPerformanceMetrics = async (): Promise<PerformanceMetrics | null> => {
    try {
      const metrics = await invoke<PerformanceMetrics>('get_performance_metrics');
      return metrics;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return null;
    }
  };

  /**
   * 清除缓存
   */
  const clearCache = async (): Promise<void> => {
    try {
      await invoke('clear_cache');
      console.log('Cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  /**
   * 清除过期缓存
   */
  const clearExpiredCache = async (): Promise<void> => {
    try {
      await invoke('clear_expired_cache');
      console.log('Expired cache cleared');
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  };

  /**
   * 注入优化脚本
   */
  const injectOptimizationScript = async (
    scriptType: 'scroll' | 'memory' | 'resource' | 'all' = 'all'
  ): Promise<void> => {
    try {
      await invoke('inject_optimization_script', { scriptType });
      console.log(`Optimization script (${scriptType}) injected`);
    } catch (error) {
      console.error('Failed to inject optimization script:', error);
    }
  };

  /**
   * 记录页面加载完成
   */
  const recordPageLoad = async (): Promise<void> => {
    try {
      await invoke('record_page_load');
    } catch (error) {
      console.error('Failed to record page load:', error);
    }
  };

  /**
   * 记录首次内容绘制
   */
  const recordFirstContentfulPaint = async (): Promise<void> => {
    try {
      await invoke('record_first_contentful_paint');
    } catch (error) {
      console.error('Failed to record FCP:', error);
    }
  };

  /**
   * 优化图片加载
   */
  const optimizeImageLoading = () => {
    // 使用 Intersection Observer 实现懒加载
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      });

      // 观察所有带有 data-src 的图片
      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });
    }
  };

  /**
   * 预加载关键资源
   */
  const preloadCriticalResources = () => {
    const criticalResources: string[] = [
      // 可以在这里添加需要预加载的关键资源
      // '/wallet-logo.svg',
      // '/wallet-icon.svg',
    ];

    criticalResources.forEach((resource: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.svg') ? 'image' : 'fetch';
      document.head.appendChild(link);
    });
  };

  /**
   * 初始化性能监控
   */
  const init = () => {
    recordPageLoadStart();
    observeResourcePerformance();
    optimizeImageLoading();
    preloadCriticalResources();

    // 监听页面加载完成
    if (document.readyState === 'complete') {
      recordFCP();
      recordPageLoad().catch(() => {});
    } else {
      window.addEventListener('load', () => {
        recordFCP();
        recordPageLoad().catch(() => {});
      });
    }
  };

  /**
   * 清理
   */
  const cleanup = () => {
    if (performanceObserver) {
      performanceObserver.disconnect();
      performanceObserver = null;
    }
  };

  return {
    init,
    cleanup,
    getPerformanceMetrics,
    clearCache,
    clearExpiredCache,
    injectOptimizationScript,
    recordPageLoad,
    recordFirstContentfulPaint,
  };
}

/**
 * 自动初始化的性能监控（在 App.vue 中使用）
 */
export function useAutoWebViewPerformance() {
  const { init, cleanup } = useWebViewPerformance();

  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    cleanup();
  });
}
