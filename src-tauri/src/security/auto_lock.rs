//! 自动锁定机制
//! 
//! 实现应用自动锁定功能：
//! - 超时锁定（无操作时间）
//! - 应用进入后台时锁定
//! - 可配置的锁定时间

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

/// 自动锁定配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoLockConfig {
    /// 是否启用自动锁定
    pub enabled: bool,
    /// 锁定超时时间（秒），0 表示禁用超时锁定
    pub timeout_seconds: u64,
    /// 是否在应用进入后台时锁定
    pub lock_on_background: bool,
}

impl Default for AutoLockConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            timeout_seconds: 300, // 默认5分钟
            lock_on_background: true,
        }
    }
}

/// 自动锁定管理器
pub struct AutoLockManager {
    config: Arc<Mutex<AutoLockConfig>>,
    last_activity: Arc<Mutex<Option<SystemTime>>>,
    is_locked: Arc<Mutex<bool>>,
}

impl AutoLockManager {
    pub fn new(config: AutoLockConfig) -> Self {
        Self {
            config: Arc::new(Mutex::new(config)),
            last_activity: Arc::new(Mutex::new(None)),
            is_locked: Arc::new(Mutex::new(false)),
        }
    }

    /// 更新活动时间
    pub fn update_activity(&self) {
        let mut last_activity = self.last_activity.lock().unwrap();
        *last_activity = Some(SystemTime::now());
    }

    /// 检查是否应该锁定
    pub fn should_lock(&self) -> bool {
        let config = self.config.lock().unwrap();
        
        if !config.enabled {
            return false;
        }

        let last_activity = self.last_activity.lock().unwrap();
        
        if let Some(last) = *last_activity {
            if config.timeout_seconds > 0 {
                if let Ok(elapsed) = last.elapsed() {
                    if elapsed.as_secs() >= config.timeout_seconds {
                        return true;
                    }
                }
            }
        }
        
        false
    }

    /// 锁定钱包
    pub fn lock(&self) {
        let mut is_locked = self.is_locked.lock().unwrap();
        *is_locked = true;
    }

    /// 解锁钱包
    pub fn unlock(&self) {
        let mut is_locked = self.is_locked.lock().unwrap();
        *is_locked = false;
        self.update_activity();
    }

    /// 检查是否已锁定
    pub fn is_locked(&self) -> bool {
        *self.is_locked.lock().unwrap()
    }

    /// 更新配置
    pub fn update_config(&self, config: AutoLockConfig) {
        let mut current_config = self.config.lock().unwrap();
        *current_config = config;
    }

    /// 获取配置
    pub fn get_config(&self) -> AutoLockConfig {
        self.config.lock().unwrap().clone()
    }

    /// 获取剩余时间（秒）
    pub fn get_remaining_seconds(&self) -> Option<u64> {
        let config = self.config.lock().unwrap();
        if !config.enabled || config.timeout_seconds == 0 {
            return None;
        }

        let last_activity = self.last_activity.lock().unwrap();
        if let Some(last) = *last_activity {
            if let Ok(elapsed) = last.elapsed() {
                let elapsed_secs = elapsed.as_secs();
                if elapsed_secs < config.timeout_seconds {
                    return Some(config.timeout_seconds - elapsed_secs);
                }
            }
        }
        
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_auto_lock() {
        let config = AutoLockConfig {
            enabled: true,
            timeout_seconds: 5,
            lock_on_background: true,
        };
        
        let manager = AutoLockManager::new(config);
        
        // 更新活动时间
        manager.update_activity();
        assert!(!manager.should_lock());
        
        // 等待超时（在测试中模拟）
        std::thread::sleep(Duration::from_secs(6));
        // 注意：实际测试中需要手动设置时间或使用 mock
    }
}

