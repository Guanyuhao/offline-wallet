use bip39::{Language, Mnemonic};
use ethers::signers::{LocalWallet, Signer};
use ethers::types::{Address, TransactionRequest, U256};
use ethers::utils::keccak256;
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use tiny_hderive::bip32::ExtendedPrivKey;

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct BnbAddress {
    pub address: String,
    pub derivation_path: String,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BnbTransaction {
    pub to: String,
    pub value: String,
    pub gas_price: String,
    pub gas_limit: String,
    pub nonce: String,
    pub data: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct SignedBnbTransaction {
    pub raw_transaction: String,
    pub transaction_hash: String,
}

/// 从助记词派生 BNB (BSC) 地址
/// BNB 使用与以太坊相同的 BIP44 路径，但 coin_type 是 60
#[allow(dead_code)]
pub fn derive_bnb_address(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
) -> Result<BnbAddress, String> {
    // BNB/BSC 使用与 ETH 相同的路径 m/44'/60'/0'/0/{index}
    let path = format!("m/44'/60'/0'/0/{}", index);

    let mnemonic_obj = Mnemonic::parse_in_normalized(Language::English, mnemonic)
        .map_err(|e| format!("Invalid mnemonic: {:?}", e))?;

    let seed = mnemonic_obj.to_seed(passphrase.unwrap_or(""));
    let ext_key = ExtendedPrivKey::derive(&seed, path.as_str())
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;

    let wallet = LocalWallet::from_bytes(&ext_key.secret())
        .map_err(|e| format!("Failed to create wallet: {}", e))?;

    Ok(BnbAddress {
        address: format!("{:?}", wallet.address()),
        derivation_path: path,
    })
}

/// 签名 BNB 交易（与以太坊相同）
#[allow(dead_code)]
pub fn sign_bnb_transaction(
    mnemonic: &str,
    passphrase: Option<&str>,
    index: u32,
    tx: BnbTransaction,
) -> Result<SignedBnbTransaction, String> {
    let path = format!("m/44'/60'/0'/0/{}", index);

    let mnemonic_obj = Mnemonic::parse_in_normalized(Language::English, mnemonic)
        .map_err(|e| format!("Invalid mnemonic: {:?}", e))?;

    let seed = mnemonic_obj.to_seed(passphrase.unwrap_or(""));
    let ext_key = ExtendedPrivKey::derive(&seed, path.as_str())
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;

    let wallet = LocalWallet::from_bytes(&ext_key.secret())
        .map_err(|e| format!("Failed to create wallet: {}", e))?;

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

    let transaction_for_rlp = transaction.clone();
    let signature = wallet
        .sign_transaction_sync(&transaction.into())
        .map_err(|e| format!("Failed to sign transaction: {}", e))?;

    let rlp = transaction_for_rlp.rlp_signed(&signature);
    let raw_transaction = format!("0x{}", hex::encode(&rlp));
    let tx_hash = keccak256(&rlp);
    let transaction_hash = format!("0x{}", hex::encode(tx_hash));

    Ok(SignedBnbTransaction {
        raw_transaction,
        transaction_hash,
    })
}

