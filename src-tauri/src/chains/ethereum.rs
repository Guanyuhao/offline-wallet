use bip39::{Language, Mnemonic};
use ethers::signers::{LocalWallet, Signer};
use ethers::types::{Address, TransactionRequest, U256};
use ethers::utils::keccak256;
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use tiny_hderive::bip32::ExtendedPrivKey;

#[derive(Debug, Serialize, Deserialize)]
pub struct EthAddress {
    pub address: String,
    pub derivation_path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EthTransaction {
    pub to: String,
    pub value: String,
    pub gas_price: String,
    pub gas_limit: String,
    pub nonce: String,
    pub data: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignedTransaction {
    pub raw_transaction: String,
    pub transaction_hash: String,
}

/// 从助记词派生以太坊地址
/// path: BIP44 派生路径，例如 "m/44'/60'/0'/0/0"
pub fn derive_eth_address(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
) -> Result<EthAddress, String> {
    // 构建 BIP44 路径: m/44'/60'/0'/0/{index}
    let path = format!("m/44'/60'/0'/0/{}", index);

    // 从助记词生成种子
    let mnemonic_obj = Mnemonic::parse_in_normalized(Language::English, mnemonic)
        .map_err(|e| format!("Invalid mnemonic: {:?}", e))?;

    // 生成种子（bip39 2.0 使用 to_seed 方法）
    let seed = mnemonic_obj.to_seed(passphrase.unwrap_or(""));

    // 使用 BIP32 派生私钥
    let ext_key = ExtendedPrivKey::derive(&seed, path.as_str())
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;

    // 从私钥创建钱包（需要引用）
    let wallet = LocalWallet::from_bytes(&ext_key.secret())
        .map_err(|e| format!("Failed to create wallet: {}", e))?;

    let address = format!("{:?}", wallet.address());

    Ok(EthAddress {
        address,
        derivation_path: path,
    })
}

/// 签名以太坊交易
pub fn sign_eth_transaction(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
    tx: EthTransaction,
) -> Result<SignedTransaction, String> {
    // 构建派生路径
    let path = format!("m/44'/60'/0'/0/{}", index);

    // 从助记词生成种子
    let mnemonic_obj = Mnemonic::parse_in_normalized(Language::English, mnemonic)
        .map_err(|e| format!("Invalid mnemonic: {:?}", e))?;

    // 生成种子
    let seed = mnemonic_obj.to_seed(passphrase.unwrap_or(""));

    // 使用 BIP32 派生私钥
    let ext_key = ExtendedPrivKey::derive(&seed, path.as_str())
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;

    // 从私钥创建钱包（需要引用）
    let wallet = LocalWallet::from_bytes(&ext_key.secret())
        .map_err(|e| format!("Failed to create wallet: {}", e))?;

    // 解析交易参数
    let to_address = Address::from_str(&tx.to)
        .map_err(|e| format!("Invalid to address: {}", e))?;

    let value = U256::from_dec_str(&tx.value)
        .map_err(|e| format!("Invalid value: {}", e))?;

    let gas_price = U256::from_dec_str(&tx.gas_price)
        .map_err(|e| format!("Invalid gas price: {}", e))?;

    let gas_limit = U256::from_dec_str(&tx.gas_limit)
        .map_err(|e| format!("Invalid gas limit: {}", e))?;

    let nonce = U256::from_dec_str(&tx.nonce)
        .map_err(|e| format!("Invalid nonce: {}", e))?;

    // 构建交易
    let mut transaction = TransactionRequest::new()
        .to(to_address)
        .value(value)
        .gas_price(gas_price)
        .gas(gas_limit)
        .nonce(nonce);

    if let Some(data) = &tx.data {
        let data_bytes = hex::decode(data.trim_start_matches("0x"))
            .map_err(|e| format!("Invalid data hex: {}", e))?;
        transaction = transaction.data(data_bytes);
    }

    // 克隆交易以便后续使用
    let transaction_for_rlp = transaction.clone();

    // 签名交易 (使用 legacy 交易类型以保持简单)
    let signature = wallet
        .sign_transaction_sync(&transaction.into())
        .map_err(|e| format!("Failed to sign transaction: {}", e))?;

    // 序列化签名后的交易
    let rlp = transaction_for_rlp.rlp_signed(&signature);
    let raw_transaction = format!("0x{}", hex::encode(&rlp));

    // 计算交易哈希
    let tx_hash = keccak256(&rlp);
    let transaction_hash = format!("0x{}", hex::encode(tx_hash));

    Ok(SignedTransaction {
        raw_transaction,
        transaction_hash,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_eth_address() {
        // 使用标准测试助记词
        let mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        
        let result = derive_eth_address(mnemonic, None, 0).unwrap();
        println!("Address: {}", result.address);
        println!("Path: {}", result.derivation_path);
        
        assert!(result.address.starts_with("0x"));
        assert_eq!(result.derivation_path, "m/44'/60'/0'/0/0");
    }
}

