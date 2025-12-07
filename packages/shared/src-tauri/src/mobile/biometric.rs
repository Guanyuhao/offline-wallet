/**
 * @Author liyongjie
 * 生物识别插件工具函数
 * 
 * 提供统一的生物识别（指纹/面容ID）接口
 * 
 * 注意：插件必须在应用的 main.rs 中注册：
 * ```rust
 * #[cfg(any(target_os = "android", target_os = "ios"))]
 * let builder = builder.plugin(tauri_plugin_biometric::init());
 * ```
 */

use serde::{Deserialize, Serialize};

/// 生物识别类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BiometricType {
    /// 指纹识别
    Fingerprint,
    /// 面容识别（Face ID）
    Face,
    /// 虹膜识别
    Iris,
    /// 未知类型
    Unknown,
}

/// 生物识别状态
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BiometricStatus {
    /// 可用
    Available,
    /// 不可用
    Unavailable,
    /// 未设置
    NotSet,
    /// 不支持
    NotSupported,
}

/// 生物识别结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BiometricResult {
    /// 是否成功
    pub success: bool,
    /// 错误消息（如果失败）
    pub error: Option<String>,
}

// 注意：实际的函数实现在 commands.rs 中
// 这里只定义类型和数据结构

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_biometric_type() {
        assert_eq!(BiometricType::Fingerprint, BiometricType::Fingerprint);
        assert_ne!(BiometricType::Fingerprint, BiometricType::Face);
    }

    #[test]
    fn test_biometric_status() {
        assert_eq!(BiometricStatus::Available, BiometricStatus::Available);
        assert_ne!(BiometricStatus::Available, BiometricStatus::Unavailable);
    }
}

