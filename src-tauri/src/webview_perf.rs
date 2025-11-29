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
            // 优化滚动性能
            // 1. 使用 passive 事件监听器
            let passiveSupported = false;
            try {
                const opts = Object.defineProperty({}, 'passive', {
                    get: function() {
                        passiveSupported = true;
                        return true;
                    }
                });
                window.addEventListener('test', null, opts);
            } catch (e) {}
            
            // 2. 优化滚动事件处理
            let ticking = false;
            function optimizeScroll() {
                if (!ticking) {
                    window.requestAnimationFrame(function() {
                        // 滚动处理逻辑
                        ticking = false;
                    });
                    ticking = true;
                }
            }
            
            // 3. 使用 passive 监听器优化滚动
            window.addEventListener('scroll', optimizeScroll, passiveSupported ? { passive: true } : false);
            window.addEventListener('touchmove', optimizeScroll, passiveSupported ? { passive: true } : false);
            
            // 4. 优化 header 滚动时的背景填充
            let lastScrollY = window.scrollY;
            function handleHeaderScroll() {
                const header = document.querySelector('.app-header');
                if (header) {
                    const currentScrollY = window.scrollY;
                    if (currentScrollY > 0 && lastScrollY === 0) {
                        // 开始滚动，确保背景填充
                        header.style.boxShadow = '0 0 0 env(safe-area-inset-top, 0) var(--apple-bg-primary)';
                    }
                    lastScrollY = currentScrollY;
                }
            }
            
            window.addEventListener('scroll', handleHeaderScroll, passiveSupported ? { passive: true } : false);
            
            // 5. 优化图片懒加载
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset && img.dataset.src) {
                                img.src = img.dataset.src;
                                img.removeAttribute('data-src');
                                imageObserver.unobserve(img);
                            }
                        }
                    });
                }, {
                    rootMargin: '50px'
                });
                
                // 观察所有懒加载图片
                document.querySelectorAll('img[data-src]').forEach(function(img) {
                    imageObserver.observe(img);
                });
            }
            
            // 6. 预加载关键资源
            const criticalResources = [];
            criticalResources.forEach(function(resource) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource;
                link.as = resource.endsWith('.svg') ? 'image' : 'fetch';
                document.head.appendChild(link);
            });
            
            console.log('WebView optimization scripts injected');
        })();
        "#.to_string()
    }

    /// 获取内存优化脚本
    pub fn get_memory_optimization_script() -> String {
        r#"
        (function() {
            // 内存优化
            // 1. 清理未使用的 DOM 节点
            function cleanupUnusedNodes() {
                const unusedNodes = document.querySelectorAll('[data-unused="true"]');
                unusedNodes.forEach(function(node) {
                    node.remove();
                });
            }
            
            // 2. 定期清理（每5分钟）
            setInterval(cleanupUnusedNodes, 300000);
            
            // 3. 监听内存警告（如果支持）
            if ('memory' in performance) {
                setInterval(function() {
                    const memory = (performance as any).memory;
                    if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                        console.warn('Memory usage high:', memory.usedJSHeapSize);
                        cleanupUnusedNodes();
                    }
                }, 60000);
            }
        })();
        "#.to_string()
    }

    /// 获取资源加载优化脚本
    pub fn get_resource_optimization_script() -> String {
        r#"
        (function() {
            // 资源加载优化
            // 1. DNS 预解析
            const dnsPrefetchDomains = [];
            dnsPrefetchDomains.forEach(function(domain) {
                const link = document.createElement('link');
                link.rel = 'dns-prefetch';
                link.href = domain;
                document.head.appendChild(link);
            });
            
            // 2. 预连接关键域名
            const preconnectDomains = [];
            preconnectDomains.forEach(function(domain) {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = domain;
                document.head.appendChild(link);
            });
            
            // 3. 优化字体加载
            if ('fonts' in document) {
                (document as any).fonts.ready.then(function() {
                    console.log('Fonts loaded');
                });
            }
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

