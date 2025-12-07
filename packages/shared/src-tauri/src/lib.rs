/**
 * @Author liyongjie
 * 共享 Rust 代码库
 * 
 * 用于冷钱包和热钱包之间的代码复用
 */

pub mod qrcode;
pub mod chains;

// 插件注册模块（所有平台都可用）
pub mod plugins;

pub use qrcode::*;
pub use chains::*;
pub use plugins::*;

// 移动端插件模块（仅在移动端编译）
// 注意：模块声明和重新导出都需要条件编译，因为桌面端不存在 mobile 模块
#[cfg(any(target_os = "android", target_os = "ios"))]
pub mod mobile;

#[cfg(any(target_os = "android", target_os = "ios"))]
pub use mobile::*;

