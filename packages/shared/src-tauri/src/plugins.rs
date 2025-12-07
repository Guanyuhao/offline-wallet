/**
 * @Author liyongjie
 * 插件注册辅助函数
 * 
 * 提供统一的插件注册接口，方便应用使用
 * 
 * 使用方法：
 * 在应用的 main.rs 中：
 * ```rust
 * use offline_wallet_shared::plugins::register_all_plugins;
 * 
 * fn setup_app() {
 *     let builder = tauri::Builder::default();
 *     
 *     // 注册所有插件（OS 插件 + 移动端插件）
 *     let builder = register_all_plugins(builder);
 *     
 *     builder
 *         .invoke_handler(tauri::generate_handler![...])
 *         .run(tauri::generate_context!())
 *         .expect("error while running tauri application");
 * }
 * ```
 */

/// 注册所有插件（推荐使用）
/// 
/// 此函数会注册：
/// - OS 插件（所有平台）
/// - 移动端插件（仅移动端：二维码扫描 + 生物识别）
/// 
/// # Arguments
/// * `builder` - Tauri Builder 实例
/// 
/// # Returns
/// 注册了所有插件的 Builder 实例
pub fn register_all_plugins<R: tauri::Runtime>(
    builder: tauri::Builder<R>,
) -> tauri::Builder<R> {
    // 条件编译：如果是移动端平台（Android 或 iOS）
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        // 移动端：先注册 OS 插件，再注册移动端插件（二维码扫描 + 生物识别）
        register_mobile_plugins(register_os_plugin(builder))
    }
    
    // 条件编译：如果不是移动端平台（即桌面端：macOS/Windows/Linux）
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        // 桌面端：只注册 OS 插件（不需要移动端插件）
        register_os_plugin(builder)
    }
}

/// 注册 OS 插件（所有平台）
/// 
/// 此函数在所有平台（iOS/Android/Desktop）都可用
/// OS 插件提供操作系统相关的功能，如平台检测、系统信息等
pub fn register_os_plugin<R: tauri::Runtime>(
    builder: tauri::Builder<R>,
) -> tauri::Builder<R> {
    // 注册 tauri-plugin-os 插件，提供操作系统相关的 API
    builder.plugin(tauri_plugin_os::init())
}

/// 注册所有移动端插件
/// 
/// 此函数仅在移动端（iOS/Android）可用
/// 注册的插件包括：
/// - tauri-plugin-barcode-scanner：二维码扫描功能
/// - tauri-plugin-biometric：生物识别功能（指纹/面容ID）
#[cfg(any(target_os = "android", target_os = "ios"))]
pub fn register_mobile_plugins<R: tauri::Runtime>(
    builder: tauri::Builder<R>,
) -> tauri::Builder<R> {
    builder
        // 注册二维码扫描插件，提供相机扫描二维码的功能
        .plugin(tauri_plugin_barcode_scanner::init())
        // 注册生物识别插件，提供指纹/面容ID等生物识别功能
        .plugin(tauri_plugin_biometric::init())
}
