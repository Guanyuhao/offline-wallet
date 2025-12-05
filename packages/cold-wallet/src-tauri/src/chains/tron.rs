use bip39::{Language, Mnemonic};
use ethers::types::U256;
use ethers::utils::keccak256;
use serde::{Deserialize, Serialize};
use tiny_hderive::bip32::ExtendedPrivKey;
use sha3::{Digest, Keccak256};
use bs58;
use secp256k1::{Secp256k1, SecretKey, PublicKey};

#[derive(Debug, Serialize, Deserialize)]
pub struct TronAddress {
    pub address: String,
    pub derivation_path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TronTransaction {
    pub to: String,
    pub value: String, // TRX amount (1 TRX = 1,000,000 SUN)
    pub gas_price: Option<String>,
    pub gas_limit: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignedTronTransaction {
    pub raw_transaction: String,
    pub transaction_hash: String,
}

/// 从公钥派生 Tron 地址
/// Tron 地址 = T + Base58(Keccak256(公钥)[12..32])
fn derive_tron_address_from_pubkey(pubkey: &[u8]) -> String {
    // Tron 使用 Keccak256 哈希公钥，然后取后20字节
    let hash = Keccak256::digest(pubkey);
    let address_bytes = &hash[12..32]; // 取后20字节
    
    // Base58 编码并添加 T 前缀
    let encoded = bs58::encode(address_bytes).into_string();
    format!("T{}", encoded)
}

/// 从助记词派生 Tron 地址
/// Tron 使用 BIP44 路径 m/44'/195'/0'/0/{index}
pub fn derive_tron_address(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
) -> Result<TronAddress, String> {
    // Tron 使用 m/44'/195'/0'/0/{index} (coin_type 195)
    let path = format!("m/44'/195'/0'/0/{}", index);

    let mnemonic_obj = Mnemonic::parse_in_normalized(Language::English, mnemonic)
        .map_err(|e| format!("Invalid mnemonic: {:?}", e))?;

    let seed = mnemonic_obj.to_seed(passphrase.unwrap_or(""));
    let ext_key = ExtendedPrivKey::derive(&seed, path.as_str())
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;

    // 从私钥获取公钥（未压缩，65字节）
    let secp = Secp256k1::new();
    let secret_key = SecretKey::from_slice(&ext_key.secret())
        .map_err(|e| format!("Failed to create secret key: {}", e))?;
    
    let public_key = PublicKey::from_secret_key(&secp, &secret_key);
    let pubkey_bytes = public_key.serialize_uncompressed();
    
    // 从公钥派生 Tron 地址
    let tron_address = derive_tron_address_from_pubkey(&pubkey_bytes[1..]); // 跳过 0x04 前缀

    Ok(TronAddress {
        address: tron_address,
        derivation_path: path,
    })
}

/// 签名 Tron 交易
/// Tron 交易格式与以太坊类似，但需要特殊处理
pub fn sign_tron_transaction(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
    tx: TronTransaction,
) -> Result<SignedTronTransaction, String> {
    // 获取私钥
    let path = format!("m/44'/195'/0'/0/{}", index);
    let mnemonic_obj = Mnemonic::parse_in_normalized(Language::English, mnemonic)
        .map_err(|e| format!("Invalid mnemonic: {:?}", e))?;
    
    let seed = mnemonic_obj.to_seed(passphrase.unwrap_or(""));
    let ext_key = ExtendedPrivKey::derive(&seed, path.as_str())
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;
    
    // 解析交易参数
    let value = U256::from_dec_str(&tx.value)
        .map_err(|e| format!("Invalid value: {}", e))?;
    
    // Tron 使用固定的 Gas Price 和 Gas Limit（如果未提供）
    let gas_price = if let Some(gp) = &tx.gas_price {
        U256::from_dec_str(gp)
            .map_err(|e| format!("Invalid gas price: {}", e))?
    } else {
        U256::from(420) // 默认 420 SUN
    };
    
    let gas_limit = if let Some(gl) = &tx.gas_limit {
        U256::from_dec_str(gl)
            .map_err(|e| format!("Invalid gas limit: {}", e))?
    } else {
        U256::from(21000) // 默认值
    };
    
    // 签名交易（简化版）
    // 注意：Tron 交易格式与以太坊类似，但实际网络格式不同
    // 这里返回一个简化的签名数据
    let tx_data = format!("{}:{}:{}:{}", tx.to, value, gas_price, gas_limit);
    let message_hash = keccak256(tx_data.as_bytes());
    
    // 使用 secp256k1 直接签名（Tron 使用相同的签名算法）
    let secp = Secp256k1::new();
    let secret_key = SecretKey::from_slice(&ext_key.secret())
        .map_err(|e| format!("Failed to create secret key: {}", e))?;
    
    let message = secp256k1::Message::from_digest_slice(&message_hash)
        .map_err(|e| format!("Failed to create message: {}", e))?;
    
    let signature = secp.sign_ecdsa(&message, &secret_key);
    let signature_bytes = signature.serialize_compact();
    
    // 构建交易数据（简化版）
    let mut raw_tx = Vec::new();
    raw_tx.extend_from_slice(&message_hash);
    raw_tx.extend_from_slice(&signature_bytes);
    
    let transaction_hash = format!("0x{}", hex::encode(message_hash));
    let raw_transaction = format!("0x{}", hex::encode(&raw_tx));
    
    Ok(SignedTronTransaction {
        raw_transaction,
        transaction_hash,
    })
}

