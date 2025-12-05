# 🔐 离线钱包 Offline Wallet

> **双 App 架构的冷钱包系统** - 冷钱包完全离线，热钱包联网辅助

[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue)](https://v2.tauri.app/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🏗️ 架构设计

本项目采用**双 App 架构**，将冷钱包和热钱包完全分离：

- **冷钱包 (Cold Wallet)**: 完全离线，私钥管理，交易签名
- **热钱包 (Hot Wallet)**: 联网功能，余额查询，交易广播
- **通信方式**: 二维码

详细架构说明请参考 [ARCHITECTURE.md](./ARCHITECTURE.md)

## ✨ 特色

### 🔒 冷钱包（完全离线）

- **绝对安全** - 无任何网络权限，私钥永不联网
- **系统级加密** - 使用 Keychain/Keystore 存储
- **离线签名** - 所有签名操作在本地完成
- **二维码通信** - 通过二维码与热钱包交互

### 🔥 热钱包（联网辅助）

- **余额查询** - 实时查询多链余额
- **交易广播** - 广播冷钱包签名的交易
- **交易历史** - 查询交易记录
- **Gas 估算** - 估算交易费用

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动冷钱包（端口 1420）
pnpm dev:cold

# 启动热钱包（端口 1421）
pnpm dev:hot
```

### 构建

```bash
# 构建冷钱包
pnpm build:cold

# 构建热钱包
pnpm build:hot
```

## 📊 技术栈

- **前端**: React 18 + TypeScript + Ant Design Mobile + Zustand
- **后端**: Rust + Tauri 2.0
- **加密**: AES-256-GCM + Argon2id
- **存储**: Keychain/Keystore（系统级安全存储）
- **通信**: 二维码协议
- **架构**: Monorepo (pnpm workspace)

## 📁 项目结构

```
offline-wallet/
├── packages/
│   ├── cold-wallet/      # 冷钱包 App（完全离线）
│   ├── hot-wallet/       # 热钱包 App（联网）
│   └── shared/           # 共享代码
├── public/               # 公共资源（图标等）
└── scripts/              # 工具脚本
```

## 📖 文档

- [架构设计](./ARCHITECTURE.md) - 双 App 架构详细说明
- [设置指南](./DUAL_APP_SETUP.md) - 项目设置完成说明
- [包说明](./packages/README.md) - 各包使用说明
- [构建指南](./BUILD-GUIDE.md) - 构建和打包指南

## 🔒 安全特性

- **冷钱包完全离线** - CSP 禁用所有网络连接
- **系统级加密存储** - 使用操作系统提供的安全存储
- **内存即时擦除** - 签名后立即清除敏感数据
- **自动锁定机制** - 无活动自动锁定保护

## 📝 许可证

MIT License
