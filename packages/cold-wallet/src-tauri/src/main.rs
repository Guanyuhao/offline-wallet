// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// 桌面端入口点
// 移动端入口点在 lib.rs 中定义
fn main() {
    cold_wallet_lib::run();
}
