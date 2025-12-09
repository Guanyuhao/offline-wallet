# Offline Wallet

🔐 **安全的离线冷钱包** - 基于 Tauri 2.0 构建的跨平台加密货币钱包

[![Build](https://img.shields.io/github/actions/workflow/status/your-repo/offline-wallet/release.yml?style=flat-square)](https://github.com/your-repo/offline-wallet/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

## ✨ 功能特性

- 🔒 **完全离线** - 冷钱包无网络权限，私钥永不触网
- 🔐 **安全存储** - 系统级加密存储（Keychain/Keystore）+ Stronghold
- 📱 **跨平台支持** - macOS、Windows、iOS、Android
- 🌐 **多链支持** - ETH、BTC、SOL、BNB、TRON、KASPA
- 📷 **二维码通信** - 冷热钱包通过二维码安全交互
- 🌍 **国际化** - 中文 / English
- 🎨 **深色模式** - 自动适配系统主题

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────────────┐
│                      双 App 架构                             │
├─────────────────────────┬───────────────────────────────────┤
│     冷钱包 (离线)        │         热钱包 (联网)              │
│  ┌─────────────────┐    │    ┌─────────────────┐            │
│  │ 私钥生成/存储    │    │    │ 余额查询         │            │
│  │ 地址派生        │ ←──┼──→ │ 交易广播         │            │
│  │ 交易签名        │  QR │    │ Gas 估算         │            │
│  │ 二维码生成      │    │    │ 二维码扫描       │            │
│  └─────────────────┘    │    └─────────────────┘            │
└─────────────────────────┴───────────────────────────────────┘
```

## 📦 项目结构

```
offline-wallet/
├── packages/
│   ├── cold-wallet/      # 冷钱包 App（完全离线）
│   ├── hot-wallet/       # 热钱包 App（联网）
│   └── shared/           # 共享代码（TypeScript + Rust）
├── scripts/              # 工具脚本
└── docs/                 # 文档
```

## 🚀 快速开始

### 环境要求

| 工具           | 版本   | 用途              |
| -------------- | ------ | ----------------- |
| Node.js        | ≥ 18   | 前端构建          |
| pnpm           | ≥ 8    | 包管理            |
| Rust           | ≥ 1.70 | 后端开发          |
| Xcode          | ≥ 15   | iOS 构建（macOS） |
| Android Studio | 最新   | Android 构建      |

### 安装

```bash
# 克隆项目
git clone https://github.com/your-repo/offline-wallet.git
cd offline-wallet

# 安装依赖
pnpm install
```

### 开发

```bash
# 启动冷钱包（桌面）
pnpm dev:cold

# 启动热钱包（桌面）
pnpm dev:hot

# iOS 开发
pnpm dev:cold:ios

# Android 开发
pnpm dev:cold:android
```

### 构建

```bash
# 桌面端
pnpm build:cold        # 冷钱包
pnpm build:hot         # 热钱包

# 移动端
pnpm build:cold:ios    # iOS
pnpm build:cold:android # Android
```

### 代码质量

```bash
pnpm typecheck         # 类型检查
pnpm lint              # 代码检查
pnpm format            # 代码格式化
pnpm test              # 运行测试
```

## 🔧 技术栈

| 层级         | 技术                                      |
| ------------ | ----------------------------------------- |
| **前端**     | React 18 + TypeScript + Ant Design Mobile |
| **后端**     | Rust + Tauri 2.0                          |
| **状态管理** | Zustand                                   |
| **加密**     | AES-256-GCM + Argon2id                    |
| **存储**     | Stronghold + Keychain/Keystore            |
| **构建**     | Vite + pnpm workspace                     |

## 📚 文档

| 文档                                   | 说明               |
| -------------------------------------- | ------------------ |
| [架构设计](./ARCHITECTURE.md)          | 系统架构和通信协议 |
| [构建指南](./BUILD-GUIDE.md)           | 跨平台构建说明     |
| [测试指南](./TESTING.md)               | 测试规范和运行方式 |
| [代码签名](./docs/CODE_SIGNING.md)     | 应用签名配置       |
| [移动端存储](./docs/MOBILE_STORAGE.md) | 移动端安全存储说明 |

## 🔐 安全说明

### 冷钱包安全措施

- ✅ CSP 完全禁用网络连接
- ✅ 私钥加密存储在系统密钥库
- ✅ 签名后立即清除内存中的敏感数据
- ✅ 支持生物识别（Face ID / Touch ID）
- ✅ 自动锁定机制

### 热钱包安全措施

- ✅ 不存储任何私钥
- ✅ 仅处理已签名的交易数据
- ✅ 所有网络请求使用 HTTPS
- ✅ 交易广播前需用户确认

## 📄 License

MIT License - 详见 [LICENSE](LICENSE)
