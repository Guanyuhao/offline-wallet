use qrcode::QrCode;
use base64::{Engine as _, engine::general_purpose};
use std::path::PathBuf;
use image::{RgbImage, Rgb, ImageFormat, imageops::FilterType, GenericImageView};

/// 从 src-tauri/icons 目录查找 logo 文件
fn find_logo_file() -> Option<PathBuf> {
    // 尝试的路径列表（按优先级排序）
    let possible_paths = vec![
        // 从 src-tauri/icons 目录（开发环境）
        PathBuf::from("icons").join("icon.png"),
        PathBuf::from("icons").join("128x128.png"),
        PathBuf::from("src-tauri").join("icons").join("icon.png"),
        PathBuf::from("src-tauri").join("icons").join("128x128.png"),
        // 从当前工作目录的 icons（构建后）
        PathBuf::from("icons").join("icon.png"),
        PathBuf::from("icons").join("128x128.png"),
    ];
    
    for path in possible_paths {
        if path.exists() && path.is_file() {
            return Some(path);
        }
    }
    
    None
}

/// 生成二维码并返回 Base64 编码的 PNG 图片
pub fn generate_qrcode_base64(data: &str) -> Result<String, String> {
    generate_qrcode_with_logo(data, None)
}

/// 生成带 logo 的二维码并返回 Base64 编码的 PNG 图片
/// logo 会自动从 src-tauri/icons 目录加载
pub fn generate_qrcode_with_logo(data: &str, _logo_path: Option<&str>) -> Result<String, String> {
    // 生成二维码
    let code = QrCode::new(data)
        .map_err(|e| format!("Failed to generate QR code: {}", e))?;

    // 获取二维码的宽度
    let width = code.width();
    let scale = 10; // 每个模块放大10倍，提高分辨率减少失真
    let img_width = (width * scale) as u32;
    let img_height = (width * scale) as u32;
    
    // 创建 RGB 图像（用于支持彩色 logo）
    let mut img = RgbImage::new(img_width, img_height);
    
    // 绘制二维码
    for y in 0..width {
        for sy in 0..scale {
            for x in 0..width {
                let color = if code[(x, y)] == qrcode::Color::Dark {
                    Rgb([0u8, 0u8, 0u8])  // 黑色
                } else {
                    Rgb([255u8, 255u8, 255u8])  // 白色
                };
                for sx in 0..scale {
                    let px = (x * scale + sx) as u32;
                    let py = (y * scale + sy) as u32;
                    img.put_pixel(px, py, color);
                }
            }
        }
    }

    // 始终尝试在中间添加 logo（从 src-tauri/icons 目录）
    if let Some(logo_file_path) = find_logo_file() {
        if let Ok(logo_img) = image::open(&logo_file_path) {
            // logo 大小为二维码的 1/4.5，确保大小合适且居中
            let logo_size = ((img_width as f32 / 4.5) as u32).min((img_height as f32 / 4.5) as u32);
            // 确保 logo 大小是偶数，避免对齐问题
            let logo_size = (logo_size / 2) * 2;
            let logo_x = (img_width - logo_size) / 2;
            let logo_y = (img_height - logo_size) / 2;
            
            // 使用 CatmullRom 算法，对小图标缩放效果更好
            let resized_logo = logo_img.resize_exact(logo_size, logo_size, FilterType::CatmullRom);
            
            // 在二维码中间绘制 logo，保留白色边框
            // 边框大小约为 logo 的 1/6，更美观
            let border = ((logo_size as f32 / 6.0) as u32).max(6); // 至少 6 像素的边框
            
            // 先绘制白色边框区域
            for y in 0..logo_size {
                for x in 0..logo_size {
                    let px = logo_x + x;
                    let py = logo_y + y;
                    
                    // 边框区域保持白色
                    if x < border || x >= logo_size - border || 
                       y < border || y >= logo_size - border {
                        img.put_pixel(px, py, Rgb([255u8, 255u8, 255u8]));
                    }
                }
            }
            
            // 绘制 logo 内容区域，使用 alpha 混合
            for y in border..(logo_size - border) {
                for x in border..(logo_size - border) {
                    let px = logo_x + x;
                    let py = logo_y + y;
                    
                    let pixel = resized_logo.get_pixel(x, y);
                    let rgba = pixel.0;
                    let r = rgba[0];
                    let g = rgba[1];
                    let b = rgba[2];
                    let a = rgba[3];
                    
                    // 使用 alpha 混合，而不是简单的阈值判断
                    if a > 0 {
                        // Alpha 混合：logo_color * alpha + background_color * (1 - alpha)
                        let alpha_f = a as f32 / 255.0;
                        let r_final = ((r as f32 * alpha_f) + (255.0 * (1.0 - alpha_f))) as u8;
                        let g_final = ((g as f32 * alpha_f) + (255.0 * (1.0 - alpha_f))) as u8;
                        let b_final = ((b as f32 * alpha_f) + (255.0 * (1.0 - alpha_f))) as u8;
                        img.put_pixel(px, py, Rgb([r_final, g_final, b_final]));
                    } else {
                        // 完全透明，使用白色背景
                        img.put_pixel(px, py, Rgb([255u8, 255u8, 255u8]));
                    }
                }
            }
        }
    }
    
    let mut png_bytes = Vec::new();
    {
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

