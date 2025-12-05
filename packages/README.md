# 双 App 架构说明

## 📦 项目结构

```
packages/
├── cold-wallet/      # 冷钱包 App（完全离线）
├── hot-wallet/       # 热钱包 App（联网）
└── shared/           # 共享代码
```

## 🚀 快速开始

### 安装依赖

```bash
# 在项目根目录
pnpm install

# 或在各个子包目录
cd packages/cold-wallet && pnpm install
cd packages/hot-wallet && pnpm install
```

### 开发模式

```bash
# 启动冷钱包（端口 1420）
cd packages/cold-wallet
pnpm dev

# 启动热钱包（端口 1421）
cd packages/hot-wallet
pnpm dev
```

### 构建

```bash
# 构建冷钱包
cd packages/cold-wallet
pnpm tauri build

# 构建热钱包
cd packages/hot-wallet
pnpm tauri build
```

## 🔐 冷钱包功能

- ✅ 助记词生成/导入
- ✅ 私钥加密存储
- ✅ 地址生成
- ✅ 交易签名（离线）
- ✅ 二维码生成
- ❌ **无网络权限**（完全离线）

## 🔥 热钱包功能

- ✅ 余额查询
- ✅ 交易广播
- ✅ 交易历史
- ✅ 二维码扫描
- ✅ Gas 费估算
- ✅ 区块链交互

## 📡 通信方式

两个 App 通过**二维码**进行通信：

1. **查看地址**：冷钱包生成地址二维码 → 热钱包扫描查询余额
2. **发送交易**：热钱包生成未签名交易二维码 → 冷钱包签名 → 生成签名交易二维码 → 热钱包广播

详细协议请参考 `shared/src/types/qrcode.ts`

## ⚠️ 重要提示

1. **冷钱包绝对不能联网**：确保 CSP 配置正确
2. **热钱包不存储私钥**：仅处理已签名数据
3. **测试时分别启动**：两个 App 使用不同端口
