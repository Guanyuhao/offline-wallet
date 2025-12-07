# 代码签名配置指南

本文档说明如何为桌面版应用生成和配置代码签名。

## 📋 概述

代码签名用于：

- **Windows**: 避免 "未知发布者" 警告，提升用户信任度
- **macOS**: 通过 Gatekeeper 验证，允许用户安装应用

## 📁 签名密钥统一管理

所有应用的签名密钥统一管理在根目录的 `signing/` 文件夹：

```
offline-wallet/
└── signing/
    ├── cold-wallet.key              # 冷钱包私钥
    ├── cold-wallet.pub              # 冷钱包公钥
    ├── cold-wallet.password.txt    # 冷钱包密钥密码（随机生成）
    ├── hot-wallet.key               # 热钱包私钥
    ├── hot-wallet.pub               # 热钱包公钥
    └── hot-wallet.password.txt      # 热钱包密钥密码（随机生成）
```

## 🚀 快速开始

### 1. 生成签名密钥

使用统一的管理脚本生成密钥：

```bash
# 生成所有应用的密钥（推荐）
./scripts/generate-signing-keys.sh

# 或选择特定应用
# 选项 1: cold-wallet (冷钱包)
# 选项 2: hot-wallet (热钱包)
# 选项 3: 全部生成
```

脚本会自动：

- ✅ 生成 RSA 2048 位密钥对
- ✅ 使用 AES-256 加密保护私钥
- ✅ 随机生成 32 字符密码
- ✅ 保存密码到 `{app-name}.password.txt`

### 2. 查看配置信息

```bash
# 查看所有应用的配置
./scripts/setup-signing.sh

# 或查看特定应用
./scripts/setup-signing.sh cold-wallet
./scripts/setup-signing.sh hot-wallet
```

### 3. 配置 GitHub Secrets

运行 `setup-signing.sh` 后会输出需要添加到 GitHub Secrets 的内容。

## 🔐 Windows 代码签名

### 自动生成（推荐）

使用项目提供的脚本自动生成：

```bash
./scripts/generate-signing-keys.sh
```

### 手动生成（高级）

如果需要手动生成，可以使用 OpenSSL：

```bash
# 生成带密码保护的私钥
openssl genrsa -aes256 -passout pass:"你的密码" -out signing/cold-wallet.key 2048

# 生成公钥
openssl rsa -in signing/cold-wallet.key -passin pass:"你的密码" -pubout -out signing/cold-wallet.pub
```

### 方法 3: 购买 Windows 代码签名证书（生产环境推荐）

对于生产环境，建议购买受信任的代码签名证书：

1. **购买证书**（推荐供应商）：
   - DigiCert
   - Sectigo (原 Comodo)
   - GlobalSign

2. **导出证书**：
   - 将证书导出为 `.pfx` 格式
   - 包含私钥和证书链

3. **转换为 Tauri 格式**：

   ```bash
   # 提取私钥
   openssl pkcs12 -in certificate.pfx -nocerts -nodes -out signing/cold-wallet.key

   # 提取证书
   openssl pkcs12 -in certificate.pfx -clcerts -nokeys -out signing/cold-wallet.crt
   ```

## 🍎 macOS 代码签名

macOS 代码签名需要 Apple Developer 账号（$99/年）。

### 步骤 1: 创建证书

1. 访问 [Apple Developer Portal](https://developer.apple.com/account)
2. 进入 `Certificates, Identifiers & Profiles`
3. 创建 `Developer ID Application` 证书（用于分发到 Mac App Store 外）
4. 下载证书并安装到 Keychain

### 步骤 2: 导出证书和私钥

1. 打开 **Keychain Access**
2. 找到 `Developer ID Application: Your Name` 证书
3. 展开证书，选择私钥
4. 右键 → `Export "Your Name"` → 保存为 `.p12` 格式
5. 设置导出密码

### 步骤 3: 转换为 PEM 格式

```bash
cd packages/cold-wallet/src-tauri/signing

# 转换为 PEM（包含私钥和证书）
openssl pkcs12 -in macos-certificate.p12 -out macos-certificate.pem -nodes

# 或分别提取私钥和证书
openssl pkcs12 -in macos-certificate.p12 -nocerts -nodes -out macos-key.pem
openssl pkcs12 -in macos-certificate.p12 -clcerts -nokeys -out macos-cert.pem
```

### 步骤 4: 配置 Tauri

在 `tauri.conf.json` 中添加签名配置：

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
      "providerShortName": "TEAM_ID",
      "entitlements": "entitlements.plist"
    }
  }
}
```

## 🔧 快速设置脚本

### 生成密钥

```bash
# 运行生成脚本
chmod +x scripts/generate-signing-keys.sh
./scripts/generate-signing-keys.sh
```

### 设置 GitHub Secrets

```bash
# 运行设置脚本
chmod +x scripts/setup-signing.sh
./scripts/setup-signing.sh
```

脚本会输出 Base64 编码的私钥，将其添加到 GitHub Secrets。

## 📝 GitHub Secrets 配置

### 统一命名规则

每个应用使用独立的 Secrets，命名格式：

- `TAURI_PRIVATE_KEY_{APP_NAME}` - 私钥（Base64 编码）
- `TAURI_KEY_PASSWORD_{APP_NAME}` - 密钥密码

其中 `{APP_NAME}` 为大写，连字符替换为下划线：

- `cold-wallet` → `COLD_WALLET`
- `hot-wallet` → `HOT_WALLET`

### 冷钱包 (Cold Wallet)

1. 访问 GitHub 仓库：`Settings` → `Secrets and variables` → `Actions`
2. 添加以下 Secrets：

| Secret Name                      | 说明                      | 如何获取                                      |
| -------------------------------- | ------------------------- | --------------------------------------------- |
| `TAURI_PRIVATE_KEY_COLD_WALLET`  | 冷钱包私钥（Base64 编码） | 运行 `./scripts/setup-signing.sh cold-wallet` |
| `TAURI_KEY_PASSWORD_COLD_WALLET` | 冷钱包密钥密码            | 查看 `signing/cold-wallet.password.txt`       |

### 热钱包 (Hot Wallet)

| Secret Name                     | 说明                      | 如何获取                                     |
| ------------------------------- | ------------------------- | -------------------------------------------- |
| `TAURI_PRIVATE_KEY_HOT_WALLET`  | 热钱包私钥（Base64 编码） | 运行 `./scripts/setup-signing.sh hot-wallet` |
| `TAURI_KEY_PASSWORD_HOT_WALLET` | 热钱包密钥密码            | 查看 `signing/hot-wallet.password.txt`       |

### macOS 签名

| Secret Name                  | 说明                      | 如何获取                   |
| ---------------------------- | ------------------------- | -------------------------- |
| `APPLE_CERTIFICATE`          | Apple 证书（Base64 编码） | `base64 -i macos-cert.pem` |
| `APPLE_CERTIFICATE_PASSWORD` | 证书密码                  | 导出 .p12 时设置的密码     |
| `APPLE_TEAM_ID`              | 开发团队 ID               | Apple Developer Portal     |

## 🔒 安全注意事项

1. **永远不要提交私钥到 Git**
   - 已添加到 `.gitignore`
   - 使用 GitHub Secrets 存储

2. **密钥备份**
   - 将私钥备份到安全位置
   - 使用密码管理器存储

3. **权限控制**
   - 限制访问 GitHub Secrets 的权限
   - 使用最小权限原则

## ✅ 验证签名

### Windows

```bash
# 验证 MSI 签名
signtool verify /pa /v installer.msi

# 验证 EXE 签名
signtool verify /pa /v app.exe
```

### macOS

```bash
# 验证应用签名
codesign -dv --verbose=4 ColdWallet.app

# 验证 Gatekeeper
spctl --assess --verbose ColdWallet.app
```

## 🚀 CI/CD 集成

签名密钥已集成到 GitHub Actions workflow：

- **Windows**: 自动使用 `TAURI_PRIVATE_KEY` 签名
- **macOS**: 需要配置 Apple 证书（见上方）

构建时会自动应用签名。

## 📚 参考资源

- [Tauri Code Signing](https://tauri.app/v1/guides/distribution/sign-macos)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
- [Apple Code Signing](https://developer.apple.com/documentation/security/code_signing_services)
