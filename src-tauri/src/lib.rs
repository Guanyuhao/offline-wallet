mod crypto;
mod chains;
mod qrcode_gen;

use crypto::*;
use chains::*;
use qrcode_gen::*;

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

// ==================== 应用入口 ====================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    
    // 只在移动端初始化 barcode-scanner 插件
    #[cfg(any(target_os = "android", target_os = "ios"))]
    let builder = builder.plugin(tauri_plugin_barcode_scanner::init());
    
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
