// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
// 允许未使用的代码 - 这些代码是库 API 的一部分，可能在将来使用
#![allow(dead_code)]

mod crypto;
mod qrcode;
mod chains;

use crypto::{mnemonic, secure_storage};

#[cfg(target_os = "ios")]
#[no_mangle]
pub extern "C" fn run_app() {
    main();
}

#[cfg(not(target_os = "ios"))]
fn main() {
    tauri::Builder::default()
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
            // 交易签名
            sign_transaction,
            // 二维码生成
            generate_qrcode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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
        _ => return Err(format!("Unsupported chain: {}", chain)),
    };

    chains::derive_address(chain_type, &mnemonic, derivation_path.as_deref())
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
        _ => return Err(format!("Unsupported chain: {}", chain)),
    };

    chains::sign_transaction(chain_type, &mnemonic, &tx_data)
}

// ==================== 二维码生成命令 ====================

#[tauri::command]
fn generate_qrcode(data: String, size: u32) -> Result<String, String> {
    qrcode::generate_qrcode(&data, size)
}

