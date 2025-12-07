/**
 * @Author liyongjie
 * 移动端插件模块
 * 
 * 提供移动端 Tauri 插件的统一接口和工具函数
 * 
 * 注意：
 * - 插件必须在应用的 main.rs 中注册才能使用
 * - 这些函数仅在移动端（iOS/Android）可用
 */

#[cfg(any(target_os = "android", target_os = "ios"))]
pub mod barcode_scanner;

#[cfg(any(target_os = "android", target_os = "ios"))]
pub mod biometric;

#[cfg(any(target_os = "android", target_os = "ios"))]
pub mod commands;

#[cfg(any(target_os = "android", target_os = "ios"))]
pub mod utils;

// 导出类型和数据结构
#[cfg(any(target_os = "android", target_os = "ios"))]
pub use barcode_scanner::{BarcodeScanResult, ScanConfig};

#[cfg(any(target_os = "android", target_os = "ios"))]
pub use biometric::{BiometricType, BiometricStatus, BiometricResult};

// 导出命令函数
#[cfg(any(target_os = "android", target_os = "ios"))]
pub use commands::*;

// 导出工具函数
#[cfg(any(target_os = "android", target_os = "ios"))]
pub use utils::*;

