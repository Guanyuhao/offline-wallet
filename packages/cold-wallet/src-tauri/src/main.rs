// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// 允许未使用的代码 - 这些代码是库 API 的一部分，可能在将来使用
#![allow(dead_code)]

mod crypto;
mod chains;
mod qr_scanner;

use crypto::{mnemonic, secure_storage};
use chains::address_validation::{self, AddressValidationResult};
// 使用共享库的插件注册函数
use offline_wallet_shared::plugins::register_all_plugins;

fn setup_app() {
    let builder = tauri::Builder::default();
    
    // 注册所有插件（OS 插件 + 移动端插件）
    let builder = register_all_plugins(builder);
    
    builder
        .invoke_handler(tauri::generate_handler![
            // 安全存储相关
            store_encrypted_mnemonic,
            retrieve_encrypted_mnemonic,
            has_encrypted_mnemonic,
            delete_encrypted_mnemonic,
            verify_mnemonic_password,
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

// ==================== 安全存储命令 ====================

#[tauri::command]
fn store_encrypted_mnemonic(mnemonic: String, password: String) -> Result<(), String> {
    secure_storage::store_encrypted_mnemonic(&mnemonic, &password)
        .map_err(|e| format!("Failed to store encrypted mnemonic: {}", e))
}

#[tauri::command]
fn retrieve_encrypted_mnemonic(password: String) -> Result<String, String> {
    secure_storage::retrieve_encrypted_mnemonic(&password)
        .map_err(|e| format!("Failed to retrieve mnemonic: {}", e))
}

#[tauri::command]
fn has_encrypted_mnemonic() -> Result<bool, String> {
    Ok(secure_storage::has_encrypted_mnemonic())
}

#[tauri::command]
fn delete_encrypted_mnemonic() -> Result<(), String> {
    secure_storage::delete_encrypted_mnemonic()
        .map_err(|e| format!("Failed to delete encrypted mnemonic: {}", e))
}

#[tauri::command]
fn verify_mnemonic_password(password: String) -> Result<bool, String> {
    secure_storage::verify_mnemonic_password(&password)
        .map_err(|e| format!("Failed to verify password: {}", e))
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

