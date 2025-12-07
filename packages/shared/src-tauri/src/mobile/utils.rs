/**
 * @Author liyongjie
 * 移动端插件工具函数
 * 
 * 提供一些辅助函数和常量，方便应用使用
 */

use crate::mobile::{BiometricType, ScanConfig};

/// 默认的二维码扫描配置（原生全屏 UI）
pub fn default_scan_config() -> ScanConfig {
    ScanConfig {
        windowed: false,
        formats: vec!["QR_CODE".to_string()],
        camera_direction: Some("back".to_string()),
    }
}

/// 窗口模式的二维码扫描配置（透明窗口 + Web UI）
pub fn windowed_scan_config() -> ScanConfig {
    ScanConfig {
        windowed: true,
        formats: vec!["QR_CODE".to_string()],
        camera_direction: Some("back".to_string()),
    }
}

/// 将字符串转换为生物识别类型
pub fn parse_biometric_type(s: &str) -> BiometricType {
    match s.to_lowercase().as_str() {
        "fingerprint" | "touchid" => BiometricType::Fingerprint,
        "face" | "faceid" => BiometricType::Face,
        "iris" => BiometricType::Iris,
        _ => BiometricType::Unknown,
    }
}

/// 检查是否为移动端平台
#[cfg(any(target_os = "android", target_os = "ios"))]
pub fn is_mobile_platform() -> bool {
    true
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub fn is_mobile_platform() -> bool {
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_scan_config() {
        let config = default_scan_config();
        assert_eq!(config.windowed, false);
        assert_eq!(config.formats, vec!["QR_CODE".to_string()]);
    }

    #[test]
    fn test_windowed_scan_config() {
        let config = windowed_scan_config();
        assert_eq!(config.windowed, true);
    }

    #[test]
    fn test_parse_biometric_type() {
        assert_eq!(parse_biometric_type("fingerprint"), BiometricType::Fingerprint);
        assert_eq!(parse_biometric_type("TouchID"), BiometricType::Fingerprint);
        assert_eq!(parse_biometric_type("face"), BiometricType::Face);
        assert_eq!(parse_biometric_type("FaceID"), BiometricType::Face);
        assert_eq!(parse_biometric_type("unknown"), BiometricType::Unknown);
    }
}

