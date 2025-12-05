//! 密码强度检测模块
//! 
//! 使用 zxcvbn 算法评估密码强度

// 使用简化的密码强度检测，不依赖 zxcvbn 的复杂 API

/// 密码强度等级
#[allow(dead_code)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PasswordStrength {
    /// 非常弱（0-1分）
    VeryWeak,
    /// 弱（2分）
    Weak,
    /// 中等（3分）
    Medium,
    /// 强（4分）
    Strong,
    /// 非常强（5分）
    VeryStrong,
}

impl PasswordStrength {
    /// 从分数转换为强度等级
    #[allow(dead_code)]
    pub fn from_score(score: u8) -> Self {
        match score {
            0..=1 => PasswordStrength::VeryWeak,
            2 => PasswordStrength::Weak,
            3 => PasswordStrength::Medium,
            4 => PasswordStrength::Strong,
            5..=u8::MAX => PasswordStrength::VeryStrong,
        }
    }

    /// 获取强度等级数值（用于比较）
    #[allow(dead_code)]
    pub fn value(&self) -> u8 {
        match self {
            PasswordStrength::VeryWeak => 0,
            PasswordStrength::Weak => 1,
            PasswordStrength::Medium => 2,
            PasswordStrength::Strong => 3,
            PasswordStrength::VeryStrong => 4,
        }
    }

    /// 获取强度等级的中文描述
    #[allow(dead_code)]
    pub fn to_string_cn(&self) -> &'static str {
        match self {
            PasswordStrength::VeryWeak => "非常弱",
            PasswordStrength::Weak => "弱",
            PasswordStrength::Medium => "中等",
            PasswordStrength::Strong => "强",
            PasswordStrength::VeryStrong => "非常强",
        }
    }

    /// 获取强度等级的英文描述
    #[allow(dead_code)]
    pub fn to_string_en(&self) -> &'static str {
        match self {
            PasswordStrength::VeryWeak => "Very Weak",
            PasswordStrength::Weak => "Weak",
            PasswordStrength::Medium => "Medium",
            PasswordStrength::Strong => "Strong",
            PasswordStrength::VeryStrong => "Very Strong",
        }
    }

    /// 检查密码是否足够强（至少中等强度）
    #[allow(dead_code)]
    pub fn is_sufficient(&self) -> bool {
        matches!(self, PasswordStrength::Medium | PasswordStrength::Strong | PasswordStrength::VeryStrong)
    }
}

/// 密码强度检测结果
#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct PasswordStrengthResult {
    /// 强度等级
    #[allow(dead_code)]
    pub strength: PasswordStrength,
    /// 分数（0-4）
    #[allow(dead_code)]
    pub score: u8,
    /// 估算的破解时间（秒）
    #[allow(dead_code)]
    pub crack_time_seconds: u64,
    /// 反馈信息
    #[allow(dead_code)]
    pub feedback: Vec<String>,
}

/// 检测密码强度
/// 
/// # Arguments
/// * `password` - 要检测的密码
/// 
/// # Returns
/// 密码强度检测结果
#[allow(dead_code)]
pub fn check_password_strength(password: &str) -> PasswordStrengthResult {
    let mut score = 0u8;
    let mut feedback = Vec::new();
    
    // 基本长度检查
    let len = password.len();
    if len < 8 {
        feedback.push("密码至少需要8个字符".to_string());
    } else if len >= 12 {
        score += 1;
    }
    
    // 复杂度检查
    let has_upper = password.chars().any(|c| c.is_uppercase());
    let has_lower = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    let has_special = password.chars().any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c));
    
    let complexity_count = [has_upper, has_lower, has_digit, has_special]
        .iter()
        .filter(|&&x| x)
        .count();
    
    score += complexity_count as u8;
    
    if !has_upper {
        feedback.push("建议包含大写字母".to_string());
    }
    if !has_lower {
        feedback.push("建议包含小写字母".to_string());
    }
    if !has_digit {
        feedback.push("建议包含数字".to_string());
    }
    if !has_special {
        feedback.push("建议包含特殊字符".to_string());
    }
    
    // 检查常见弱密码模式
    let common_patterns = ["123456", "password", "qwerty", "abc123"];
    for pattern in &common_patterns {
        if password.to_lowercase().contains(pattern) {
            feedback.push(format!("警告: 密码包含常见弱密码模式"));
            if score > 0 {
                score -= 1;
            }
            break;
        }
    }
    
    // 限制分数范围
    if score > 4 {
        score = 4;
    }
    
    let strength = PasswordStrength::from_score(score);
    
    // 估算破解时间（简化版）
    let crack_time_seconds = match score {
        0 => 1,           // 立即破解
        1 => 60,          // 1分钟
        2 => 3600,        // 1小时
        3 => 86400,       // 1天
        4 => 31536000,    // 1年
        _ => 3153600000,  // 100年
    };

    PasswordStrengthResult {
        strength,
        score,
        crack_time_seconds,
        feedback,
    }
}

/// 验证密码是否符合最低要求
/// 
/// # Arguments
/// * `password` - 要验证的密码
/// * `min_strength` - 最低强度要求（默认 Medium）
/// 
/// # Returns
/// 如果密码符合要求返回 Ok(())，否则返回错误信息
#[allow(dead_code)]
pub fn validate_password_strength(password: &str, min_strength: PasswordStrength) -> Result<(), String> {
    if password.len() < 8 {
        return Err("密码至少需要8个字符".to_string());
    }
    
    let result = check_password_strength(password);
    
    if !result.strength.is_sufficient() || result.strength.value() < min_strength.value() {
        return Err(format!("密码强度不足: {}", result.strength.to_string_cn()));
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_strength() {
        // 非常弱的密码
        let result = check_password_strength("123");
        assert_eq!(result.strength, PasswordStrength::VeryWeak);
        
        // 中等强度的密码
        let result = check_password_strength("Password123");
        assert!(result.strength.is_sufficient());
        
        // 强密码
        let result = check_password_strength("MyStr0ng!P@ssw0rd");
        assert!(matches!(result.strength, PasswordStrength::Strong | PasswordStrength::VeryStrong));
    }

    #[test]
    fn test_validate_password() {
        // 太短
        assert!(validate_password_strength("123", PasswordStrength::Medium).is_err());
        
        // 强度不足
        assert!(validate_password_strength("password", PasswordStrength::Medium).is_err());
        
        // 符合要求
        assert!(validate_password_strength("Password123!", PasswordStrength::Medium).is_ok());
    }
}

