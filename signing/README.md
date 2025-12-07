# 代码签名密钥管理

## 📁 目录结构

所有应用的签名密钥统一管理在此目录：

```
signing/
├── .gitkeep                    # 保持目录结构
├── cold-wallet.key             # 冷钱包私钥
├── cold-wallet.pub             # 冷钱包公钥
├── cold-wallet.password.txt    # 冷钱包密钥密码（随机生成）
├── hot-wallet.key              # 热钱包私钥（如需要）
├── hot-wallet.pub              # 热钱包公钥（如需要）
└── hot-wallet.password.txt     # 热钱包密钥密码（如需要）
```

## 🔐 密钥命名规则

- **应用名称**: `cold-wallet`（冷钱包）、`hot-wallet`（热钱包）
- **文件命名**: `{app-name}.key`、`{app-name}.pub`、`{app-name}.password.txt`
- **GitHub Secrets**: `TAURI_PRIVATE_KEY_{APP_NAME}`、`TAURI_KEY_PASSWORD_{APP_NAME}`

其中 `{APP_NAME}` 为大写，连字符替换为下划线：

- `cold-wallet` → `COLD_WALLET`
- `hot-wallet` → `HOT_WALLET`

## 🚀 使用方法

### 1. 生成密钥

```bash
# 生成所有应用的密钥
./scripts/generate-signing-keys.sh

# 或选择特定应用
# 选项 1: cold-wallet
# 选项 2: hot-wallet
# 选项 3: 全部生成
```

### 2. 查看配置信息

```bash
# 查看所有应用的配置
./scripts/setup-signing.sh

# 或查看特定应用
./scripts/setup-signing.sh cold-wallet
./scripts/setup-signing.sh hot-wallet
```

### 3. 配置 GitHub Secrets

运行 `setup-signing.sh` 后，会输出需要添加到 GitHub Secrets 的内容：

- `TAURI_PRIVATE_KEY_COLD_WALLET`: Base64 编码的私钥
- `TAURI_KEY_PASSWORD_COLD_WALLET`: 密钥密码（32字符随机生成）

## 🔒 安全说明

1. **密码随机生成**: 所有密钥密码都是 32 字符的随机字符串
2. **密码保存**: 密码保存在 `{app-name}.password.txt` 文件中
3. **文件权限**: 密钥和密码文件权限设置为 600（仅所有者可读写）
4. **Git 忽略**: 所有密钥文件已添加到 `.gitignore`，不会被提交

## 📝 密钥文件说明

- **`.key`**: RSA 私钥文件（AES-256 加密，带密码保护）
- **`.pub`**: RSA 公钥文件（公开，可用于验证）
- **`.password.txt`**: 密钥密码（32字符随机生成）

## ⚠️ 注意事项

1. **备份**: 请妥善备份密钥文件和密码
2. **不要泄露**: 密钥和密码都是敏感信息，不要泄露
3. **权限**: 确保密钥文件权限正确（600）
4. **更新**: 如需重新生成密钥，先删除旧文件

## 🔄 迁移旧密钥

如果之前在其他位置生成了密钥，可以迁移到此目录：

```bash
# 移动旧密钥到新位置
mv packages/cold-wallet/src-tauri/signing/cold-wallet.key signing/
mv packages/cold-wallet/src-tauri/signing/cold-wallet.pub signing/
mv packages/cold-wallet/src-tauri/signing/cold-wallet.password.txt signing/
```
