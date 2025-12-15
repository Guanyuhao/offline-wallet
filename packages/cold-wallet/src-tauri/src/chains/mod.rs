// 重用 shared 库的链模块（避免代码重复）
pub use offline_wallet_shared::chains::ethereum;
pub use offline_wallet_shared::chains::bitcoin;
pub use offline_wallet_shared::chains::solana;
pub use offline_wallet_shared::chains::tron;
// 注：BNB Chain 使用 ethereum 模块（EVM 兼容）

// cold-wallet 独有的模块
pub mod kaspa;
pub mod address_validation;

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChainType {
    Eth,
    Btc,
    Sol,
    Bnb,
    Tron,
    Kaspa,
}

/// 从助记词派生地址
pub fn derive_address(
    chain: ChainType,
    mnemonic: &str,
    derivation_path: Option<&str>,
) -> Result<String, String> {
    // 默认使用索引 0
    let index = derivation_path
        .and_then(|p| {
            p.split('/')
                .last()
                .and_then(|s| s.parse::<u32>().ok())
        })
        .unwrap_or(0);

    match chain {
        ChainType::Eth => {
            let result = ethereum::derive_eth_address(mnemonic, None, index)?;
            Ok(result.address)
        }
        ChainType::Bnb => {
            // BNB Chain 使用与以太坊相同的地址格式
            let result = ethereum::derive_eth_address(mnemonic, None, index)?;
            Ok(result.address)
        }
        ChainType::Btc => {
            // 默认使用 native segwit
            let result = bitcoin::derive_btc_address(mnemonic, None, index, "native_segwit")?;
            Ok(result.address)
        }
        ChainType::Sol => {
            let result = solana::derive_sol_address(mnemonic, None, index)?;
            Ok(result.address)
        }
        ChainType::Tron => {
            let result = tron::derive_tron_address(mnemonic, None, index)?;
            Ok(result.address)
        }
        ChainType::Kaspa => {
            let result = kaspa::derive_kaspa_address(mnemonic, None, index)?;
            Ok(result.address)
        }
    }
}

/// 签名交易
pub fn sign_transaction(
    chain: ChainType,
    mnemonic: &str,
    tx_data: &str,
) -> Result<String, String> {
    let tx_json: Value = serde_json::from_str(tx_data)
        .map_err(|e| format!("Invalid transaction data: {}", e))?;

    match chain {
        ChainType::Eth => {
            let tx: ethereum::EthTransaction = serde_json::from_value(tx_json.clone())
                .map_err(|e| format!("Invalid ETH transaction: {}", e))?;
            let index = tx_json
                .get("index")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as u32;
            let result = ethereum::sign_eth_transaction(mnemonic, None, index, tx)?;
            Ok(serde_json::to_string(&result)
                .map_err(|e| format!("Failed to serialize: {}", e))?)
        }
        ChainType::Bnb => {
            // BNB Chain 与以太坊兼容
            let tx: ethereum::EthTransaction = serde_json::from_value(tx_json.clone())
                .map_err(|e| format!("Invalid BNB transaction: {}", e))?;
            let index = tx_json
                .get("index")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as u32;
            let result = ethereum::sign_eth_transaction(mnemonic, None, index, tx)?;
            Ok(serde_json::to_string(&result)
                .map_err(|e| format!("Failed to serialize: {}", e))?)
        }
        ChainType::Btc => {
            let tx: bitcoin::BtcTransaction = serde_json::from_value(tx_json.clone())
                .map_err(|e| format!("Invalid BTC transaction: {}", e))?;
            let index = tx_json
                .get("index")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as u32;
            let result = bitcoin::sign_btc_transaction(mnemonic, None, index, tx)?;
            Ok(serde_json::to_string(&result)
                .map_err(|e| format!("Failed to serialize: {}", e))?)
        }
        ChainType::Sol => {
            let tx: solana::SolTransaction = serde_json::from_value(tx_json.clone())
                .map_err(|e| format!("Invalid SOL transaction: {}", e))?;
            let index = tx_json
                .get("index")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as u32;
            let result = solana::sign_sol_transaction(mnemonic, None, index, tx)?;
            Ok(serde_json::to_string(&result)
                .map_err(|e| format!("Failed to serialize: {}", e))?)
        }
        ChainType::Tron => {
            let tx: tron::TronTransaction = serde_json::from_value(tx_json.clone())
                .map_err(|e| format!("Invalid TRON transaction: {}", e))?;
            let index = tx_json
                .get("index")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as u32;
            let result = tron::sign_tron_transaction(mnemonic, None, index, tx)?;
            Ok(serde_json::to_string(&result)
                .map_err(|e| format!("Failed to serialize: {}", e))?)
        }
        ChainType::Kaspa => {
            let tx: kaspa::KaspaTransaction = serde_json::from_value(tx_json.clone())
                .map_err(|e| format!("Invalid KASPA transaction: {}", e))?;
            let index = tx_json
                .get("index")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as u32;
            let result = kaspa::sign_kaspa_transaction(mnemonic, None, index, tx)?;
            Ok(serde_json::to_string(&result)
                .map_err(|e| format!("Failed to serialize: {}", e))?)
        }
    }
}
