# GitHub Secrets 配置清单

本文档列出了所有需要在 GitHub 仓库中配置的 Secrets。

## 📋 配置入口

GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

## 🖥️ 桌面端签名（Tauri）

### Cold Wallet

| Secret 名称                      | 值来源            | 获取方式                                      |
| -------------------------------- | ----------------- | --------------------------------------------- |
| `TAURI_PRIVATE_KEY_COLD_WALLET`  | Base64 编码的私钥 | `base64 -i signing/cold-wallet.key \| pbcopy` |
| `TAURI_KEY_PASSWORD_COLD_WALLET` | 密钥密码          | `cat signing/cold-wallet.password.txt`        |

### Hot Wallet

| Secret 名称                     | 值来源            | 获取方式                                     |
| ------------------------------- | ----------------- | -------------------------------------------- |
| `TAURI_PRIVATE_KEY_HOT_WALLET`  | Base64 编码的私钥 | `base64 -i signing/hot-wallet.key \| pbcopy` |
| `TAURI_KEY_PASSWORD_HOT_WALLET` | 密钥密码          | `cat signing/hot-wallet.password.txt`        |

## 📱 移动端签名

### Android（Cold & Hot 共用）

| Secret 名称                 | 值来源                 | 获取方式                                      |
| --------------------------- | ---------------------- | --------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | Base64 编码的 keystore | `cat signing/android-release.keystore.base64` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore 密码          | `cat signing/android-keystore.password.txt`   |
| `ANDROID_KEY_ALIAS`         | 密钥别名               | 固定值：`cold-wallet`                         |
| `ANDROID_KEY_PASSWORD`      | 密钥密码               | 与 `ANDROID_KEYSTORE_PASSWORD` 相同           |

### iOS（Cold & Hot 共用）

| Secret 名称                  | 值来源                         | 获取方式                                          |
| ---------------------------- | ------------------------------ | ------------------------------------------------- |
| `APPLE_CERTIFICATE`          | P12 证书的 Base64              | `base64 -i signing/ios-development.p12 \| pbcopy` |
| `APPLE_CERTIFICATE_PASSWORD` | 证书密码                       | `cat signing/ios-certificate.password.txt`        |
| `APPLE_PROVISIONING_PROFILE` | Provisioning Profile 的 Base64 | `cat signing/ios-app.mobileprovision.base64`      |
| `APPLE_TEAM_ID`              | Apple 开发者团队 ID            | 在 Apple Developer 查看（如 `ZZAL7KSM56`）        |

### 可选（iOS）

| Secret 名称         | 默认值                   | 说明                              |
| ------------------- | ------------------------ | --------------------------------- |
| `KEYCHAIN_PASSWORD` | `temp_keychain_password` | GitHub Actions 临时 keychain 密码 |

## 🚀 快速配置脚本

### 桌面端（Cold Wallet）

```bash
echo "TAURI_PRIVATE_KEY_COLD_WALLET:"
base64 -i signing/cold-wallet.key

echo ""
echo "TAURI_KEY_PASSWORD_COLD_WALLET:"
cat signing/cold-wallet.password.txt
```

### 桌面端（Hot Wallet）

```bash
echo "TAURI_PRIVATE_KEY_HOT_WALLET:"
base64 -i signing/hot-wallet.key

echo ""
echo "TAURI_KEY_PASSWORD_HOT_WALLET:"
cat signing/hot-wallet.password.txt
```

### Android

```bash
echo "ANDROID_KEYSTORE_BASE64:"
cat signing/android-release.keystore.base64

echo ""
echo "ANDROID_KEYSTORE_PASSWORD & ANDROID_KEY_PASSWORD:"
cat signing/android-keystore.password.txt

echo ""
echo "ANDROID_KEY_ALIAS:"
echo "cold-wallet"
```

### iOS

```bash
echo "APPLE_CERTIFICATE:"
cat signing/ios-development.p12.base64

echo ""
echo "APPLE_CERTIFICATE_PASSWORD:"
cat signing/ios-certificate.password.txt

echo ""
echo "APPLE_PROVISIONING_PROFILE:"
cat signing/ios-app.mobileprovision.base64

echo ""
echo "APPLE_TEAM_ID:"
echo "（请在 Apple Developer 网站查看）"
```

## ✅ 配置检查清单

### Cold Wallet Desktop

- [ ] `TAURI_PRIVATE_KEY_COLD_WALLET`
- [ ] `TAURI_KEY_PASSWORD_COLD_WALLET`

### Cold Wallet Mobile

- [ ] Android Secrets（4个）
- [ ] iOS Secrets（4个）

### Hot Wallet Desktop

- [ ] `TAURI_PRIVATE_KEY_HOT_WALLET`
- [ ] `TAURI_KEY_PASSWORD_HOT_WALLET`

### Hot Wallet Mobile

- [ ] Android Secrets（已配置，与 Cold 共用）
- [ ] iOS Secrets（已配置，与 Cold 共用）

## 🔐 安全提示

1. **不要泄露**：这些 Secrets 包含签名密钥，一旦泄露可能导致安全问题
2. **定期更新**：建议每年更新一次签名密钥
3. **权限控制**：只有仓库管理员才能查看和修改 Secrets
4. **备份密钥**：请在安全的地方备份 `signing/` 目录

## 📞 常见问题

### Q: 如何验证 Secrets 是否配置正确？

触发一次工作流运行，查看构建日志。如果密钥配置错误，会在构建时报错。

### Q: 可以在本地查看 Secrets 吗？

不可以。GitHub Secrets 只能在 Actions 运行时访问，无法通过 UI 查看完整内容。

### Q: Android 和 iOS 签名为什么要共用？

因为移动端签名配置相对固定，Cold Wallet 和 Hot Wallet 可以使用相同的开发者证书和 Keystore。如果需要独立签名，需要：

1. 生成独立的 Android Keystore
2. 申请独立的 iOS 证书
3. 修改工作流使用不同的 Secret 名称

### Q: 如何重新生成密钥？

参考 `signing/README.md` 中的说明，重新生成后需要：

1. 更新 GitHub Secrets
2. 触发新的构建
3. 用户需要重新安装应用（签名已更改）
