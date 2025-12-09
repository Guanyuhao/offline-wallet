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

use tauri::Manager;
use argon2::{Algorithm, Argon2, Params, Version};
use std::fs;

/// 注册所有插件（推荐使用）
/// 
/// 此函数会注册：
/// - Stronghold 插件（所有平台，用于安全存储）
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
    let builder = register_stronghold_plugin(builder);
    
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

/// 注册 Stronghold 插件（所有平台）
/// 
/// 此函数在所有平台（iOS/Android/Desktop）都可用
/// Stronghold 插件提供安全的密钥和秘密管理功能
/// 
/// 注意：此函数需要在 setup 回调中调用，以便获取 AppHandle
pub fn register_stronghold_plugin<R: tauri::Runtime>(
    builder: tauri::Builder<R>,
) -> tauri::Builder<R> {
    builder.setup(|app| {
        // 获取应用数据目录
        let app_data_dir = app
            .path()
            .app_local_data_dir()
            .expect("could not resolve app local data path");
        
        // 确保目录存在
        std::fs::create_dir_all(&app_data_dir)
            .map_err(|e| {
                eprintln!("Failed to create app data directory: {:?}", e);
                tauri::Error::from(e)
            })?;
        
        // 使用官方的 Argon2 参数，但通过自定义密码哈希函数添加日志
        // 官方默认参数：m_cost: 19,456 KiB (~19 MB), t_cost: 2, p_cost: 1
        let salt_path = app_data_dir.join("salt.txt");
        
        eprintln!("[INIT] Initializing Stronghold with official Argon2 parameters");
        eprintln!("[INIT] Salt path: {:?}", salt_path);
        
        // 读取或生成 salt
        let salt = if salt_path.exists() {
            eprintln!("[INIT] Reading existing salt file...");
            fs::read(&salt_path).map_err(|e| {
                eprintln!("[ERROR] Failed to read salt file: {:?}", e);
                tauri::Error::from(e)
            })?
        } else {
            eprintln!("[INIT] Generating new salt file...");
            use rand::RngCore;
            let mut salt_bytes = vec![0u8; 32];
            rand::thread_rng().fill_bytes(&mut salt_bytes);
            fs::write(&salt_path, &salt_bytes).map_err(|e| {
                eprintln!("[ERROR] Failed to write salt file: {:?}", e);
                tauri::Error::from(e)
            })?;
            salt_bytes
        };
        
        // 官方默认 Argon2 参数
        let m_cost = 19_456;  // 19,456 KiB (~19 MB)
        let t_cost = 2;
        let p_cost = 1;
        
        eprintln!("[INIT] Argon2 parameters: m_cost={} KiB ({} MB), t_cost={}, p_cost={}", 
            m_cost, m_cost / 1024, t_cost, p_cost);
        
        let salt_for_closure = salt.clone();
        let plugin_start = std::time::Instant::now();
        
        app.handle().plugin(
            tauri_plugin_stronghold::Builder::new(move |password: &str| {
                // 记录密码哈希函数被调用的时间
                let hash_start = std::time::Instant::now();
                let call_id = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos();
                eprintln!("[STRONGHOLD-HASH] ========== Password hash function called (ID: {}) ==========", call_id);
                eprintln!("[STRONGHOLD-HASH] Called at: {:?}", std::time::SystemTime::now());
                eprintln!("[STRONGHOLD-HASH] Password length: {}", password.len());
                eprintln!("[STRONGHOLD-HASH] Call stack: {:?}", std::backtrace::Backtrace::capture());
                
                // 步骤1：创建 Argon2 参数（使用官方默认参数）
                let params_start = std::time::Instant::now();
                let params = Params::new(
                    m_cost,   // 19,456 KiB (~19 MB)
                    t_cost,   // 2 次迭代
                    p_cost,   // 1 个并行线程
                    Some(32), // output_len: 32 字节
                ).unwrap_or_else(|e| {
                    eprintln!("[STRONGHOLD-HASH] ERROR: Failed to create Argon2 params: {:?}", e);
                    Params::default()
                });
                let params_elapsed = params_start.elapsed();
                eprintln!("[STRONGHOLD-HASH] Step 1 - Create Params: {:?}", params_elapsed);
                
                // 步骤2：创建 Argon2 实例
                let argon2_start = std::time::Instant::now();
                let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
                let argon2_elapsed = argon2_start.elapsed();
                eprintln!("[STRONGHOLD-HASH] Step 2 - Create Argon2 instance: {:?}", argon2_elapsed);
                
                // 步骤3：准备输出缓冲区
                let buffer_start = std::time::Instant::now();
                let mut output = vec![0u8; 32];
                let buffer_elapsed = buffer_start.elapsed();
                eprintln!("[STRONGHOLD-HASH] Step 3 - Allocate buffer: {:?}", buffer_elapsed);
                
                // 步骤4：执行哈希（这是最耗时的步骤）
                let hash_exec_start = std::time::Instant::now();
                eprintln!("[STRONGHOLD-HASH] Step 4 - Starting Argon2 hash_password_into...");
                argon2.hash_password_into(
                    password.as_ref(),
                    &salt_for_closure,
                    &mut output,
                ).unwrap_or_else(|e| {
                    eprintln!("[STRONGHOLD-HASH] ERROR: Argon2 hash error: {:?}", e);
                });
                let hash_exec_elapsed = hash_exec_start.elapsed();
                eprintln!("[STRONGHOLD-HASH] Step 4 - Argon2 hash_password_into completed: {:?} (m_cost={} KiB, t_cost={}, p_cost={})", 
                    hash_exec_elapsed, m_cost, t_cost, p_cost);
                
                // 总耗时
                let total_elapsed = hash_start.elapsed();
                eprintln!("[STRONGHOLD-HASH] Total password hash function time: {:?}", total_elapsed);
                eprintln!("[STRONGHOLD-HASH] ========== Password hash function completed (ID: {}) ==========", call_id);
                
                // 记录输出哈希的前几个字节（用于调试，不记录完整哈希）
                eprintln!("[STRONGHOLD-HASH] Output hash (first 8 bytes): {:02x?}", &output[..8.min(output.len())]);
                
                output
            })
            .build()
        ).map_err(|e| {
            eprintln!("[ERROR] Failed to initialize Stronghold plugin: {:?}", e);
            e
        })?;
        let plugin_elapsed = plugin_start.elapsed();
        eprintln!("[INIT] Stronghold plugin registered successfully in {:?}", plugin_elapsed);
        
        Ok(())
    })
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
