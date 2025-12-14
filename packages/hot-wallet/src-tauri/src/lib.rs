// 库模块 - 供移动端使用

mod blockchain;

// 使用共享库的插件注册函数
use offline_wallet_shared::plugins::register_all_plugins;

fn setup_app(builder: tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    let builder = builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init());
    
    // 注册所有插件（OS 插件 + 移动端插件）
    let builder = register_all_plugins(builder);
    
    builder
        .invoke_handler(tauri::generate_handler![
            // 二维码相关
            parse_qrcode,
            generate_qrcode,
            generate_qrcode_with_logo,
            // 地址验证
            validate_address,
            detect_chain,
            // 区块链交互
            get_balance,
            broadcast_transaction,
            get_transaction_history,
            estimate_gas,
            get_token_balances,
            get_nonce,
            get_gas_price,
            get_tx_params,
        ])
}

/// 运行 Tauri 应用（供移动端和桌面端共用）
pub fn run() {
    setup_app(tauri::Builder::default())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// 移动端入口点（iOS 和 Android）
#[cfg(mobile)]
#[tauri::mobile_entry_point]
fn main() {
    run();
}

// ==================== 二维码命令 ====================

#[tauri::command]
fn parse_qrcode(json_str: String) -> Result<serde_json::Value, String> {
    offline_wallet_shared::qrcode::parse_qrcode_data(&json_str)
}

#[tauri::command]
fn generate_qrcode(data: String, size: u32) -> Result<String, String> {
    offline_wallet_shared::qrcode::generate_qrcode(&data, size)
}

#[tauri::command]
fn generate_qrcode_with_logo(
    data: String,
    size: u32,
    logo_base64: String,
    logo_size_ratio: f32,
) -> Result<String, String> {
    offline_wallet_shared::qrcode::generate_qrcode_with_logo(&data, size, &logo_base64, logo_size_ratio)
}

// ==================== 地址验证命令 ====================

#[tauri::command]
fn validate_address(chain: String, address: String) -> Result<bool, String> {
    Ok(offline_wallet_shared::chains::validate_address(&chain, &address))
}

#[tauri::command]
fn detect_chain(address: String) -> Result<Vec<String>, String> {
    Ok(offline_wallet_shared::chains::detect_chain_from_address(&address))
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

#[tauri::command]
async fn get_token_balances(chain: String, address: String) -> Result<String, String> {
    blockchain::get_token_balances(&chain, &address).await
}

#[tauri::command]
async fn get_nonce(chain: String, address: String) -> Result<String, String> {
    blockchain::get_nonce(&chain, &address).await
}

#[tauri::command]
async fn get_gas_price(chain: String) -> Result<String, String> {
    blockchain::get_gas_price(&chain).await
}

#[tauri::command]
async fn get_tx_params(chain: String, address: String) -> Result<String, String> {
    blockchain::get_tx_params(&chain, &address).await
}
