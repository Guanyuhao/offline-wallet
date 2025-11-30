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
  largest_contentful_paint: number | null;
  cumulative_layout_shift: number | null;
  first_input_delay: number | null;
  time_to_interactive: number | null;
  resource_load_times: Record<string, number>;
  memory_usage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
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
   * 记录 Web Vitals 指标
   */
  const recordWebVitals = () => {
    try {
      // FCP - First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[];
      const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        console.log('First Contentful Paint:', fcpEntry.startTime, 'ms');
        recordFirstContentfulPaint().catch(() => {});
      }

      // LCP - Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            if (lastEntry) {
              console.log(
                'Largest Contentful Paint:',
                lastEntry.renderTime || lastEntry.loadTime,
                'ms'
              );
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // LCP not supported
        }
      }

      // CLS - Cumulative Layout Shift
      if ('PerformanceObserver' in window) {
        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            console.log('Cumulative Layout Shift:', clsValue);
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          // CLS not supported
        }
      }

      // FID - First Input Delay
      if ('PerformanceObserver' in window) {
        try {
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const fid = (entry as any).processingStart - entry.startTime;
              console.log('First Input Delay:', fid, 'ms');
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          // FID not supported
        }
      }
    } catch (error) {
      console.warn('Failed to record Web Vitals:', error);
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
      const imageObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                // 添加加载状态
                img.classList.add('loading');

                // 预加载图片
                const imageLoader = new Image();
                imageLoader.onload = () => {
                  img.src = img.dataset.src!;
                  img.classList.remove('loading');
                  img.classList.add('loaded');
                  img.removeAttribute('data-src');
                  observer.unobserve(img);
                };
                imageLoader.onerror = () => {
                  img.classList.remove('loading');
                  img.classList.add('error');
                };
                imageLoader.src = img.dataset.src;
              }
            }
          });
        },
        {
          rootMargin: '50px', // 提前 50px 开始加载
          threshold: 0.01,
        }
      );

      // 观察所有带有 data-src 的图片
      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });

      // 动态添加的图片也需要观察
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              const lazyImages = element.querySelectorAll('img[data-src]');
              lazyImages.forEach((img) => {
                imageObserver.observe(img);
              });
            }
          });
        });
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
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
   * 优化滚动性能
   */
  const optimizeScrollPerformance = () => {
    // 使用 passive 事件监听器优化滚动
    let ticking = false;
    const optimizedScrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // 滚动处理逻辑可以在这里添加
          ticking = false;
        });
        ticking = true;
      }
    };

    // 检测 passive 支持
    let passiveSupported = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get() {
          passiveSupported = true;
          return true;
        },
      });
      window.addEventListener('test', null as any, opts);
    } catch (e) {
      // passive not supported
    }

    // 添加 passive 滚动监听器
    const scrollOptions = passiveSupported ? { passive: true } : false;
    window.addEventListener('scroll', optimizedScrollHandler, scrollOptions);
    window.addEventListener('touchmove', optimizedScrollHandler, scrollOptions);

    // 优化长列表渲染
    if ('IntersectionObserver' in window) {
      const listObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        },
        { rootMargin: '100px' }
      );

      document.querySelectorAll('.list-item').forEach((item) => {
        listObserver.observe(item);
      });
    }
  };

  /**
   * 内存监控和优化
   */
  const monitorMemory = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const checkMemory = () => {
        const usedMB = memory.usedJSHeapSize / 1048576;
        const limitMB = memory.jsHeapSizeLimit / 1048576;
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

        if (usagePercent > 80) {
          console.warn(
            `Memory usage high: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB (${usagePercent.toFixed(1)}%)`
          );

          // 触发垃圾回收（如果可用）
          if ('gc' in window && typeof (window as any).gc === 'function') {
            (window as any).gc();
          }
        }
      };

      // 每30秒检查一次内存
      setInterval(checkMemory, 30000);
    }
  };

  /**
   * 初始化性能监控
   */
  const init = () => {
    recordPageLoadStart();
    observeResourcePerformance();
    optimizeImageLoading();
    preloadCriticalResources();
    optimizeScrollPerformance();
    monitorMemory();

    // 监听页面加载完成
    if (document.readyState === 'complete') {
      recordWebVitals();
      recordPageLoad().catch(() => {});
    } else {
      window.addEventListener('load', () => {
        recordWebVitals();
        recordPageLoad().catch(() => {});
      });
    }

    // DOMContentLoaded 时就开始记录
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        recordWebVitals();
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
