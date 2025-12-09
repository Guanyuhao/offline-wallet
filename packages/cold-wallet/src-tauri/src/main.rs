// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// 允许未使用的代码 - 这些代码是库 API 的一部分，可能在将来使用
#![allow(dead_code)]

mod crypto;
mod chains;
mod qr_scanner;

use crypto::mnemonic;
use chains::address_validation::{self, AddressValidationResult};
// 使用共享库的插件注册函数
use offline_wallet_shared::plugins::register_all_plugins;
use std::fs;
use tauri::Manager;

fn setup_app() {
    // Stronghold 插件已在 shared 层注册
    let builder = tauri::Builder::default();
    
    // 注册所有插件（Stronghold + OS 插件 + 移动端插件）
    let builder = register_all_plugins(builder);
    
    builder
        .invoke_handler(tauri::generate_handler![
            // 性能测试命令（用于诊断 Stronghold 性能问题）
            test_file_read_performance,
            monitor_stronghold_operations,
            // 安全存储相关（文件操作）
            has_encrypted_mnemonic,
            delete_encrypted_mnemonic,
            // 助记词相关
            generate_mnemonic,
            validate_mnemonic,
            // 地址生成
            derive_address,
            // 地址验证
            validate_address,
            validate_address_with_message,
            // 交易签名
            sign_transaction,
            // 二维码生成
            generate_qrcode,
            // 二维码扫描配置（窗口模式）
            qr_scanner::prepare_windowed_scan,
            // 二维码扫描配置（原生全屏模式）
            qr_scanner::prepare_native_scan,
            // 应用退出（仅桌面端）
            #[cfg(not(any(target_os = "ios", target_os = "android")))]
            exit_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(target_os = "ios")]
#[tauri::mobile_entry_point]
fn main() {
    setup_app();
}

#[cfg(not(target_os = "ios"))]
fn main() {
    setup_app();
}

// ==================== 性能测试命令 ====================

/// 监控 Stronghold 操作（用于诊断性能问题）
/// 这个命令会在 Rust 端输出日志，帮助追踪 Stronghold 插件的内部操作
#[tauri::command]
fn monitor_stronghold_operations(app: tauri::AppHandle) -> Result<String, String> {
    use std::time::Instant;
    
    eprintln!("[MONITOR] ========== Stronghold 操作监控开始 ==========");
    eprintln!("[MONITOR] Timestamp: {:?}", std::time::SystemTime::now());
    
    let vault_path = get_vault_path(&app)?;
    eprintln!("[MONITOR] Vault path: {:?}", vault_path);
    eprintln!("[MONITOR] Vault exists: {}", vault_path.exists());
    
    if vault_path.exists() {
        if let Ok(metadata) = std::fs::metadata(&vault_path) {
            eprintln!("[MONITOR] Vault file size: {} bytes", metadata.len());
            eprintln!("[MONITOR] Vault file modified: {:?}", metadata.modified());
        }
    }
    
    let salt_path = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?
        .join("salt.txt");
    eprintln!("[MONITOR] Salt path: {:?}", salt_path);
    eprintln!("[MONITOR] Salt exists: {}", salt_path.exists());
    
    if salt_path.exists() {
        if let Ok(metadata) = std::fs::metadata(&salt_path) {
            eprintln!("[MONITOR] Salt file size: {} bytes", metadata.len());
        }
    }
    
    eprintln!("[MONITOR] ========== Stronghold 操作监控完成 ==========");
    Ok("Monitoring started. Check Rust console for logs.".to_string())
}

/// 测试文件读取性能（用于诊断 Stronghold.load 性能问题）
#[tauri::command]
fn test_file_read_performance(app: tauri::AppHandle) -> Result<String, String> {
    use std::time::Instant;
    
    let vault_path = get_vault_path(&app)?;
    
    if !vault_path.exists() {
        return Err("Vault file does not exist".to_string());
    }
    
    eprintln!("[PERF-TEST] Starting file read performance test...");
    eprintln!("[PERF-TEST] Vault path: {:?}", vault_path);
    
    // 测试1：获取文件元数据
    let meta_start = Instant::now();
    let metadata = std::fs::metadata(&vault_path)
        .map_err(|e| format!("Failed to get metadata: {}", e))?;
    let meta_elapsed = meta_start.elapsed();
    eprintln!("[PERF-TEST] File metadata read: {:?}, size: {} bytes", meta_elapsed, metadata.len());
    
    // 测试2：读取文件内容
    let read_start = Instant::now();
    let file_content = fs::read(&vault_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    let read_elapsed = read_start.elapsed();
    eprintln!("[PERF-TEST] File content read: {:?}, size: {} bytes", read_elapsed, file_content.len());
    
    // 测试3：解析文件头（PARTI 格式）
    let parse_start = Instant::now();
    if file_content.len() >= 4 {
        let header = &file_content[0..4];
        eprintln!("[PERF-TEST] File header: {:?}", header);
    }
    let parse_elapsed = parse_start.elapsed();
    eprintln!("[PERF-TEST] File header parse: {:?}", parse_elapsed);
    
    Ok(format!(
        "File read test completed: metadata={:?}, read={:?}, parse={:?}, total_size={} bytes",
        meta_elapsed, read_elapsed, parse_elapsed, file_content.len()
    ))
}

// ==================== 安全存储命令（文件操作） ====================

/// 获取 vault 文件路径
fn get_vault_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    Ok(app_data_dir.join("vaultColdWallet.hold"))
}

/// 检查是否存在加密的助记词（检查 vault 文件是否存在）
#[tauri::command]
fn has_encrypted_mnemonic(app: tauri::AppHandle) -> Result<bool, String> {
    let vault_path = get_vault_path(&app)?;
    Ok(vault_path.exists())
}

/// 删除加密的助记词（删除 vault 文件）
#[tauri::command]
fn delete_encrypted_mnemonic(app: tauri::AppHandle) -> Result<(), String> {
    let vault_path = get_vault_path(&app)?;
    if vault_path.exists() {
        fs::remove_file(&vault_path)
            .map_err(|e| format!("Failed to delete vault: {:?}", e))?;
    }
    Ok(())
}

// ==================== 助记词命令 ====================

#[tauri::command]
fn generate_mnemonic(word_count: usize) -> Result<String, String> {
    mnemonic::generate_mnemonic(word_count)
}

#[tauri::command]
fn validate_mnemonic(mnemonic: String) -> Result<bool, String> {
    mnemonic::validate_mnemonic(&mnemonic)
}

// ==================== 地址生成命令 ====================

#[tauri::command]
fn derive_address(
    chain: String,
    mnemonic: String,
    derivation_path: Option<String>,
) -> Result<String, String> {
    let chain_type = match chain.as_str() {
        "eth" => chains::ChainType::Eth,
        "btc" => chains::ChainType::Btc,
        "sol" => chains::ChainType::Sol,
        "bnb" => chains::ChainType::Bnb,
        "tron" => chains::ChainType::Tron,
        "kaspa" | "kas" => chains::ChainType::Kaspa,
        _ => return Err(format!("Unsupported chain: {}", chain)),
    };

    chains::derive_address(chain_type, &mnemonic, derivation_path.as_deref())
}

// ==================== 地址验证命令 ====================

#[tauri::command]
fn validate_address(chain: String, address: String) -> Result<bool, String> {
    Ok(address_validation::validate_address(&chain.to_uppercase(), &address))
}

#[tauri::command]
fn validate_address_with_message(chain: String, address: String) -> Result<AddressValidationResult, String> {
    Ok(address_validation::validate_address_with_message(&chain.to_uppercase(), &address))
}

// ==================== 交易签名命令 ====================

#[tauri::command]
fn sign_transaction(chain: String, mnemonic: String, tx_data: String) -> Result<String, String> {
    let chain_type = match chain.as_str() {
        "eth" => chains::ChainType::Eth,
        "btc" => chains::ChainType::Btc,
        "sol" => chains::ChainType::Sol,
        "bnb" => chains::ChainType::Bnb,
        "tron" => chains::ChainType::Tron,
        "kaspa" | "kas" => chains::ChainType::Kaspa,
        _ => return Err(format!("Unsupported chain: {}", chain)),
    };

    chains::sign_transaction(chain_type, &mnemonic, &tx_data)
}

// ==================== 二维码生成命令 ====================

#[tauri::command]
fn generate_qrcode(data: String, size: u32) -> Result<String, String> {
    offline_wallet_shared::qrcode::generate_qrcode(&data, size)
}

// ==================== 应用退出命令 ====================

/// 退出应用（仅桌面端）
/// 
/// 注意：移动端（iOS/Android）不支持主动退出应用
/// 用户需要通过系统方式退出
#[cfg(not(any(target_os = "ios", target_os = "android")))]
#[tauri::command]
async fn exit_app(app: tauri::AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

