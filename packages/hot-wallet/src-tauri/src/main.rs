// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod qrcode;
mod blockchain;

use qrcode::parse_qrcode_data;

#[cfg(target_os = "ios")]
#[no_mangle]
pub extern "C" fn run_app() {
    main();
}

#[cfg(not(target_os = "ios"))]
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // 二维码解析
            parse_qrcode,
            // 区块链交互
            get_balance,
            broadcast_transaction,
            get_transaction_history,
            estimate_gas,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ==================== 二维码解析命令 ====================

#[tauri::command]
fn parse_qrcode(json_str: String) -> Result<serde_json::Value, String> {
    parse_qrcode_data(&json_str)
}

// ==================== 区块链交互命令 ====================

#[tauri::command]
async fn get_balance(chain: String, address: String) -> Result<String, String> {
    blockchain::get_balance(&chain, &address).await
}

#[tauri::command]
async fn broadcast_transaction(chain: String, signed_tx: String) -> Result<String, String> {
    blockchain::broadcast_transaction(&chain, &signed_tx).await
}

#[tauri::command]
async fn get_transaction_history(chain: String, address: String) -> Result<String, String> {
    blockchain::get_transaction_history(&chain, &address).await
}

#[tauri::command]
async fn estimate_gas(chain: String, tx_data: String) -> Result<String, String> {
    blockchain::estimate_gas(&chain, &tx_data).await
}

