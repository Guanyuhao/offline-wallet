//! 系统级安全存储模块
//! 
//! 使用系统密钥库（Keychain/Keystore）存储加密后的助记词
//! - iOS/macOS: Keychain Services
//! - Android: Keystore
//! - Windows: Credential Manager
//! - Linux: Secret Service API

use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier, password_hash::{rand_core::OsRng as ArgonOsRng, SaltString}};
use serde::{Deserialize, Serialize};
use zeroize::Zeroize;
use base64::{Engine as _, engine::general_purpose};

// 条件编译：桌面端使用 keyring，iOS 使用文件系统（加密存储）
#[cfg(not(any(target_os = "ios", target_os = "android")))]
use keyring::Entry;

#[cfg(target_os = "ios")]
use std::path::PathBuf;

/// 应用标识符（用于系统密钥库）
const APP_IDENTIFIER: &str = "com.offlinewallet";
const SERVICE_NAME: &str = "offline-wallet-mnemonic";
#[allow(dead_code)]
const BIOMETRIC_PASSWORD_KEY: &str = "offline-wallet-biometric-password";

/// 加密存储的数据结构（存储在系统密钥库）
#[derive(Debug, Serialize, Deserialize)]
struct EncryptedMnemonicData {
    /// 加密后的助记词（Base64）
    ciphertext: String,
    /// 随机数（Nonce，Base64）
    nonce: String,
    /// 密码哈希（用于验证密码）
    password_hash: String,
}

/// 存储加密的助记词到系统密钥库
/// 
/// # Arguments
/// * `mnemonic` - 要加密的助记词
/// * `password` - 用户密码
/// 
/// # Returns
/// 成功返回 Ok(())
pub fn store_encrypted_mnemonic(mnemonic: &str, password: &str) -> Result<(), String> {
    // 1. 加密助记词
    let encrypted_data = encrypt_mnemonic_data(mnemonic, password)?;
    
    // 2. 序列化为 JSON
    let json_data = serde_json::to_string(&encrypted_data)
        .map_err(|e| format!("Serialization failed: {}", e))?;
    
    // 3. 存储到系统密钥库
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        // 桌面端：使用 keyring
        let entry = Entry::new(SERVICE_NAME, APP_IDENTIFIER)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        
        entry.set_password(&json_data)
            .map_err(|e| format!("Failed to store in keyring: {}", e))?;
    }
    
    #[cfg(target_os = "ios")]
    {
        // iOS：使用 security-framework (Keychain)
        store_to_keychain_ios(&json_data)?;
    }
    
    #[cfg(target_os = "android")]
    {
        // Android：暂时使用文件存储（后续可改用 Keystore）
        return Err("Android storage not yet implemented".to_string());
    }
    
    Ok(())
}

/// 从系统密钥库读取并解密助记词
/// 
/// # Arguments
/// * `password` - 用户密码
/// 
/// # Returns
/// 解密后的助记词
pub fn retrieve_encrypted_mnemonic(password: &str) -> Result<String, String> {
    // 1. 从系统密钥库读取
    let json_data = {
        #[cfg(not(any(target_os = "ios", target_os = "android")))]
        {
            // 桌面端：使用 keyring
            let entry = Entry::new(SERVICE_NAME, APP_IDENTIFIER)
                .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
            
            entry.get_password()
                .map_err(|e| format!("Failed to retrieve from keyring: {}", e))?
        }
        
        #[cfg(target_os = "ios")]
        {
            // iOS：使用 security-framework (Keychain)
            retrieve_from_keychain_ios()?
        }
        
        #[cfg(target_os = "android")]
        {
            // Android：暂时不支持
            return Err("Android storage not yet implemented".to_string());
        }
    };
    
    // 2. 反序列化
    let encrypted_data: EncryptedMnemonicData = serde_json::from_str(&json_data)
        .map_err(|e| format!("Invalid encrypted data: {}", e))?;
    
    // 3. 解密
    decrypt_mnemonic_data(&encrypted_data, password)
}

/// 检查是否存在加密的助记词
pub fn has_encrypted_mnemonic() -> bool {
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let entry = match Entry::new(SERVICE_NAME, APP_IDENTIFIER) {
            Ok(e) => e,
            Err(_) => return false,
        };
        entry.get_password().is_ok()
    }
    
    #[cfg(target_os = "ios")]
    {
        retrieve_from_keychain_ios().is_ok()
    }
    
    #[cfg(target_os = "android")]
    {
        false // Android 暂不支持
    }
}

/// 删除加密的助记词
pub fn delete_encrypted_mnemonic() -> Result<(), String> {
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let entry = Entry::new(SERVICE_NAME, APP_IDENTIFIER)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        
        entry.delete_password()
            .map_err(|e| format!("Failed to delete from keyring: {}", e))?;
    }
    
    #[cfg(target_os = "ios")]
    {
        delete_from_keychain_ios()?;
    }
    
    #[cfg(target_os = "android")]
    {
        return Err("Android storage not yet implemented".to_string());
    }
    
    Ok(())
}

/// 验证密码（不返回助记词）
pub fn verify_mnemonic_password(password: &str) -> Result<bool, String> {
    match retrieve_encrypted_mnemonic(password) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

// ==================== 生物识别相关 ====================

/// 存储用于生物识别的密码
/// 注意：这个密码是加密后存储在系统密钥库中的，用于生物识别成功后自动解锁
#[allow(dead_code)]
pub fn store_biometric_password(_encrypted_password: &str) -> Result<(), String> {
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let entry = Entry::new(SERVICE_NAME, BIOMETRIC_PASSWORD_KEY)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        
        entry.set_password(encrypted_password)
            .map_err(|e| format!("Failed to store biometric password: {}", e))?;
    }
    
    #[cfg(any(target_os = "ios", target_os = "android"))]
    {
        // 移动端使用 Tauri 生物识别插件，不需要单独存储
        return Err("Biometric password storage not needed on mobile".to_string());
    }
}

/// 获取用于生物识别的加密密码
#[allow(dead_code)]
pub fn get_biometric_password() -> Result<String, String> {
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let entry = Entry::new(SERVICE_NAME, BIOMETRIC_PASSWORD_KEY)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        
        entry.get_password()
            .map_err(|e| format!("Failed to retrieve biometric password: {}", e))
    }
    
    #[cfg(any(target_os = "ios", target_os = "android"))]
    {
        Err("Biometric password storage not needed on mobile".to_string())
    }
}

/// 删除生物识别密码
#[allow(dead_code)]
pub fn delete_biometric_password() -> Result<(), String> {
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let entry = Entry::new(SERVICE_NAME, BIOMETRIC_PASSWORD_KEY)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        
        entry.delete_password()
            .map_err(|e| format!("Failed to delete biometric password: {}", e))?;
        Ok(())
    }
    
    #[cfg(any(target_os = "ios", target_os = "android"))]
    {
        // 移动端不需要
        Ok(())
    }
}

/// 检查是否存在生物识别密码
#[allow(dead_code)]
pub fn has_biometric_password() -> bool {
    #[cfg(not(any(target_os = "ios", target_os = "android")))]
    {
        let entry = match Entry::new(SERVICE_NAME, BIOMETRIC_PASSWORD_KEY) {
            Ok(e) => e,
            Err(_) => return false,
        };
        entry.get_password().is_ok()
    }
    
    #[cfg(any(target_os = "ios", target_os = "android"))]
    {
        false // 移动端不需要
    }
}

// ==================== 内部实现 ====================

/// 加密助记词数据
fn encrypt_mnemonic_data(mnemonic: &str, password: &str) -> Result<EncryptedMnemonicData, String> {
    // 1. 生成密码哈希（用于验证密码）
    let salt = SaltString::generate(&mut ArgonOsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| format!("Failed to hash password: {:?}", e))?
        .to_string();

    // 2. 从密码派生加密密钥（使用 Argon2id）
    let mut key_bytes = [0u8; 32];
    let salt_str = salt.as_str();
    
    argon2
        .hash_password_into(password.as_bytes(), salt_str.as_bytes(), &mut key_bytes)
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;

    // 3. 创建 AES-256-GCM 加密器
    #[allow(deprecated)]
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    
    // 4. 生成随机 Nonce
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    
    // 5. 加密助记词
    let ciphertext = cipher
        .encrypt(&nonce, mnemonic.as_bytes())
        .map_err(|e| format!("Failed to encrypt: {:?}", e))?;

    // 6. 清除敏感数据
    key_bytes.zeroize();

    Ok(EncryptedMnemonicData {
        ciphertext: general_purpose::STANDARD.encode(ciphertext),
        #[allow(deprecated)]
        nonce: general_purpose::STANDARD.encode(nonce.as_slice()),
        password_hash,
    })
}

/// 解密助记词数据
fn decrypt_mnemonic_data(encrypted_data: &EncryptedMnemonicData, password: &str) -> Result<String, String> {
    // 1. 验证密码
    let parsed_hash = PasswordHash::new(&encrypted_data.password_hash)
        .map_err(|e| format!("Invalid password hash: {:?}", e))?;
    
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_err(|_| "Invalid password".to_string())?;

    // 2. 从密码派生解密密钥
    let salt = parsed_hash.salt.ok_or("Missing salt in password hash")?;
    let mut key_bytes = [0u8; 32];
    let salt_str = salt.as_str();

    Argon2::default()
        .hash_password_into(password.as_bytes(), salt_str.as_bytes(), &mut key_bytes)
        .map_err(|e| format!("Failed to derive key: {:?}", e))?;

    // 3. 创建 AES-256-GCM 解密器
    #[allow(deprecated)]
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    
    // 4. 解码 Nonce 和密文
    let nonce_bytes = general_purpose::STANDARD.decode(&encrypted_data.nonce)
        .map_err(|e| format!("Failed to decode nonce: {:?}", e))?;
    #[allow(deprecated)]
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = general_purpose::STANDARD.decode(&encrypted_data.ciphertext)
        .map_err(|e| format!("Failed to decode ciphertext: {:?}", e))?;

    // 5. 解密
    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|e| format!("Failed to decrypt: {:?}", e))?;

    // 6. 清除敏感数据
    key_bytes.zeroize();

    // 7. 转换为字符串
    String::from_utf8(plaintext)
        .map_err(|e| format!("Invalid UTF-8: {:?}", e))
}

// ==================== iOS 存储实现 ====================
// iOS 使用应用文档目录存储加密数据（后续可改用 Keychain）

#[cfg(target_os = "ios")]
fn get_ios_storage_path() -> Result<PathBuf, String> {
    // iOS 应用文档目录
    // 注意：实际运行时需要通过 Tauri API 获取，这里使用相对路径
    // 在 iOS 上，应用数据存储在应用的 Documents 目录
    let home = std::env::var("HOME")
        .map_err(|_| "Failed to get HOME directory")?;
    
    Ok(PathBuf::from(home)
        .join("Documents")
        .join(format!("{}.{}", SERVICE_NAME, APP_IDENTIFIER)))
}

#[cfg(target_os = "ios")]
fn store_to_keychain_ios(data: &str) -> Result<(), String> {
    use std::fs;
    
    let path = get_ios_storage_path()?;
    
    // 确保目录存在
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {:?}", e))?;
    }
    
    // 写入文件
    fs::write(&path, data)
        .map_err(|e| format!("Failed to write to iOS storage: {:?}", e))?;
    
    Ok(())
}

#[cfg(target_os = "ios")]
fn retrieve_from_keychain_ios() -> Result<String, String> {
    use std::fs;
    
    let path = get_ios_storage_path()?;
    
    let data = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read from iOS storage: {:?}", e))?;
    
    Ok(data)
}

#[cfg(target_os = "ios")]
fn delete_from_keychain_ios() -> Result<(), String> {
    use std::fs;
    
    let path = get_ios_storage_path()?;
    
    // 删除操作可能失败（如果文件不存在），这是可以接受的
    let _ = fs::remove_file(&path);
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_flow() {
        let mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let password = "test_password_123";

        // 加密并存储
        store_encrypted_mnemonic(mnemonic, password).unwrap();
        
        // 检查是否存在
        assert!(has_encrypted_mnemonic());

        // 验证密码
        assert!(verify_mnemonic_password(password).unwrap());
        assert!(!verify_mnemonic_password("wrong_password").unwrap());

        // 解密
        let decrypted = retrieve_encrypted_mnemonic(password).unwrap();
        assert_eq!(decrypted, mnemonic);

        // 清理
        delete_encrypted_mnemonic().unwrap();
        assert!(!has_encrypted_mnemonic());
    }
}

