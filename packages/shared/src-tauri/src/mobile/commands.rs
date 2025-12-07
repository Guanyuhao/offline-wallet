/**
 * @Author liyongjie
 * 移动端插件 Tauri 命令
 * 
 * 提供可以在应用中使用的 Tauri 命令函数
 * 
 * 使用方法：
 * 在应用的 main.rs 中：
 * ```rust
 * use offline_wallet_shared::mobile::commands::*;
 * 
 * .invoke_handler(tauri::generate_handler![
 *     check_camera_permission,
 *     request_camera_permission,
 *     check_biometric_available,
 *     authenticate_biometric,
 * ])
 * ```
 */

use crate::mobile::{BiometricResult, BiometricStatus, BiometricType};

/// 检查相机权限
/// 
/// 注意：此命令需要前端通过 @tauri-apps/plugin-barcode-scanner 调用
/// 这里只是提供一个统一的命令接口
#[tauri::command]
pub async fn check_camera_permission() -> Result<bool, String> {
    // 注意：实际的权限检查需要通过前端插件 API
    // 这里返回一个占位值，实际应用应该通过前端调用插件
    Ok(false)
}

/// 请求相机权限
#[tauri::command]
pub async fn request_camera_permission() -> Result<bool, String> {
    // 注意：实际的权限请求需要通过前端插件 API
    // 这里返回一个占位值，实际应用应该通过前端调用插件
    Ok(false)
}

/// 检查生物识别是否可用
#[tauri::command]
pub async fn check_biometric_available() -> Result<BiometricStatus, String> {
    // 注意：实际的检查需要通过前端插件 API
    // 这里返回一个占位值，实际应用应该通过前端调用插件
    Ok(BiometricStatus::Unavailable)
}

/// 获取生物识别类型
#[tauri::command]
pub async fn get_biometric_type() -> Result<BiometricType, String> {
    // 注意：实际的获取需要通过前端插件 API
    // 这里返回一个占位值，实际应用应该通过前端调用插件
    Ok(BiometricType::Unknown)
}

/// 执行生物识别验证
/// 
/// # Arguments
/// * `reason` - 验证原因（显示给用户的提示）
#[tauri::command]
pub async fn authenticate_biometric(_reason: String) -> Result<BiometricResult, String> {
    // 注意：实际的验证需要通过前端插件 API
    // 这里返回一个占位值，实际应用应该通过前端调用插件
    Ok(BiometricResult {
        success: false,
        error: Some("Biometric authentication not implemented. Please use frontend plugin API.".to_string()),
    })
}

