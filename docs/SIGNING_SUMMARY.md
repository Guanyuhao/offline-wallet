# 代码签名配置总结

## ✅ 已完成配置

### 📁 统一签名管理

- ✅ 根目录创建 `signing/` 文件夹统一管理所有签名密钥
- ✅ 支持多应用：cold-wallet（冷钱包）、hot-wallet（热钱包）
- ✅ 每个应用使用独立的密钥文件

### 🔐 密钥生成

#### 冷钱包 (Cold Wallet)

- ✅ 私钥：`signing/cold-wallet.key`（AES-256 加密）
- ✅ 公钥：`signing/cold-wallet.pub`
- ✅ 密码：`signing/cold-wallet.password.txt`（32字符随机生成）

#### 热钱包 (Hot Wallet)

- ✅ 私钥：`signing/hot-wallet.key`（AES-256 加密）
- ✅ 公钥：`signing/hot-wallet.pub`
- ✅ 密码：`signing/hot-wallet.password.txt`（32字符随机生成）

### 🛠️ 工具脚本

- ✅ `scripts/generate-signing-keys.sh` - 生成签名密钥（支持多应用，自动随机密码）
- ✅ `scripts/setup-signing.sh` - 查看配置信息并输出 GitHub Secrets

### 🔒 安全配置

- ✅ 所有密钥文件已添加到 `.gitignore`
- ✅ 密钥文件权限设置为 600（仅所有者可读写）
- ✅ 密码文件权限设置为 600
- ✅ 密码自动随机生成（32字符）

### ⚙️ CI/CD 配置

- ✅ GitHub Actions workflow 已更新使用新的 Secret 命名
- ✅ 支持冷钱包自动构建和签名

## 📋 GitHub Secrets 清单

### 需要添加的 Secrets

#### 冷钱包

- `TAURI_PRIVATE_KEY_COLD_WALLET` - Base64 编码的私钥
- `TAURI_KEY_PASSWORD_COLD_WALLET` - 密钥密码

#### 热钱包（如需要）

- `TAURI_PRIVATE_KEY_HOT_WALLET` - Base64 编码的私钥
- `TAURI_KEY_PASSWORD_HOT_WALLET` - 密钥密码

## 🚀 快速操作

### 查看配置信息

```bash
# 查看冷钱包配置
./scripts/setup-signing.sh cold-wallet

# 查看热钱包配置
./scripts/setup-signing.sh hot-wallet

# 查看所有应用配置
./scripts/setup-signing.sh
```

### 重新生成密钥

```bash
# 删除旧密钥
rm signing/cold-wallet.*

# 重新生成
./scripts/generate-signing-keys.sh
# 选择选项 1 (cold-wallet)
```

## 📚 相关文档

- `signing/README.md` - 签名目录使用说明
- `docs/CODE_SIGNING.md` - 详细代码签名配置指南
- `.github/workflows/README.md` - GitHub Actions 工作流说明

## ⚠️ 重要提示

1. **备份密钥**：请妥善备份 `signing/` 目录中的所有文件
2. **密码安全**：密码文件包含敏感信息，不要泄露
3. **Git 提交**：确保密钥文件不会被提交到 Git（已配置 `.gitignore`）
4. **权限检查**：定期检查文件权限，确保为 600

## 🔄 下一步

1. ✅ 将 Secrets 添加到 GitHub（运行 `setup-signing.sh` 获取值）
2. ✅ 测试构建流程（推送到 main 分支触发构建）
3. ⏳ 配置 macOS 签名（需要 Apple Developer 账号）
4. ⏳ 配置移动端签名（iOS/Android）
