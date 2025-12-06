//! Kaspa (KAS) 链支持
//! 
//! Kaspa 使用 secp256k1 签名算法，地址格式为 Bech32 编码
//! BIP44 coin type: 111111 (0x1B207)
//! 使用官方 kaspa-addresses crate 生成地址

use bip39::{Language, Mnemonic};
use serde::{Deserialize, Serialize};
use tiny_hderive::bip32::ExtendedPrivKey;
use secp256k1::{Secp256k1, SecretKey, PublicKey as SecpPublicKey};
use kaspa_addresses::{Address, Prefix, Version};

#[derive(Debug, Serialize, Deserialize)]
pub struct KaspaAddress {
    pub address: String,
    pub derivation_path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KaspaTransaction {
    pub to: String,
    pub amount: String,
    pub fee: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignedKaspaTransaction {
    pub raw_transaction: String,
    pub transaction_hash: String,
}

// 复用 Secp256k1 上下文以提高性能
static SECP: std::sync::OnceLock<Secp256k1<secp256k1::All>> = std::sync::OnceLock::new();

fn get_secp() -> &'static Secp256k1<secp256k1::All> {
    SECP.get_or_init(Secp256k1::new)
}

/// 从公钥生成 Kaspa 地址
fn derive_kaspa_address_from_pubkey(pubkey: &SecpPublicKey) -> Result<String, String> {
    let pubkey_bytes = pubkey.serialize();
    // 压缩公钥总是 33 字节：0x02/0x03 + 32字节 x坐标
    let pubkey_32bytes = &pubkey_bytes[1..];
    let address = Address::new(Prefix::Mainnet, Version::PubKey, pubkey_32bytes);
    Ok(address.to_string())
}

/// 从助记词派生密钥（提取公共逻辑）
fn derive_key_from_mnemonic(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
) -> Result<(SecretKey, String), String> {
    let path = format!("m/44'/111111'/0'/0/{}", index);
    
    let mnemonic_obj = Mnemonic::parse_in_normalized(Language::English, mnemonic)
        .map_err(|e| format!("Invalid mnemonic: {:?}", e))?;
    
    let seed = mnemonic_obj.to_seed(passphrase.unwrap_or(""));
    let ext_key = ExtendedPrivKey::derive(&seed, path.as_str())
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;
    
    let secret_key = SecretKey::from_slice(&ext_key.secret())
        .map_err(|e| format!("Invalid secret key: {:?}", e))?;
    
    Ok((secret_key, path))
}

/// 从助记词派生 Kaspa 地址
pub fn derive_kaspa_address(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
) -> Result<KaspaAddress, String> {
    let (secret_key, path) = derive_key_from_mnemonic(mnemonic, passphrase, index)?;
    
    let public_key = SecpPublicKey::from_secret_key(get_secp(), &secret_key);
    let address = derive_kaspa_address_from_pubkey(&public_key)?;
    
    Ok(KaspaAddress { address, derivation_path: path })
}

/// 签名 Kaspa 交易
pub fn sign_kaspa_transaction(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
    tx: KaspaTransaction,
) -> Result<SignedKaspaTransaction, String> {
    let (secret_key, _) = derive_key_from_mnemonic(mnemonic, passphrase, index)?;
    
    let tx_data = format!(
        r#"{{"to":"{}","amount":"{}","fee":"{}"}}"#,
        tx.to,
        tx.amount,
        tx.fee.as_deref().unwrap_or("0")
    );
    
    use sha2::{Sha256, Digest};
    let hash = Sha256::digest(tx_data.as_bytes());
    let message = secp256k1::Message::from_digest_slice(&hash)
        .map_err(|e| format!("Failed to create message: {:?}", e))?;
    let signature = get_secp().sign_ecdsa(&message, &secret_key);
    
    let signature_bytes = signature.serialize_compact();
    let signed_tx = format!("{}{}", tx_data, hex::encode(signature_bytes));
    
    Ok(SignedKaspaTransaction {
        raw_transaction: signed_tx,
        transaction_hash: hex::encode(&hash),
    })
}

#[cfg(test)]
mod tests {
    use kaspa_addresses::{Address, Prefix, Version};

    #[test]
    fn test_address_from_pubkey_mainnet() {
        let address = Address::new(Prefix::Mainnet, Version::PubKey, &[0u8; 32]);
        let address_str: String = address.into();
        assert_eq!(address_str, "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e");
        
        let pubkey = b"\x5f\xff\x3c\x4d\xa1\x8f\x45\xad\xcd\xd4\x99\xe4\x46\x11\xe9\xff\xf1\x48\xba\x69\xdb\x3c\x4e\xa2\xdd\xd9\x55\xfc\x46\xa5\x95\x22";
        let address = Address::new(Prefix::Mainnet, Version::PubKey, pubkey);
        let address_str: String = address.into();
        assert_eq!(address_str, "kaspa:qp0l70zd5x85ttwd6jv7g3s3a8llzj96d8dncn4zmhv4tlzx5k2jyqh70xmfj");
    }

    #[test]
    fn test_address_from_pubkey_testnet() {
        let address = Address::new(Prefix::Testnet, Version::PubKey, &[0u8; 32]);
        let address_str: String = address.into();
        assert_eq!(address_str, "kaspatest:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhqrxplya");
        
        let address = Address::new(Prefix::Testnet, Version::PubKeyECDSA, &[0u8; 33]);
        let address_str: String = address.into();
        assert_eq!(address_str, "kaspatest:qyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhe837j2d");
        
        let pubkey_ecdsa = b"\xba\x01\xfc\x5f\x4e\x9d\x98\x79\x59\x9c\x69\xa3\xda\xfd\xb8\x35\xa7\x25\x5e\x5f\x2e\x93\x4e\x93\x22\xec\xd3\xaf\x19\x0a\xb0\xf6\x0e";
        let address = Address::new(Prefix::Testnet, Version::PubKeyECDSA, pubkey_ecdsa);
        let address_str: String = address.into();
        assert_eq!(address_str, "kaspatest:qxaqrlzlf6wes72en3568khahq66wf27tuhfxn5nytkd8tcep2c0vrse6gdmpks");
    }

    #[test]
    fn test_address_from_string() {
        let address_str = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";
        let address: Address = address_str.to_string().try_into().expect("Failed to parse address");
        assert_eq!(address.prefix, Prefix::Mainnet);
        assert_eq!(address.version, Version::PubKey);
        assert_eq!(address.payload.len(), 32);
        
        let address_str = "kaspa:qp0l70zd5x85ttwd6jv7g3s3a8llzj96d8dncn4zmhv4tlzx5k2jyqh70xmfj";
        let address: Address = address_str.to_string().try_into().expect("Failed to parse address");
        assert_eq!(address.prefix, Prefix::Mainnet);
        assert_eq!(address.version, Version::PubKey);
        assert_eq!(address.payload.len(), 32);
    }

    #[test]
    fn test_address_roundtrip() {
        let test_cases = vec![
            ("kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e", Prefix::Mainnet, Version::PubKey),
            ("kaspa:qp0l70zd5x85ttwd6jv7g3s3a8llzj96d8dncn4zmhv4tlzx5k2jyqh70xmfj", Prefix::Mainnet, Version::PubKey),
            ("kaspatest:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhqrxplya", Prefix::Testnet, Version::PubKey),
            ("kaspatest:qyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhe837j2d", Prefix::Testnet, Version::PubKeyECDSA),
        ];
        
        for (address_str, expected_prefix, expected_version) in test_cases {
            let address: Address = address_str.to_string().try_into().expect("Failed to parse address");
            assert_eq!(address.prefix, expected_prefix);
            assert_eq!(address.version, expected_version);
            
            let address_clone = address.clone();
            let serialized: String = address_clone.into();
            assert_eq!(serialized, address_str);
        }
    }

    #[test]
    fn test_version_pubkey_ecdsa() {
        let pubkey_ecdsa = b"\xba\x01\xfc\x5f\x4e\x9d\x98\x79\x59\x9c\x69\xa3\xda\xfd\xb8\x35\xa7\x25\x5e\x5f\x2e\x93\x4e\x93\x22\xec\xd3\xaf\x19\x0a\xb0\xf6\x0e";
        assert_eq!(pubkey_ecdsa.len(), 33);
        
        let address = Address::new(Prefix::Mainnet, Version::PubKeyECDSA, pubkey_ecdsa);
        assert_eq!(address.version, Version::PubKeyECDSA);
        assert_eq!(address.payload.len(), 33);
        
        let address_str: String = address.into();
        assert!(address_str.starts_with("kaspa:"));
    }
}
