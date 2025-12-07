// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod blockchain;

// 使用共享库的二维码代码
use offline_wallet_shared::qrcode;
// 使用共享库的插件注册函数
use offline_wallet_shared::plugins::register_all_plugins;

#[cfg(target_os = "ios")]
#[tauri::mobile_entry_point]
fn main() {
    setup_app();
}

#[cfg(not(target_os = "ios"))]
fn main() {
    setup_app();
}

fn setup_app() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init());
    
    // 注册所有插件（OS 插件 + 移动端插件）
    let builder = register_all_plugins(builder);
    
    builder
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
    offline_wallet_shared::qrcode::parse_qrcode_data(&json_str)
}

// ==================== 区块链交互命令 ====================

#[tauri::command]
async fn get_balance(chain: String, address: String) -> Result<String, String> {
    blockchain::get_balance(&chain, &address).await
}

#[tauri::command]
async fn broadcast_transaction(chain: String, signed_tx: String) -> Result<String, String> {
    blockchain::broadcast_transaction(&chain, signed_tx).await
}

#[tauri::command]
async fn get_transaction_history(chain: String, address: String) -> Result<String, String> {
    blockchain::get_transaction_history(&chain, &address).await
}

#[tauri::command]
async fn estimate_gas(chain: String, tx_data: String) -> Result<String, String> {
    blockchain::estimate_gas(&chain, &tx_data).await
}

