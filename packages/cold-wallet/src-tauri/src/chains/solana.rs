use bip39::{Language, Mnemonic};
use ed25519_dalek::{Signer, SigningKey, VerifyingKey};
use serde::{Deserialize, Serialize};
use tiny_hderive::bip32::ExtendedPrivKey;
use bs58;

#[derive(Debug, Serialize, Deserialize)]
pub struct SolAddress {
    pub address: String,
    pub derivation_path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SolTransaction {
    pub to: String,
    pub amount: String, // SOL amount as string
    pub recent_blockhash: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignedSolTransaction {
    pub raw_transaction: String,
    pub signature: String,
}

/// 从助记词派生 Solana 地址
/// Solana 使用 BIP44 路径 m/44'/501'/0'/0'
pub fn derive_sol_address(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
) -> Result<SolAddress, String> {
    // Solana 使用 m/44'/501'/0'/0'/{index}
    let path = format!("m/44'/501'/0'/0'/{}", index);

    let mnemonic_obj = Mnemonic::parse_in_normalized(Language::English, mnemonic)
        .map_err(|e| format!("Invalid mnemonic: {:?}", e))?;

    let seed = mnemonic_obj.to_seed(passphrase.unwrap_or(""));
    let ext_key = ExtendedPrivKey::derive(&seed, path.as_str())
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;

    // Solana 使用 Ed25519，需要从私钥派生
    let secret_key = SigningKey::from_bytes(&ext_key.secret());
    let verifying_key = VerifyingKey::from(&secret_key);
    
    // Solana 地址是 Base58 编码的公钥
    let pubkey_bytes = verifying_key.to_bytes();
    let address = bs58::encode(&pubkey_bytes).into_string();

    Ok(SolAddress {
        address,
        derivation_path: path,
    })
}

/// 签名 Solana 交易
pub fn sign_sol_transaction(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
    tx: SolTransaction,
) -> Result<SignedSolTransaction, String> {
    // 获取密钥对
    let path = format!("m/44'/501'/0'/0'/{}", index);
    let mnemonic_obj = Mnemonic::parse_in_normalized(Language::English, mnemonic)
        .map_err(|e| format!("Invalid mnemonic: {:?}", e))?;
    
    let seed = mnemonic_obj.to_seed(passphrase.unwrap_or(""));
    let ext_key = ExtendedPrivKey::derive(&seed, path.as_str())
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;
    
    // Solana 使用 Ed25519
    let secret_key = SigningKey::from_bytes(&ext_key.secret());
    
    // 解析金额（SOL -> lamports, 1 SOL = 1,000,000,000 lamports）
    let amount_sol: f64 = tx.amount.parse()
        .map_err(|e| format!("Invalid amount: {}", e))?;
    let amount_lamports = (amount_sol * 1_000_000_000.0) as u64;
    
    // 构建交易数据（简化版）
    // 实际 Solana 交易需要：
    // 1. Recent Blockhash
    // 2. 指令（Instruction）
    // 3. 账户元数据
    // 这里返回一个简化的签名数据
    
    // 创建交易消息（简化版）
    let tx_message = format!(
        "{}:{}:{}",
        tx.to,
        amount_lamports,
        tx.recent_blockhash.unwrap_or_else(|| "default".to_string())
    );
    
    // 签名消息
    let message_bytes = tx_message.as_bytes();
    let signature = secret_key.sign(message_bytes);
    let signature_bytes = signature.to_bytes();
    
    // Base58 编码签名和交易
    let signature_encoded = bs58::encode(&signature_bytes).into_string();
    
    // 构建交易数据（包含签名和消息）
    let mut tx_data = Vec::new();
    tx_data.extend_from_slice(&signature_bytes);
    tx_data.extend_from_slice(message_bytes);
    let raw_transaction = bs58::encode(&tx_data).into_string();
    
    Ok(SignedSolTransaction {
        raw_transaction,
        signature: signature_encoded,
    })
}

