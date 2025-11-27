# offline-wallet
Tauri（前端任意） + Rust 后端 + 纯 Rust 加密库（RustCrypto 全家桶）
目标：2025 年最安全的离线钱包实现方式之一

安装后完全不需要联网
支持 BTC、ETH、BNB、SOL、TRON 等主流链
生成/导入 BIP39 助记词（12/18/24 词）
可加 passphrase（BIP39 可选密码）
显示地址、导出未签名交易、扫码/粘贴签名交易、导出签名后交易（QR 码或文件）
所有私钥操作都在 Rust 内存中完成，签名后立即 zeroize 擦除
打包后 Windows / macOS / Linux 仅 5~10MB

