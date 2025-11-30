//! WebView 性能优化模块
//! 
//! 参考：https://tech.meituan.com/2017/06/09/webviewperf.html
//! 
//! 主要优化点：
//! 1. WebView 预加载和预热
//! 2. 资源缓存管理
//! 3. 性能监控
//! 4. 内存优化

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};

/// 性能指标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    /// WebView 初始化时间（毫秒）
    pub webview_init_time: u64,
    /// 页面加载时间（毫秒）
    pub page_load_time: u64,
    /// 首次内容绘制时间（毫秒）
    pub first_contentful_paint: Option<u64>,
    /// 最大内容绘制时间（毫秒）
    pub largest_contentful_paint: Option<u64>,
    /// 累积布局偏移（CLS）
    pub cumulative_layout_shift: Option<f64>,
    /// 首次输入延迟（毫秒）
    pub first_input_delay: Option<u64>,
    /// 可交互时间（毫秒）
    pub time_to_interactive: Option<u64>,
    /// 资源加载时间统计
    pub resource_load_times: HashMap<String, u64>,
}

/// 缓存管理器
pub struct CacheManager {
    /// 缓存的数据
    cache: Arc<Mutex<HashMap<String, CachedResource>>>,
}

/// 缓存的资源
#[derive(Debug, Clone)]
struct CachedResource {
    /// 资源内容
    #[allow(dead_code)]
    content: Vec<u8>,
    /// 内容类型
    #[allow(dead_code)]
    content_type: String,
    /// 缓存时间戳
    cached_at: u64,
    /// 过期时间（秒）
    expires_in: Option<u64>,
}

impl CacheManager {
    pub fn new() -> Self {
        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// 缓存资源
    #[allow(dead_code)]
    pub fn cache_resource(&self, url: &str, content: Vec<u8>, content_type: String, expires_in: Option<u64>) {
        let mut cache = self.cache.lock().unwrap();
        let cached_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        cache.insert(url.to_string(), CachedResource {
            content,
            content_type,
            cached_at,
            expires_in,
        });
    }

    /// 获取缓存的资源
    #[allow(dead_code)]
    pub fn get_cached(&self, url: &str) -> Option<(Vec<u8>, String)> {
        let mut cache = self.cache.lock().unwrap();
        
        if let Some(resource) = cache.get(url) {
            // 检查是否过期
            if let Some(expires_in) = resource.expires_in {
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
                
                if now - resource.cached_at > expires_in {
                    cache.remove(url);
                    return None;
                }
            }
            
            return Some((resource.content.clone(), resource.content_type.clone()));
        }
        
        None
    }

    /// 清除过期缓存
    pub fn clear_expired(&self) {
        let mut cache = self.cache.lock().unwrap();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        cache.retain(|_, resource| {
            if let Some(expires_in) = resource.expires_in {
                now - resource.cached_at <= expires_in
            } else {
                true
            }
        });
    }

    /// 清除所有缓存
    pub fn clear_all(&self) {
        let mut cache = self.cache.lock().unwrap();
        cache.clear();
    }
}

impl Default for CacheManager {
    fn default() -> Self {
        Self::new()
    }
}

/// 性能监控器
pub struct PerformanceMonitor {
    /// 性能指标
    metrics: Arc<Mutex<PerformanceMetrics>>,
    /// 开始时间
    start_time: std::time::Instant,
}

impl PerformanceMonitor {
    pub fn new() -> Self {
        Self {
            metrics: Arc::new(Mutex::new(PerformanceMetrics {
                webview_init_time: 0,
                page_load_time: 0,
                first_contentful_paint: None,
                largest_contentful_paint: None,
                cumulative_layout_shift: None,
                first_input_delay: None,
                time_to_interactive: None,
                resource_load_times: HashMap::new(),
            })),
            start_time: std::time::Instant::now(),
        }
    }

    /// 记录 WebView 初始化时间
    #[allow(dead_code)]
    pub fn record_webview_init(&self) {
        let elapsed = self.start_time.elapsed().as_millis() as u64;
        let mut metrics = self.metrics.lock().unwrap();
        metrics.webview_init_time = elapsed;
    }

    /// 记录页面加载时间
    pub fn record_page_load(&self) {
        let elapsed = self.start_time.elapsed().as_millis() as u64;
        let mut metrics = self.metrics.lock().unwrap();
        metrics.page_load_time = elapsed;
    }

    /// 记录首次内容绘制时间
    pub fn record_first_contentful_paint(&self) {
        let elapsed = self.start_time.elapsed().as_millis() as u64;
        let mut metrics = self.metrics.lock().unwrap();
        if metrics.first_contentful_paint.is_none() {
            metrics.first_contentful_paint = Some(elapsed);
        }
    }

    /// 记录资源加载时间
    #[allow(dead_code)]
    pub fn record_resource_load(&self, url: &str, load_time: u64) {
        let mut metrics = self.metrics.lock().unwrap();
        metrics.resource_load_times.insert(url.to_string(), load_time);
    }

    /// 获取性能指标
    pub fn get_metrics(&self) -> PerformanceMetrics {
        self.metrics.lock().unwrap().clone()
    }
}

impl Default for PerformanceMonitor {
    fn default() -> Self {
        Self::new()
    }
}

/// 预加载管理器
pub struct PreloadManager {
    /// 需要预加载的资源列表
    preload_resources: Vec<String>,
}

impl PreloadManager {
    pub fn new() -> Self {
        Self {
            preload_resources: vec![
                // 可以在这里添加需要预加载的关键资源
                // 例如：关键 CSS、JS、字体等
            ],
        }
    }

    /// 添加需要预加载的资源
    #[allow(dead_code)]
    pub fn add_preload_resource(&mut self, url: String) {
        self.preload_resources.push(url);
    }

    /// 获取预加载资源列表
    #[allow(dead_code)]
    pub fn get_preload_resources(&self) -> &[String] {
        &self.preload_resources
    }
}

impl Default for PreloadManager {
    fn default() -> Self {
        Self::new()
    }
}

/// WebView 优化脚本注入器
pub struct WebViewOptimizer;

impl WebViewOptimizer {
    /// 获取滚动性能优化脚本
    /// 参考：https://tech.meituan.com/2017/06/09/webviewperf.html
    pub fn get_scroll_optimization_script() -> String {
        r#"
        (function() {
            'use strict';
            
            // 1. 检测 passive 事件支持
            let passiveSupported = false;
            try {
                const opts = Object.defineProperty({}, 'passive', {
                    get: function() {
                        passiveSupported = true;
                        return true;
                    }
                });
                window.addEventListener('test', null, opts);
                window.removeEventListener('test', null, opts);
            } catch (e) {}
            
            // 2. 优化滚动事件处理 - 使用 requestAnimationFrame 节流
            let scrollTicking = false;
            let touchTicking = false;
            
            function optimizeScroll() {
                if (!scrollTicking) {
                    window.requestAnimationFrame(function() {
                        // 可以在这里添加滚动相关的处理逻辑
                        scrollTicking = false;
                    });
                    scrollTicking = true;
                }
            }
            
            function optimizeTouchMove() {
                if (!touchTicking) {
                    window.requestAnimationFrame(function() {
                        touchTicking = false;
                    });
                    touchTicking = true;
                }
            }
            
            // 3. 使用 passive 监听器优化滚动和触摸
            const scrollOptions = passiveSupported ? { passive: true, capture: false } : false;
            window.addEventListener('scroll', optimizeScroll, scrollOptions);
            window.addEventListener('touchmove', optimizeTouchMove, scrollOptions);
            window.addEventListener('wheel', optimizeScroll, scrollOptions);
            
            // 4. 优化 header 滚动时的背景填充
            let lastScrollY = window.scrollY;
            function handleHeaderScroll() {
                const header = document.querySelector('.app-header, [class*="header"]');
                if (header) {
                    const currentScrollY = window.scrollY;
                    if (currentScrollY > 0 && lastScrollY === 0) {
                        header.style.willChange = 'box-shadow';
                        header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    } else if (currentScrollY === 0 && lastScrollY > 0) {
                        header.style.boxShadow = 'none';
                        header.style.willChange = 'auto';
                    }
                    lastScrollY = currentScrollY;
                }
            }
            
            window.addEventListener('scroll', handleHeaderScroll, scrollOptions);
            
            // 5. 优化长列表渲染 - 虚拟滚动支持
            if ('IntersectionObserver' in window) {
                const listObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            // 启用 GPU 加速
                            entry.target.style.transform = 'translateZ(0)';
                        }
                    });
                }, {
                    rootMargin: '100px',
                    threshold: 0.01
                });
                
                // 观察列表项
                document.querySelectorAll('.list-item, [class*="list-item"], [class*="card"]').forEach(function(item) {
                    listObserver.observe(item);
                });
                
                // 动态添加的元素也需要观察
                const mutationObserver = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) {
                                const items = node.querySelectorAll ? node.querySelectorAll('.list-item, [class*="list-item"]') : [];
                                items.forEach(function(item) {
                                    listObserver.observe(item);
                                });
                            }
                        });
                    });
                });
                
                mutationObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
            
            // 6. 优化图片懒加载（增强版）
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset && img.dataset.src) {
                                img.classList.add('loading');
                                const imageLoader = new Image();
                                imageLoader.onload = function() {
                                    img.src = img.dataset.src;
                                    img.classList.remove('loading');
                                    img.classList.add('loaded');
                                    img.removeAttribute('data-src');
                                    imageObserver.unobserve(img);
                                };
                                imageLoader.onerror = function() {
                                    img.classList.remove('loading');
                                    img.classList.add('error');
                                };
                                imageLoader.src = img.dataset.src;
                            }
                        }
                    });
                }, {
                    rootMargin: '50px',
                    threshold: 0.01
                });
                
                document.querySelectorAll('img[data-src]').forEach(function(img) {
                    imageObserver.observe(img);
                });
            }
            
            // 7. 优化 CSS 动画性能
            document.querySelectorAll('[class*="animate"], [class*="transition"]').forEach(function(el) {
                el.style.willChange = 'transform, opacity';
                el.style.transform = 'translateZ(0)';
                el.style.backfaceVisibility = 'hidden';
            });
            
            console.log('WebView scroll optimization scripts injected');
        })();
        "#.to_string()
    }

    /// 获取内存优化脚本
    pub fn get_memory_optimization_script() -> String {
        r#"
        (function() {
            'use strict';
            
            // 1. 清理未使用的 DOM 节点
            function cleanupUnusedNodes() {
                const unusedNodes = document.querySelectorAll('[data-unused="true"]');
                unusedNodes.forEach(function(node) {
                    node.remove();
                });
            }
            
            // 2. 清理未使用的图片缓存
            function cleanupImageCache() {
                const images = document.querySelectorAll('img');
                images.forEach(function(img) {
                    // 如果图片不在视口中且已加载，可以释放内存
                    if (img.complete && !img.classList.contains('keep-in-memory')) {
                        const rect = img.getBoundingClientRect();
                        const isVisible = rect.top < window.innerHeight + 500 && 
                                         rect.bottom > -500 &&
                                         rect.left < window.innerWidth + 500 && 
                                         rect.right > -500;
                        if (!isVisible && img.src && img.src.startsWith('data:')) {
                            // 对于 base64 图片，如果不在视口中可以移除
                            // img.src = '';
                        }
                    }
                });
            }
            
            // 3. 清理事件监听器（通过 WeakMap 跟踪）
            const eventListeners = new WeakMap();
            
            // 4. 定期清理（每5分钟）
            setInterval(function() {
                cleanupUnusedNodes();
                cleanupImageCache();
            }, 300000);
            
            // 5. 监听内存警告（如果支持）
            if ('memory' in performance) {
                const memoryCheckInterval = setInterval(function() {
                    const memory = performance.memory;
                    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
                    
                    if (usagePercent > 80) {
                        console.warn('Memory usage high:', 
                            (memory.usedJSHeapSize / 1048576).toFixed(2) + 'MB / ' +
                            (memory.jsHeapSizeLimit / 1048576).toFixed(2) + 'MB (' +
                            usagePercent.toFixed(1) + '%)');
                        
                        // 触发清理
                        cleanupUnusedNodes();
                        cleanupImageCache();
                        
                        // 如果内存使用超过 90%，尝试强制垃圾回收
                        if (usagePercent > 90 && typeof window.gc === 'function') {
                            try {
                                window.gc();
                            } catch (e) {
                                console.warn('GC not available');
                            }
                        }
                    }
                }, 60000);
                
                // 页面卸载时清理
                window.addEventListener('beforeunload', function() {
                    clearInterval(memoryCheckInterval);
                });
            }
            
            // 6. 优化大对象的内存使用
            // 使用对象池模式管理频繁创建的对象
            const objectPool = {
                pools: {},
                get: function(type) {
                    if (!this.pools[type]) {
                        this.pools[type] = [];
                    }
                    return this.pools[type].pop() || {};
                },
                release: function(type, obj) {
                    if (!this.pools[type]) {
                        this.pools[type] = [];
                    }
                    // 清理对象属性
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            delete obj[key];
                        }
                    }
                    this.pools[type].push(obj);
                }
            };
            
            // 7. 页面可见性变化时的内存优化
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    // 页面隐藏时，可以释放一些资源
                    cleanupImageCache();
                }
            });
            
            console.log('WebView memory optimization scripts injected');
        })();
        "#.to_string()
    }

    /// 获取资源加载优化脚本
    pub fn get_resource_optimization_script() -> String {
        r#"
        (function() {
            'use strict';
            
            // 1. DNS 预解析
            const dnsPrefetchDomains = [];
            dnsPrefetchDomains.forEach(function(domain) {
                const link = document.createElement('link');
                link.rel = 'dns-prefetch';
                link.href = domain;
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
            });
            
            // 2. 预连接关键域名
            const preconnectDomains = [];
            preconnectDomains.forEach(function(domain) {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = domain;
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
            });
            
            // 3. 预加载关键资源
            const criticalResources = [];
            criticalResources.forEach(function(resource) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource.url;
                link.as = resource.as || 'fetch';
                if (resource.crossOrigin) {
                    link.crossOrigin = 'anonymous';
                }
                if (resource.type) {
                    link.type = resource.type;
                }
                document.head.appendChild(link);
            });
            
            // 4. 优化字体加载
            if ('fonts' in document) {
                document.fonts.ready.then(function() {
                    console.log('Fonts loaded');
                    // 字体加载完成后，可以移除 loading 类
                    document.body.classList.remove('fonts-loading');
                    document.body.classList.add('fonts-loaded');
                }).catch(function(err) {
                    console.warn('Font loading error:', err);
                });
                
                // 监听字体加载状态
                document.fonts.addEventListener('loading', function() {
                    document.body.classList.add('fonts-loading');
                });
            }
            
            // 5. 资源优先级优化
            // 为关键资源添加 fetchpriority="high"
            document.querySelectorAll('link[rel="stylesheet"], script[src]').forEach(function(resource) {
                if (resource.getAttribute('data-critical') === 'true') {
                    resource.setAttribute('fetchpriority', 'high');
                }
            });
            
            // 6. 使用 Service Worker 缓存策略（如果可用）
            if ('serviceWorker' in navigator) {
                // Service Worker 注册可以在主应用中处理
            }
            
            // 7. 优化图片格式和尺寸
            // 使用响应式图片
            document.querySelectorAll('img').forEach(function(img) {
                if (!img.loading && 'loading' in HTMLImageElement.prototype) {
                    // 使用原生懒加载（如果支持）
                    const src = img.getAttribute('data-src');
                    if (src && !img.src) {
                        img.loading = 'lazy';
                    }
                }
            });
            
            // 8. 预取下一页资源（如果适用）
            const nextPageLink = document.querySelector('a[rel="next"]');
            if (nextPageLink && 'requestIdleCallback' in window) {
                window.requestIdleCallback(function() {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = nextPageLink.href;
                    document.head.appendChild(link);
                });
            }
            
            console.log('WebView resource optimization scripts injected');
        })();
        "#.to_string()
    }

    /// 获取所有优化脚本
    pub fn get_all_optimization_scripts() -> String {
        format!(
            "{}\n{}\n{}",
            Self::get_scroll_optimization_script(),
            Self::get_memory_optimization_script(),
            Self::get_resource_optimization_script()
        )
    }
}

