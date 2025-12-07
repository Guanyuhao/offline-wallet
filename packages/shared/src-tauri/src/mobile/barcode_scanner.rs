/**
 * @Author liyongjie
 * 二维码扫描插件工具函数
 * 
 * 提供统一的二维码扫描接口
 * 
 * 注意：插件必须在应用的 main.rs 中注册：
 * ```rust
 * #[cfg(any(target_os = "android", target_os = "ios"))]
 * let builder = builder.plugin(tauri_plugin_barcode_scanner::init());
 * ```
 */

use serde::{Deserialize, Serialize};

/// 二维码扫描结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BarcodeScanResult {
    /// 扫描到的内容
    pub content: String,
    /// 格式（如 QR_CODE）
    pub format: String,
}

/// 扫描配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanConfig {
    /// 是否使用窗口模式（true: 透明窗口 + Web UI, false: 原生全屏 UI）
    pub windowed: bool,
    /// 支持的格式列表
    pub formats: Vec<String>,
    /// 相机方向（"back" 或 "front"）
    pub camera_direction: Option<String>,
}

impl Default for ScanConfig {
    fn default() -> Self {
        Self {
            windowed: false, // 默认使用原生全屏 UI
            formats: vec!["QR_CODE".to_string()],
            camera_direction: Some("back".to_string()),
        }
    }
}

// 注意：实际的函数实现在 commands.rs 中
// 这里只定义类型和数据结构

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scan_config_default() {
        let config = ScanConfig::default();
        assert_eq!(config.windowed, false);
        assert_eq!(config.formats, vec!["QR_CODE".to_string()]);
        assert_eq!(config.camera_direction, Some("back".to_string()));
    }
}

