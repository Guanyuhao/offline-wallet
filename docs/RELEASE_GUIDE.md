# 发布流程指南

## 📋 概述

本项目支持 Cold Wallet 和 Hot Wallet 两个应用的独立版本管理和发布。每个应用可以独立发布桌面端和移动端版本。

## 🏗️ 工作流架构

### CI 工作流（持续集成）

**触发条件**：

- Push 到 `main`、`develop` 或 `feature/*` 分支
- Pull Request 到 `main` 分支

**功能**：

- 代码检查（Lint）
- 类型检查（TypeCheck）
- 前端构建测试
- ⚠️ **不生成安装包**，仅用于代码质量检查

### Release 工作流（发布）

每个应用有独立的桌面端和移动端发布工作流：

| 工作流                     | Tag 格式          | 发布内容                              |
| -------------------------- | ----------------- | ------------------------------------- |
| `release-cold-desktop.yml` | `cold-desktop-v*` | Cold Wallet 桌面版（Windows + macOS） |
| `release-cold-mobile.yml`  | `cold-mobile-v*`  | Cold Wallet 移动版（Android + iOS）   |
| `release-hot-desktop.yml`  | `hot-desktop-v*`  | Hot Wallet 桌面版（Windows + macOS）  |
| `release-hot-mobile.yml`   | `hot-mobile-v*`   | Hot Wallet 移动版（Android + iOS）    |

## 🚀 发布步骤

### 1. 准备发布

#### 更新版本号

**Cold Wallet 桌面端**：

```bash
# packages/cold-wallet/package.json
{
  "version": "1.0.0"
}

# packages/cold-wallet/src-tauri/tauri.conf.json
{
  "version": "1.0.0"
}

# packages/cold-wallet/src-tauri/Cargo.toml
[package]
version = "1.0.0"
```

**Cold Wallet 移动端**：

```bash
# 同上，确保版本号一致
```

**Hot Wallet**：

```bash
# 同理更新 packages/hot-wallet/ 下的对应文件
```

#### 提交版本更新

```bash
git add .
git commit -m "chore: bump cold-wallet desktop to v1.0.0"
git push origin main
```

### 2. 打 Tag 触发发布

#### 发布 Cold Wallet 桌面版

```bash
git tag -a cold-desktop-v1.0.0 -m "Release Cold Wallet Desktop v1.0.0"
git push origin cold-desktop-v1.0.0
```

#### 发布 Cold Wallet 移动版

```bash
git tag -a cold-mobile-v1.0.0 -m "Release Cold Wallet Mobile v1.0.0"
git push origin cold-mobile-v1.0.0
```

#### 发布 Hot Wallet 桌面版

```bash
git tag -a hot-desktop-v1.0.0 -m "Release Hot Wallet Desktop v1.0.0"
git push origin hot-desktop-v1.0.0
```

#### 发布 Hot Wallet 移动版

```bash
git tag -a hot-mobile-v1.0.0 -m "Release Hot Wallet Mobile v1.0.0"
git push origin hot-mobile-v1.0.0
```

### 3. 自动构建与发布

GitHub Actions 会自动：

1. ✅ 检出代码
2. ✅ 安装依赖
3. ✅ 构建所有平台
4. ✅ 上传产物
5. ✅ 创建 GitHub Release（**非草稿，直接发布**）
6. ✅ 上传安装包到 Release

### 4. 手动编辑 Release（可选）

如果需要补充发布说明：

1. 前往 GitHub Releases 页面
2. 找到对应的 Release
3. 点击 **Edit**
4. 编辑 Release Notes
5. 保存

⚠️ **注意**：编辑 Release 不会触发新的构建。

## 📦 产物说明

### 桌面端

| 平台        | 文件格式       | 说明                     |
| ----------- | -------------- | ------------------------ |
| Windows x64 | `.msi`, `.exe` | 安装包                   |
| macOS Intel | `.dmg`, `.app` | Intel 芯片 Mac           |
| macOS ARM   | `.dmg`, `.app` | Apple Silicon (M1/M2/M3) |

### 移动端

| 平台    | 文件格式 | 说明                  |
| ------- | -------- | --------------------- |
| Android | `.apk`   | 直接安装              |
| Android | `.aab`   | Google Play 分发      |
| iOS     | `.ipa`   | TestFlight 或企业签名 |
| iOS     | `.app`   | 调试用                |

## 🔐 签名密钥配置

### GitHub Secrets

确保以下 Secrets 已配置：

#### Tauri 桌面签名

- `TAURI_PRIVATE_KEY_COLD_WALLET`
- `TAURI_KEY_PASSWORD_COLD_WALLET`
- `TAURI_PRIVATE_KEY_HOT_WALLET`
- `TAURI_KEY_PASSWORD_HOT_WALLET`

#### Android 签名

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

#### iOS 签名

- `APPLE_CERTIFICATE` (P12 Base64)
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_PROVISIONING_PROFILE` (Base64)
- `APPLE_TEAM_ID`
- `KEYCHAIN_PASSWORD` (可选)

### 生成签名密钥

参考 `signing/README.md` 中的说明。

## 🔄 版本管理策略

### 独立版本号

Cold Wallet 和 Hot Wallet 使用独立版本号：

```
Cold Wallet Desktop: v1.0.0
Cold Wallet Mobile:  v1.0.0
Hot Wallet Desktop:  v2.0.0
Hot Wallet Mobile:   v1.5.0
```

### 版本号规范（语义化版本）

```
MAJOR.MINOR.PATCH

MAJOR: 重大更新，不兼容的 API 变更
MINOR: 新功能，向后兼容
PATCH: Bug 修复，向后兼容
```

### 示例

```
1.0.0 → 初始版本
1.1.0 → 新增功能
1.1.1 → Bug 修复
2.0.0 → 重大更新
```

## ⚙️ 手动触发构建

除了 tag 触发，每个工作流都支持手动触发：

1. 前往 **Actions** 页面
2. 选择对应的工作流
3. 点击 **Run workflow**
4. 输入版本号（例如：`1.0.0`）
5. 点击 **Run workflow**

## 🐛 常见问题

### Q: 为什么不创建草稿 Release？

**A**: 当前配置为直接发布正式版本（`draft: false`）。如果需要先创建草稿，修改工作流中的：

```yaml
- name: Create Release
  uses: softprops/action-gh-release@v2
  with:
    draft: true # 改为 true
```

### Q: 编辑 Release 后会重新构建吗？

**A**: 不会。编辑 Release 不会触发新的构建。只有推送新的 tag 才会触发构建。

### Q: 如何删除失败的 Release？

```bash
# 删除 GitHub Release
gh release delete cold-desktop-v1.0.0 --yes

# 删除本地 tag
git tag -d cold-desktop-v1.0.0

# 删除远程 tag
git push origin :refs/tags/cold-desktop-v1.0.0
```

### Q: Android 构建成功但没上传到 Release？

检查以下几点：

1. `create-release` job 的 `if` 条件是否正确
2. `files` glob 模式是否匹配产物路径
3. 查看 Actions 日志中的 "Display structure" 步骤

### Q: iOS 构建失败：No Accounts / No profiles

确保：

1. `APPLE_CERTIFICATE` 和 `APPLE_PROVISIONING_PROFILE` 已正确配置
2. Provisioning Profile 与 Bundle ID 匹配
3. 证书未过期

### Q: Windows 构建失败：icon.ico not in 3.00 format

使用 ImageMagick 重新生成图标：

```bash
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

## 📊 工作流状态监控

### 查看当前运行

```bash
gh run list --repo Guanyuhao/offline-wallet
```

### 查看特定运行

```bash
gh run view <run-id> --repo Guanyuhao/offline-wallet
```

### 实时监控

```bash
gh run watch <run-id> --repo Guanyuhao/offline-wallet --interval 10 --exit-status
```

## 🎯 最佳实践

1. **先测试后发布**：在 `develop` 分支开发，合并到 `main` 后再打 tag
2. **版本号一致性**：确保 `package.json`、`Cargo.toml`、`tauri.conf.json` 版本号一致
3. **Release Notes**：使用清晰的 commit message，GitHub 会自动生成 Release Notes
4. **签名密钥安全**：定期更新密钥，不要将密钥提交到代码仓库
5. **测试安装包**：发布前在所有目标平台测试安装包

## 📞 支持

如遇问题，请查看：

- GitHub Actions 日志
- `signing/README.md`（签名相关）
- 提交 Issue 到项目仓库
