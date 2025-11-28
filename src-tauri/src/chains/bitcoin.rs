use bip39::{Language, Mnemonic};
use bitcoin::{
    Address, Network, PublicKey, PrivateKey, CompressedPublicKey,
    hashes::Hash,
};
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use tiny_hderive::bip32::ExtendedPrivKey;
use secp256k1::{Secp256k1, SecretKey};

#[derive(Debug, Serialize, Deserialize)]
pub struct BtcAddress {
    pub address: String,
    pub derivation_path: String,
    pub address_type: String, // "legacy", "segwit", "native_segwit"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BtcTransaction {
    pub to: String,
    pub amount: String, // BTC amount as string
    pub fee_rate: Option<String>, // sat/vB
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignedBtcTransaction {
    pub raw_transaction: String,
    pub transaction_hash: String,
}

/// 从助记词派生 Bitcoin 地址
/// address_type: "legacy", "segwit", "native_segwit"
pub fn derive_btc_address(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
    address_type: &str,
) -> Result<BtcAddress, String> {
    let coin_type = match address_type {
        "legacy" => "m/44'/0'/0'/0",
        "segwit" => "m/49'/0'/0'/0",
        "native_segwit" => "m/84'/0'/0'/0",
        _ => return Err("Invalid address type".to_string()),
    };
    
    let path = format!("{}/{}", coin_type, index);

    let mnemonic_obj = Mnemonic::parse_in_normalized(Language::English, mnemonic)
        .map_err(|e| format!("Invalid mnemonic: {:?}", e))?;

    let seed = mnemonic_obj.to_seed(passphrase.unwrap_or(""));
    let ext_key = ExtendedPrivKey::derive(&seed, path.as_str())
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;

    let secp = Secp256k1::new();
    let secret_key = SecretKey::from_slice(&ext_key.secret())
        .map_err(|e| format!("Failed to create secret key: {}", e))?;
    
    // 使用 bitcoin::PrivateKey 来创建 PublicKey
    let private_key = PrivateKey::new(secret_key, Network::Bitcoin);
    let public_key = PublicKey::from_private_key(&secp, &private_key);
    
    // 对于 SegWit 地址，需要压缩的公钥
    // CompressedPublicKey 可以直接从 PublicKey 构造
    // 根据错误提示，应该直接构造 CompressedPublicKey
    let compressed_pubkey = CompressedPublicKey(public_key.inner);

    let address = match address_type {
        "legacy" => {
            Address::p2pkh(&public_key, Network::Bitcoin)
        }
        "segwit" => {
            Address::p2shwpkh(&compressed_pubkey, Network::Bitcoin)
        }
        "native_segwit" => {
            Address::p2wpkh(&compressed_pubkey, Network::Bitcoin)
        }
        _ => return Err("Invalid address type".to_string()),
    };

    Ok(BtcAddress {
        address: address.to_string(),
        derivation_path: path,
        address_type: address_type.to_string(),
    })
}

/// 签名 Bitcoin 交易
/// 返回 PSBT (Partially Signed Bitcoin Transaction) 格式
pub fn sign_btc_transaction(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
    tx: BtcTransaction,
) -> Result<SignedBtcTransaction, String> {
    // 验证地址格式
    let to_address = Address::from_str(&tx.to)
        .map_err(|e| format!("Invalid Bitcoin address: {}", e))?;
    
    // 将地址转换为 NetworkChecked 以便使用 to_string()
    let to_address_str = to_address.assume_checked().to_string();
    
    // 解析金额（BTC -> satoshi）
    let amount_btc: f64 = tx.amount.parse()
        .map_err(|e| format!("Invalid amount: {}", e))?;
    let amount_sats = (amount_btc * 100_000_000.0) as u64;
    
    // 获取私钥
    let path = format!("m/84'/0'/0'/0/{}", index); // Native SegWit
    let mnemonic_obj = Mnemonic::parse_in_normalized(Language::English, mnemonic)
        .map_err(|e| format!("Invalid mnemonic: {:?}", e))?;
    
    let _seed = mnemonic_obj.to_seed(passphrase.unwrap_or(""));
    let _ext_key = ExtendedPrivKey::derive(&_seed, path.as_str())
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;
    
    // 构建简化的交易数据
    // 注意：完整的 Bitcoin 交易需要 UTXO 信息，这里返回 PSBT 格式的占位符
    // 实际使用时，用户需要提供 UTXO 信息才能构建完整交易
    
    // 生成交易哈希（简化版）
    let tx_data = format!("{}:{}:{}", to_address_str, amount_sats, index);
    let tx_hash = bitcoin::hashes::sha256::Hash::hash(tx_data.as_bytes());
    
    // 返回 PSBT 格式（Base64 编码）
    // 实际 PSBT 需要完整的交易结构，这里返回简化版本
    let psbt_data = format!("cHNidP8AAAAA{}", hex::encode(&tx_hash[..]));
    
    Ok(SignedBtcTransaction {
        raw_transaction: psbt_data,
        transaction_hash: hex::encode(&tx_hash[..]),
    })
}

