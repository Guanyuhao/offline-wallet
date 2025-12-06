use bitcoin::Address as BtcAddress;
use std::str::FromStr;
use serde::{Deserialize, Serialize};

/// 验证以太坊地址格式
pub fn validate_eth_address(address: &str) -> bool {
    address.starts_with("0x") && address.len() == 42 && address[2..].chars().all(|c| c.is_ascii_hexdigit())
}

/// 验证 Bitcoin 地址格式
pub fn validate_btc_address(address: &str) -> bool {
    // 支持 Legacy (1开头), SegWit (3开头), Native SegWit (bc1开头)
    BtcAddress::from_str(address).is_ok()
}

/// 验证 Solana 地址格式
pub fn validate_sol_address(address: &str) -> bool {
    // Solana 地址是 Base58 编码，长度 32-44 字符
    if address.len() < 32 || address.len() > 44 {
        return false;
    }
    
    // 检查是否为有效的 Base58
    address.chars().all(|c| {
        matches!(c, 
            '1'..='9' | 'A'..='H' | 'J'..='N' | 'P'..='Z' | 
            'a'..='k' | 'm'..='z'
        )
    })
}

/// 验证 Tron 地址格式
pub fn validate_tron_address(address: &str) -> bool {
    // Tron 地址以 T 开头，34 字符，Base58 编码
    if !address.starts_with('T') || address.len() != 34 {
        return false;
    }
    
    // 检查是否为有效的 Base58
    address[1..].chars().all(|c| {
        matches!(c, 
            '1'..='9' | 'A'..='H' | 'J'..='N' | 'P'..='Z' | 
            'a'..='k' | 'm'..='z'
        )
    })
}

/// 验证 Kaspa 地址格式
/// 使用 kaspa_addresses crate 来验证地址的有效性
pub fn validate_kaspa_address(address: &str) -> bool {
    // Kaspa 地址使用 Bech32 编码，格式: kaspa:xxxxx 或 kaspatest:xxxxx
    if !address.starts_with("kaspa:") && !address.starts_with("kaspatest:") {
        return false;
    }
    
    // 使用 kaspa_addresses crate 解析地址（使用 TryInto trait）
    match <String as TryInto<kaspa_addresses::Address>>::try_into(address.to_string()) {
        Ok(_) => true,
        Err(_) => false,
    }
}

/// 地址验证结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddressValidationResult {
    pub is_valid: bool,
    pub error_message: Option<String>,
}

/// 通用地址验证（根据链类型），返回详细错误信息
pub fn validate_address_with_message(chain: &str, address: &str) -> AddressValidationResult {
    let trimmed_address = address.trim();
    
    // 基本检查：空地址
    if trimmed_address.is_empty() {
        return AddressValidationResult {
            is_valid: false,
            error_message: Some("地址不能为空".to_string()),
        };
    }
    
    match chain {
        "ETH" | "BNB" => {
            if !trimmed_address.starts_with("0x") {
                return AddressValidationResult {
                    is_valid: false,
                    error_message: Some("以太坊地址必须以 0x 开头".to_string()),
                };
            }
            if trimmed_address.len() != 42 {
                return AddressValidationResult {
                    is_valid: false,
                    error_message: Some(format!("以太坊地址长度应为 42 字符，当前为 {} 字符", trimmed_address.len())),
                };
            }
            if !trimmed_address[2..].chars().all(|c| c.is_ascii_hexdigit()) {
                return AddressValidationResult {
                    is_valid: false,
                    error_message: Some("以太坊地址包含无效字符，只能包含 0-9 和 a-f（或 A-F）".to_string()),
                };
            }
            AddressValidationResult {
                is_valid: true,
                error_message: None,
            }
        }
        "BTC" => {
            match BtcAddress::from_str(trimmed_address) {
                Ok(_) => AddressValidationResult {
                    is_valid: true,
                    error_message: None,
                },
                Err(e) => AddressValidationResult {
                    is_valid: false,
                    error_message: Some(format!("Bitcoin 地址格式无效: {}", e)),
                },
            }
        }
        "SOL" => {
            if trimmed_address.len() < 32 || trimmed_address.len() > 44 {
                return AddressValidationResult {
                    is_valid: false,
                    error_message: Some(format!("Solana 地址长度应在 32-44 字符之间，当前为 {} 字符", trimmed_address.len())),
                };
            }
            if !trimmed_address.chars().all(|c| {
                matches!(c, 
                    '1'..='9' | 'A'..='H' | 'J'..='N' | 'P'..='Z' | 
                    'a'..='k' | 'm'..='z'
                )
            }) {
                return AddressValidationResult {
                    is_valid: false,
                    error_message: Some("Solana 地址包含无效字符，必须是有效的 Base58 编码".to_string()),
                };
            }
            AddressValidationResult {
                is_valid: true,
                error_message: None,
            }
        }
        "TRON" => {
            if !trimmed_address.starts_with('T') {
                return AddressValidationResult {
                    is_valid: false,
                    error_message: Some("Tron 地址必须以 T 开头".to_string()),
                };
            }
            if trimmed_address.len() != 34 {
                return AddressValidationResult {
                    is_valid: false,
                    error_message: Some(format!("Tron 地址长度应为 34 字符，当前为 {} 字符", trimmed_address.len())),
                };
            }
            if !trimmed_address[1..].chars().all(|c| {
                matches!(c, 
                    '1'..='9' | 'A'..='H' | 'J'..='N' | 'P'..='Z' | 
                    'a'..='k' | 'm'..='z'
                )
            }) {
                return AddressValidationResult {
                    is_valid: false,
                    error_message: Some("Tron 地址包含无效字符，必须是有效的 Base58 编码".to_string()),
                };
            }
            AddressValidationResult {
                is_valid: true,
                error_message: None,
            }
        }
        "KASPA" | "KAS" => {
            if !trimmed_address.starts_with("kaspa:") && !trimmed_address.starts_with("kaspatest:") {
                return AddressValidationResult {
                    is_valid: false,
                    error_message: Some("Kaspa 地址必须以 kaspa: 或 kaspatest: 开头".to_string()),
                };
            }
            
            // 使用 kaspa_addresses crate 解析地址（使用 TryInto trait）
            match <String as TryInto<kaspa_addresses::Address>>::try_into(trimmed_address.to_string()) {
                Ok(_) => AddressValidationResult {
                    is_valid: true,
                    error_message: None,
                },
                Err(e) => AddressValidationResult {
                    is_valid: false,
                    error_message: Some(format!("Kaspa 地址格式无效: {}", e)),
                },
            }
        }
        _ => AddressValidationResult {
            is_valid: false,
            error_message: Some(format!("不支持的链类型: {}", chain)),
        },
    }
}

/// 通用地址验证（根据链类型）- 保持向后兼容
pub fn validate_address(chain: &str, address: &str) -> bool {
    validate_address_with_message(chain, address).is_valid
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_eth_address() {
        assert!(validate_eth_address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"));
        assert!(!validate_eth_address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbG")); // 无效字符
        assert!(!validate_eth_address("742d35Cc6634C0532925a3b844Bc9e7595f0bEb")); // 缺少 0x
    }

    #[test]
    fn test_validate_btc_address() {
        // Native SegWit
        assert!(validate_btc_address("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"));
        // Legacy
        assert!(validate_btc_address("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"));
    }

    #[test]
    fn test_validate_sol_address() {
        assert!(validate_sol_address("11111111111111111111111111111111"));
        assert!(validate_sol_address("So11111111111111111111111111111111111111112"));
    }

    #[test]
    fn test_validate_tron_address() {
        assert!(validate_tron_address("TQn9Y2khEsLMWD7j5qZz5qZz5qZz5qZz5qZz"));
        assert!(!validate_tron_address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")); // 以太坊地址
    }
}

