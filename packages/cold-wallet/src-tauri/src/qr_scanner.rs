/**
 * @Author liyongjie
 * 二维码扫描命令模块
 * 
 * 注意：tauri-plugin-barcode-scanner 主要通过前端 JavaScript API 调用
 * 这里的 Rust 命令主要用于：
 * 1. 提供统一的接口
 * 2. 类型定义和配置
 * 3. 未来可能的 Rust 端处理逻辑
 * 
 * 实际的扫描功能需要通过前端调用 @tauri-apps/plugin-barcode-scanner
 */

use serde::{Deserialize, Serialize};

/// 扫描配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanConfig {
    /// 是否使用窗口模式（true: 透明窗口 + Web UI, false: 原生全屏 UI）
    pub windowed: bool,
    /// 相机方向（"back" 或 "front"）
    pub camera_direction: Option<String>,
}

impl Default for ScanConfig {
    fn default() -> Self {
        Self {
            windowed: true, // 默认使用窗口模式（自定义 UI）
            camera_direction: Some("back".to_string()),
        }
    }
}

/// 扫描结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    /// 扫描到的内容
    pub content: String,
    /// 格式（如 QR_CODE）
    pub format: Option<String>,
}

/// 准备窗口模式扫描
/// 
/// 此命令返回扫描配置，前端需要使用此配置调用 @tauri-apps/plugin-barcode-scanner
/// 
/// 注意：实际的扫描需要通过前端 JavaScript API 调用：
/// ```typescript
/// import { scan, Format } from '@tauri-apps/plugin-barcode-scanner';
/// const result = await scan({ windowed: true, formats: [Format.QRCode] });
/// ```
/// 
/// 窗口模式下，相机画面会整页贴底，只有 CSS 中设置为透明的区域才能看到相机画面
/// 位置和大小完全由 CSS 控制，不需要传递给插件
#[tauri::command]
pub async fn prepare_windowed_scan(config: Option<ScanConfig>) -> Result<ScanConfig, String> {
    Ok(config.unwrap_or_default())
}

/// 准备原生全屏模式扫描
/// 
/// 返回原生扫描配置
#[tauri::command]
pub async fn prepare_native_scan() -> Result<ScanConfig, String> {
    Ok(ScanConfig {
        windowed: false,
        camera_direction: Some("back".to_string()),
    })
}

