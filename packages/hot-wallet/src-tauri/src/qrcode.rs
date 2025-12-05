//! 二维码解析模块（热钱包）
//! 
//! 用于解析扫描到的二维码数据

use serde_json::Value;

/// 解析二维码数据（从JSON字符串）
pub fn parse_qrcode_data(json_str: &str) -> Result<Value, String> {
    serde_json::from_str(json_str)
        .map_err(|e| format!("Failed to parse QR code data: {}", e))
}

