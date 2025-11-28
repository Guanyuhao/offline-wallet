use qrcode::QrCode;
use base64::{Engine as _, engine::general_purpose};

/// 生成二维码并返回 Base64 编码的 PNG 图片
pub fn generate_qrcode_base64(data: &str) -> Result<String, String> {
    // 生成二维码
    let code = QrCode::new(data)
        .map_err(|e| format!("Failed to generate QR code: {}", e))?;

    // 获取二维码的宽度
    let width = code.width();
    let scale = 8; // 每个模块放大8倍
    let img_width = (width * scale) as u32;
    let img_height = (width * scale) as u32;
    
    // 手动构建图像数据
    let mut img_data = Vec::new();
    for y in 0..width {
        for _ in 0..scale {  // 每行重复scale次
            for x in 0..width {
                let color = if code[(x, y)] == qrcode::Color::Dark {
                    0u8  // 黑色
                } else {
                    255u8  // 白色
                };
                for _ in 0..scale {  // 每个像素重复scale次
                    img_data.push(color);
                }
            }
        }
    }

    // 使用 image crate 保存为 PNG
    let img = image::GrayImage::from_raw(img_width, img_height, img_data)
        .ok_or_else(|| "Failed to create image".to_string())?;
    
    let mut png_bytes = Vec::new();
    {
        use image::ImageFormat;
        let mut cursor = std::io::Cursor::new(&mut png_bytes);
        img.write_to(&mut cursor, ImageFormat::Png)
            .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    }

    // Base64 编码
    let base64_str = general_purpose::STANDARD.encode(&png_bytes);
    
    // 返回 data URL 格式
    Ok(format!("data:image/png;base64,{}", base64_str))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_qrcode() {
        let result = generate_qrcode_base64("test data");
        assert!(result.is_ok());
        let base64 = result.unwrap();
        assert!(base64.starts_with("data:image/png;base64,"));
    }
}

