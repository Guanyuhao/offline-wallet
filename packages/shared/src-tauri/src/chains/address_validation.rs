use bitcoin::Address as BtcAddress;
use std::str::FromStr;

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

/// 通用地址验证（根据链类型）
pub fn validate_address(chain: &str, address: &str) -> bool {
    match chain.to_lowercase().as_str() {
        "eth" | "bnb" => validate_eth_address(address),
        "btc" => validate_btc_address(address),
        "sol" => validate_sol_address(address),
        "tron" => validate_tron_address(address),
        "kaspa" => validate_kaspa_address(address),
        _ => false,
    }
}

/// 验证 Kaspa 地址格式
pub fn validate_kaspa_address(address: &str) -> bool {
    // Kaspa 地址以 kaspa: 开头
    address.starts_with("kaspa:") && address.len() > 10
}

/// 根据地址格式自动检测链类型
/// 返回可能匹配的链列表（按优先级排序）
pub fn detect_chain_from_address(address: &str) -> Vec<String> {
    let mut chains = Vec::new();
    
    // ETH/BNB: 0x 开头，42 字符
    if validate_eth_address(address) {
        chains.push("eth".to_string());
        chains.push("bnb".to_string());
    }
    
    // BTC: 1, 3, bc1 开头
    if validate_btc_address(address) {
        chains.push("btc".to_string());
    }
    
    // SOL: Base58 编码，32-44 字符
    if validate_sol_address(address) && !address.starts_with('T') {
        chains.push("sol".to_string());
    }
    
    // TRON: T 开头，34 字符
    if validate_tron_address(address) {
        chains.push("tron".to_string());
    }
    
    // Kaspa: kaspa: 开头
    if validate_kaspa_address(address) {
        chains.push("kaspa".to_string());
    }
    
    chains
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

