mod crypto;
mod chains;
mod qrcode_gen;
mod webview_perf;

use crypto::*;
use chains::*;
use qrcode_gen::*;
use webview_perf::{CacheManager, PerformanceMonitor, PreloadManager, WebViewOptimizer};
use crypto::secure_storage;
use crypto::password_strength::{check_password_strength, validate_password_strength, PasswordStrength};
use std::sync::Arc;
use tauri::Manager;
use serde::{Deserialize, Serialize};
use serde_json;

// ==================== 助记词相关命令 ====================

/// 生成 BIP39 助记词
#[tauri::command]
fn generate_mnemonic_cmd(word_count: usize) -> Result<String, String> {
    generate_mnemonic(word_count)
}

/// 验证助记词
#[tauri::command]
fn validate_mnemonic_cmd(mnemonic: String) -> Result<bool, String> {
    validate_mnemonic(&mnemonic)
}

/// 获取助记词信息
#[tauri::command]
fn get_mnemonic_info_cmd(mnemonic: String) -> Result<MnemonicInfo, String> {
    get_mnemonic_info(&mnemonic)
}

// ==================== 以太坊相关命令 ====================

/// 派生以太坊地址
#[tauri::command]
fn derive_eth_address_cmd(
    mnemonic: String,
    passphrase: Option<String>,
    index: u32,
) -> Result<EthAddress, String> {
    derive_eth_address(&mnemonic, passphrase.as_deref(), index)
}

/// 签名以太坊交易
#[tauri::command]
fn sign_eth_transaction_cmd(
    mnemonic: String,
    passphrase: Option<String>,
    index: u32,
    transaction: EthTransaction,
) -> Result<SignedTransaction, String> {
    sign_eth_transaction(&mnemonic, passphrase.as_deref(), index, transaction)
}

// ==================== Bitcoin 相关命令 ====================

/// 派生 Bitcoin 地址
#[tauri::command]
fn derive_btc_address_cmd(
    mnemonic: String,
    passphrase: Option<String>,
    index: u32,
    address_type: String,
) -> Result<BtcAddress, String> {
    derive_btc_address(&mnemonic, passphrase.as_deref(), index, &address_type)
}

/// 签名 Bitcoin 交易
#[tauri::command]
fn sign_btc_transaction_cmd(
    mnemonic: String,
    passphrase: Option<String>,
    index: u32,
    transaction: BtcTransaction,
) -> Result<SignedBtcTransaction, String> {
    sign_btc_transaction(&mnemonic, passphrase.as_deref(), index, transaction)
}

// ==================== BNB 相关命令 ====================

/// 派生 BNB 地址
#[tauri::command]
fn derive_bnb_address_cmd(
    mnemonic: String,
    passphrase: Option<String>,
    index: u32,
) -> Result<BnbAddress, String> {
    derive_bnb_address(&mnemonic, passphrase.as_deref(), index)
}

/// 签名 BNB 交易
#[tauri::command]
fn sign_bnb_transaction_cmd(
    mnemonic: String,
    passphrase: Option<String>,
    index: u32,
    transaction: BnbTransaction,
) -> Result<SignedBnbTransaction, String> {
    sign_bnb_transaction(&mnemonic, passphrase.as_deref(), index, transaction)
}

// ==================== Solana 相关命令 ====================

/// 派生 Solana 地址
#[tauri::command]
fn derive_sol_address_cmd(
    mnemonic: String,
    passphrase: Option<String>,
    index: u32,
) -> Result<SolAddress, String> {
    derive_sol_address(&mnemonic, passphrase.as_deref(), index)
}

/// 签名 Solana 交易
#[tauri::command]
fn sign_sol_transaction_cmd(
    mnemonic: String,
    passphrase: Option<String>,
    index: u32,
    transaction: SolTransaction,
) -> Result<SignedSolTransaction, String> {
    sign_sol_transaction(&mnemonic, passphrase.as_deref(), index, transaction)
}

// ==================== Tron 相关命令 ====================

/// 派生 Tron 地址
#[tauri::command]
fn derive_tron_address_cmd(
    mnemonic: String,
    passphrase: Option<String>,
    index: u32,
) -> Result<TronAddress, String> {
    derive_tron_address(&mnemonic, passphrase.as_deref(), index)
}

/// 签名 Tron 交易
#[tauri::command]
fn sign_tron_transaction_cmd(
    mnemonic: String,
    passphrase: Option<String>,
    index: u32,
    transaction: TronTransaction,
) -> Result<SignedTronTransaction, String> {
    sign_tron_transaction(&mnemonic, passphrase.as_deref(), index, transaction)
}

// ==================== 地址验证命令 ====================

/// 验证地址格式
#[tauri::command]
fn validate_address_cmd(chain: String, address: String) -> Result<bool, String> {
    Ok(validate_address(&chain, &address))
}

// ==================== 二维码生成命令 ====================

/// 生成二维码（返回 Base64 编码的 PNG）
#[tauri::command]
fn generate_qrcode_cmd(data: String) -> Result<String, String> {
    generate_qrcode_base64(&data)
}

/// 生成带 logo 的二维码（返回 Base64 编码的 PNG）
#[tauri::command]
fn generate_qrcode_with_logo_cmd(data: String, logo_path: Option<String>) -> Result<String, String> {
    generate_qrcode_with_logo(&data, logo_path.as_deref())
}

// ==================== WebView 性能优化命令 ====================

/// 获取性能指标
#[tauri::command]
fn get_performance_metrics(monitor: tauri::State<Arc<PerformanceMonitor>>) -> Result<serde_json::Value, String> {
    let metrics = monitor.get_metrics();
    Ok(serde_json::to_value(metrics).map_err(|e| e.to_string())?)
}

/// 清除缓存
#[tauri::command]
fn clear_cache(cache_manager: tauri::State<Arc<CacheManager>>) -> Result<(), String> {
    cache_manager.clear_all();
    Ok(())
}

/// 清除过期缓存
#[tauri::command]
fn clear_expired_cache(cache_manager: tauri::State<Arc<CacheManager>>) -> Result<(), String> {
    cache_manager.clear_expired();
    Ok(())
}

/// 注入优化脚本到 WebView
#[tauri::command]
async fn inject_optimization_script(
    app: tauri::AppHandle,
    script_type: String,
) -> Result<(), String> {
    let script = match script_type.as_str() {
        "scroll" => WebViewOptimizer::get_scroll_optimization_script(),
        "memory" => WebViewOptimizer::get_memory_optimization_script(),
        "resource" => WebViewOptimizer::get_resource_optimization_script(),
        "all" => WebViewOptimizer::get_all_optimization_scripts(),
        _ => return Err(format!("Unknown script type: {}", script_type)),
    };

    if let Some(window) = app.get_webview_window("main") {
        window.eval(&script).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Main window not found".to_string())
    }
}

/// 记录页面加载完成
#[tauri::command]
fn record_page_load(monitor: tauri::State<Arc<PerformanceMonitor>>) -> Result<(), String> {
    monitor.record_page_load();
    Ok(())
}

/// 记录首次内容绘制
#[tauri::command]
fn record_first_contentful_paint(monitor: tauri::State<Arc<PerformanceMonitor>>) -> Result<(), String> {
    monitor.record_first_contentful_paint();
    Ok(())
}

// ==================== 系统级安全存储命令 ====================

/// 加密并存储助记词到系统级安全存储
#[tauri::command]
fn store_encrypted_mnemonic(mnemonic: String, password: String) -> Result<(), String> {
    secure_storage::store_encrypted_mnemonic(&mnemonic, &password)
        .map_err(|e| format!("Failed to store encrypted mnemonic: {}", e))
}

/// 从系统级安全存储读取并解密助记词
#[tauri::command]
fn retrieve_encrypted_mnemonic(password: String) -> Result<String, String> {
    secure_storage::retrieve_encrypted_mnemonic(&password)
        .map_err(|e| format!("Failed to retrieve mnemonic: {}", e))
}

/// 检查是否存在加密的助记词
#[tauri::command]
fn has_encrypted_mnemonic() -> Result<bool, String> {
    Ok(secure_storage::has_encrypted_mnemonic())
}

/// 删除加密的助记词
#[tauri::command]
fn delete_encrypted_mnemonic() -> Result<(), String> {
    secure_storage::delete_encrypted_mnemonic()
        .map_err(|e| format!("Failed to delete encrypted mnemonic: {}", e))
}

/// 验证密码（不返回助记词）
#[tauri::command]
fn verify_mnemonic_password(password: String) -> Result<bool, String> {
    secure_storage::verify_mnemonic_password(&password)
        .map_err(|e| format!("Failed to verify password: {}", e))
}

// ==================== 生物识别相关命令 ====================

/// 存储生物识别密码（加密后的密码）
#[tauri::command]
fn store_biometric_password(encrypted_password: String) -> Result<(), String> {
    secure_storage::store_biometric_password(&encrypted_password)
        .map_err(|e| format!("Failed to store biometric password: {}", e))
}

/// 获取生物识别密码（用于生物识别成功后自动解锁）
#[tauri::command]
fn get_biometric_password() -> Result<String, String> {
    secure_storage::get_biometric_password()
        .map_err(|e| format!("Failed to get biometric password: {}", e))
}

/// 删除生物识别密码
#[tauri::command]
fn delete_biometric_password() -> Result<(), String> {
    secure_storage::delete_biometric_password()
        .map_err(|e| format!("Failed to delete biometric password: {}", e))
}

/// 检查是否存在生物识别密码
#[tauri::command]
fn has_biometric_password() -> Result<bool, String> {
    Ok(secure_storage::has_biometric_password())
}

// ==================== 密码强度检测命令 ====================

/// 密码强度检测结果（序列化）
#[derive(Debug, Serialize, Deserialize)]
struct PasswordStrengthResultDto {
    strength: String,
    score: u8,
    crack_time_seconds: u64,
    feedback: Vec<String>,
    is_sufficient: bool,
}

/// 检测密码强度
#[tauri::command]
fn check_password_strength_cmd(password: String) -> Result<PasswordStrengthResultDto, String> {
    let result = check_password_strength(&password);
    
    Ok(PasswordStrengthResultDto {
        strength: result.strength.to_string_cn().to_string(),
        score: result.score,
        crack_time_seconds: result.crack_time_seconds,
        feedback: result.feedback,
        is_sufficient: result.strength.is_sufficient(),
    })
}

/// 验证密码强度是否符合要求
#[tauri::command]
fn validate_password_strength_cmd(password: String) -> Result<(), String> {
    validate_password_strength(&password, PasswordStrength::Medium)
        .map_err(|e| e)
}

// ==================== 应用入口 ====================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化性能优化组件
    let cache_manager = Arc::new(CacheManager::new());
    let performance_monitor = Arc::new(PerformanceMonitor::new());
    let preload_manager = Arc::new(PreloadManager::new());
    
    // 记录 WebView 初始化开始时间
    // 注意：在 Tauri 2.0 中，WebView 的初始化时机可能不同
    // 这里我们记录应用启动时间作为参考
    
    let builder = tauri::Builder::default()
        .manage(cache_manager.clone())
        .manage(performance_monitor.clone())
        .manage(preload_manager.clone());
    
    // 只在移动端初始化 barcode-scanner 和 biometric 插件
    #[cfg(any(target_os = "android", target_os = "ios"))]
    let builder = builder
        .plugin(tauri_plugin_barcode_scanner::init())
        .plugin(tauri_plugin_biometric::init());
    
    builder
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            generate_mnemonic_cmd,
            validate_mnemonic_cmd,
            get_mnemonic_info_cmd,
            derive_eth_address_cmd,
            sign_eth_transaction_cmd,
            derive_btc_address_cmd,
            sign_btc_transaction_cmd,
            derive_bnb_address_cmd,
            sign_bnb_transaction_cmd,
            derive_sol_address_cmd,
            sign_sol_transaction_cmd,
            derive_tron_address_cmd,
            sign_tron_transaction_cmd,
            validate_address_cmd,
            generate_qrcode_cmd,
            generate_qrcode_with_logo_cmd,
            get_performance_metrics,
            clear_cache,
            clear_expired_cache,
            inject_optimization_script,
            record_page_load,
            record_first_contentful_paint,
            store_encrypted_mnemonic,
            retrieve_encrypted_mnemonic,
            has_encrypted_mnemonic,
            delete_encrypted_mnemonic,
            verify_mnemonic_password,
            check_password_strength_cmd,
            validate_password_strength_cmd,
            store_biometric_password,
            get_biometric_password,
            delete_biometric_password,
            has_biometric_password,
        ])
        .setup(move |app| {
            // 应用启动时的初始化工作
            // 可以在这里进行资源预加载等操作
            
            // 注入 WebView 优化脚本
            // 延迟注入以确保 WebView 已初始化
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                // 等待窗口创建和 WebView 初始化
                std::thread::sleep(std::time::Duration::from_millis(1000));
                
                if let Some(window) = app_handle.get_webview_window("main") {
                    let optimization_script = WebViewOptimizer::get_all_optimization_scripts();
                    if let Err(e) = window.eval(&optimization_script) {
                        eprintln!("Failed to inject optimization scripts: {:?}", e);
                    } else {
                        println!("WebView optimization scripts injected successfully");
                    }
                }
            });
            
            // 定期清理过期缓存（每5分钟）
            let cache_manager_clone = cache_manager.clone();
            std::thread::spawn(move || {
                loop {
                    std::thread::sleep(std::time::Duration::from_secs(300));
                    cache_manager_clone.clear_expired();
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
