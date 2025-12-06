# 离线钱包 - 双 App 架构

完全离线的冷钱包 + 联网的热钱包，通过二维码通信。

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发命令

#### 启动单个应用

```bash
# 启动冷钱包（默认）
pnpm dev
# 或
pnpm dev:cold

# 启动热钱包
pnpm dev:hot
```

#### 并行启动所有应用

```bash
pnpm dev:all
```

#### 使用脚本启动

```bash
# 启动冷钱包
./scripts/dev.sh cold

# 启动热钱包
./scripts/dev.sh hot

# 并行启动所有应用
./scripts/dev.sh all
```

### 构建命令

#### 桌面应用

```bash
# 构建冷钱包
pnpm build:cold

# 构建热钱包
pnpm build:hot

# 构建所有应用
pnpm build:all
```

#### 移动端应用

```bash
# iOS
pnpm build:cold:ios
pnpm build:hot:ios

# Android
pnpm build:cold:android
pnpm build:hot:android
```

### 代码质量

```bash
# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 自动修复
pnpm lint:fix

# 代码格式化
pnpm format

# 检查格式化
pnpm format:check
```

### 清理命令

```bash
# 清理所有构建产物和缓存
pnpm clean

# 清理冷钱包
pnpm clean:cold

# 清理热钱包
pnpm clean:hot
```

## 📦 项目结构

```
offline-wallet/
├── packages/
│   ├── cold-wallet/      # 冷钱包（完全离线）
│   ├── hot-wallet/       # 热钱包（联网）
│   └── shared/           # 共享代码
├── scripts/              # 工具脚本
└── docs/                 # 文档
```

## 🔧 开发工具

### 推荐 VS Code 扩展

- Rust Analyzer
- ESLint
- Prettier
- TypeScript

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Rust >= 1.70
- Tauri CLI 2.0

## 📚 更多文档

- [架构设计](./ARCHITECTURE.md)
- [双 App 设置](./DUAL_APP_SETUP.md)
- [移动端存储说明](./docs/MOBILE_STORAGE.md)
- [构建指南](./BUILD-GUIDE.md)
