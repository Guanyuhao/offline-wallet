//! 二维码生成模块（冷钱包）
//! 
//! 用于生成地址、签名交易等二维码

use qrcode::{QrCode, Color};
use image::{RgbImage, Rgb};
use base64::{Engine as _, engine::general_purpose};

/// 生成二维码图片（Base64编码）
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

