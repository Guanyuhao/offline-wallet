use bip39::{Language, Mnemonic};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct MnemonicInfo {
    pub mnemonic: String,
    pub word_count: usize,
}

/// 生成 BIP39 助记词
/// word_count: 12, 15, 18, 21, 或 24
pub fn generate_mnemonic(word_count: usize) -> Result<String, String> {
    let entropy_bits = match word_count {
        12 => 128,
        15 => 160,
        18 => 192,
        21 => 224,
        24 => 256,
        _ => return Err("Invalid word count. Must be 12, 15, 18, 21, or 24".to_string()),
    };

    // 生成随机熵
    let mut entropy = vec![0u8; entropy_bits / 8];
    use rand::RngCore;
    rand::thread_rng().fill_bytes(&mut entropy);

    // 从熵生成助记词 (bip39 2.0 API)
    let mnemonic = Mnemonic::from_entropy(&entropy)
        .map_err(|e| format!("Failed to generate mnemonic: {:?}", e))?;

    // 清除熵
    entropy.zeroize();

    Ok(mnemonic.to_string())
}

/// 验证助记词是否有效
pub fn validate_mnemonic(mnemonic: &str) -> Result<bool, String> {
    match Mnemonic::parse_in_normalized(Language::English, mnemonic) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Invalid mnemonic: {:?}", e)),
    }
}

/// 获取助记词信息（词数等）
#[allow(dead_code)]
pub fn get_mnemonic_info(mnemonic: &str) -> Result<MnemonicInfo, String> {
    let m = Mnemonic::parse_in_normalized(Language::English, mnemonic)
        .map_err(|e| format!("Invalid mnemonic: {:?}", e))?;

    Ok(MnemonicInfo {
        mnemonic: m.to_string(),
        word_count: m.word_count(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_mnemonic() {
        let mnemonic = generate_mnemonic(12).unwrap();
        let words: Vec<&str> = mnemonic.split_whitespace().collect();
        assert_eq!(words.len(), 12);

        // 验证生成的助记词
        assert!(validate_mnemonic(&mnemonic).is_ok());
    }

    #[test]
    fn test_validate_mnemonic() {
        // 有效的测试助记词
        let valid = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        assert!(validate_mnemonic(valid).is_ok());

        // 无效的助记词
        let invalid = "invalid mnemonic phrase";
        assert!(validate_mnemonic(invalid).is_err());
    }
}

