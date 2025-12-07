//! 二维码生成和解析模块（共享）
//! 
//! 用于冷钱包和热钱包之间的数据交换

use serde::{Deserialize, Serialize};
use qrcode::{QrCode, Color};
use image::{RgbImage, Rgb};
use base64::{Engine as _, engine::general_purpose};

/// 二维码数据类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum QRCodeType {
    /// 地址二维码
    Address,
    /// 签名后的交易
    SignedTransaction,
    /// 未签名的交易（热钱包 -> 冷钱包）
    UnsignedTransaction,
    /// 助记词（仅用于备份恢复）
    Mnemonic,
}

/// 基础二维码数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QRCodeBase {
    /// 类型
    #[serde(rename = "type")]
    pub qr_type: QRCodeType,
    /// 版本号
    pub version: String,
    /// 时间戳
    pub timestamp: u64,
    /// 链类型
    pub chain: String,
}

/// 地址二维码数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddressQRCode {
    #[serde(flatten)]
    pub base: QRCodeBase,
    /// 地址
    pub address: String,
    /// 地址标签（可选）
    pub label: Option<String>,
}

/// 签名交易二维码数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignedTransactionQRCode {
    #[serde(flatten)]
    pub base: QRCodeBase,
    /// 签名后的交易数据（JSON字符串）
    pub signed_tx: String,
    /// 原始交易哈希（用于验证）
    pub tx_hash: String,
}

/// 未签名交易二维码数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnsignedTransactionQRCode {
    #[serde(flatten)]
    pub base: QRCodeBase,
    /// 未签名的交易数据（JSON字符串）
    pub unsigned_tx: String,
    /// 交易说明
    pub description: Option<String>,
}

/// 生成二维码图片（Base64编码）
/// 
/// # Arguments
/// * `data` - 要编码的数据（JSON字符串）
/// * `size` - 二维码尺寸（像素）
/// 
/// # Returns
/// Base64编码的PNG图片数据
pub fn generate_qrcode(data: &str, size: u32) -> Result<String, String> {
    // 生成二维码
    let qr = QrCode::new(data.as_bytes())
        .map_err(|e| format!("Failed to generate QR code: {}", e))?;
    
    // 计算每个模块的像素大小
    let qr_size = qr.width();
    let module_size = size / (qr_size as u32 + 2); // 留出边距
    let image_size = module_size * (qr_size as u32 + 2);
    
    // 创建图像
    let mut img = RgbImage::new(image_size, image_size);
    
    // 填充白色背景
    for pixel in img.pixels_mut() {
        *pixel = Rgb([255, 255, 255]);
    }
    
    // 绘制二维码
    for y in 0..qr_size {
        for x in 0..qr_size {
            let is_dark = matches!(qr[(x, y)], Color::Dark);
            let color = if is_dark {
                Rgb([0, 0, 0]) // 黑色
            } else {
                Rgb([255, 255, 255]) // 白色
            };
            
            // 绘制模块
            let start_x = (x as u32 + 1) * module_size;
            let start_y = (y as u32 + 1) * module_size;
            
            for py in 0..module_size {
                for px in 0..module_size {
                    if start_x + px < image_size && start_y + py < image_size {
                        img.put_pixel(start_x + px, start_y + py, color);
                    }
                }
            }
        }
    }
    
    // 编码为 PNG
    let mut png_bytes = Vec::new();
    {
        let encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
        #[allow(deprecated)] // encode 方法已废弃，但 write_image 在当前版本不可用
        encoder
            .encode(
                img.as_raw(),
                img.width(),
                img.height(),
                image::ColorType::Rgb8,
            )
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    }
    
    Ok(general_purpose::STANDARD.encode(&png_bytes))
}

/// 解析二维码数据（从JSON字符串）
pub fn parse_qrcode_data(json_str: &str) -> Result<serde_json::Value, String> {
    serde_json::from_str(json_str)
        .map_err(|e| format!("Failed to parse QR code data: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_qrcode() {
        let data = r#"{"type":"address","version":"1.0.0","timestamp":1234567890,"chain":"eth","address":"0x1234567890123456789012345678901234567890"}"#;
        let result = generate_qrcode(data, 256);
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_qrcode_data() {
        let data = r#"{"type":"address","version":"1.0.0","timestamp":1234567890,"chain":"eth","address":"0x1234567890123456789012345678901234567890"}"#;
        let result = parse_qrcode_data(data);
        assert!(result.is_ok());
    }
}

