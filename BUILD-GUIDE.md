# 构建指南

本文档包含跨平台构建指南和图标设置说明。

## 📦 当前状态

✅ 所有图标已生成：

- Windows: `icon.ico` ✅
- Android: 所有密度的图标 ✅
- iOS: 所有尺寸的图标 ✅
- macOS: `icon.icns` ✅

## 🪟 Windows 构建

### 在 Windows 系统上构建

```bash
# 1. 安装 Windows 目标平台
rustup target add x86_64-pc-windows-msvc

# 2. 构建 Windows 版本
pnpm tauri build --target x86_64-pc-windows-msvc
```

### 在 macOS/Linux 上交叉编译 Windows（需要 Wine）

```bash
# 1. 安装 Windows 目标平台
rustup target add x86_64-pc-windows-msvc

# 2. 安装 Wine（用于签名和打包）
# macOS: brew install wine-stable
# Linux: sudo apt-get install wine

# 3. 构建（可能需要配置）
pnpm tauri build --target x86_64-pc-windows-msvc
```

### Windows 构建产物

构建完成后，安装包位于：

- `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/`
  - `msi/` - Windows Installer (.msi)
  - `nsis/` - Nullsoft Scriptable Install System (.exe)

## 🤖 Android 构建

### 前置要求

1. **安装 Android SDK**

   ```bash
   # macOS/Linux
   brew install --cask android-studio
   # 或下载 Android Studio: https://developer.android.com/studio
   ```

2. **配置环境变量**

   ```bash
   # 添加到 ~/.zshrc 或 ~/.bashrc
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

3. **安装 Android 目标平台**

   ```bash
   rustup target add aarch64-linux-android
   rustup target add armv7-linux-androideabi
   rustup target add i686-linux-android
   rustup target add x86_64-linux-android
   ```

4. **安装 Android NDK**
   ```bash
   # 通过 Android Studio SDK Manager 安装 NDK
   # 或使用命令行
   sdkmanager "ndk;25.1.8937393"
   ```

### 构建 Android APK

```bash
# 构建 Android 版本
pnpm tauri build --target aarch64-linux-android

# 或构建所有架构
pnpm tauri build android
```

### Android 构建产物

构建完成后，APK 位于：

- `src-tauri/target/aarch64-linux-android/release/apk/`
  - `app-release.apk` - 发布版 APK
  - `app-release-unsigned.apk` - 未签名 APK

### Android 签名（可选）

```bash
# 生成密钥库
keytool -genkey -v -keystore offline-wallet.keystore -alias offline-wallet -keyalg RSA -keysize 2048 -validity 10000

# 签名 APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore offline-wallet.keystore app-release-unsigned.apk offline-wallet

# 对齐 APK
zipalign -v 4 app-release-unsigned.apk app-release.apk
```

## 🍎 macOS 构建（当前系统）

```bash
# 构建 macOS 版本
pnpm tauri build

# 构建产物位于
# src-tauri/target/release/bundle/macos/
#   - offline-wallet.app (应用程序)
#   - offline-wallet.dmg (磁盘镜像)
```

## 📝 快速构建脚本

创建 `scripts/build-all.sh`:

```bash
#!/bin/bash

echo "🔨 开始构建所有平台..."

# 构建前端
echo "📦 构建前端..."
pnpm run build

# macOS
echo "🍎 构建 macOS..."
pnpm tauri build

# Windows (需要 Windows 系统或 Wine)
# echo "🪟 构建 Windows..."
# pnpm tauri build --target x86_64-pc-windows-msvc

# Android (需要 Android SDK)
# echo "🤖 构建 Android..."
# pnpm tauri build android

echo "✅ 构建完成！"
```

## ⚠️ 注意事项

1. **跨平台构建限制**
   - Windows 构建最好在 Windows 系统上进行
   - Android 构建需要 Android SDK 和 NDK
   - macOS 构建只能在 macOS 上进行

2. **图标要求**
   - ✅ 所有图标已生成
   - Windows: `icon.ico` ✅
   - Android: 所有密度图标 ✅

3. **构建时间**
   - 首次构建可能需要较长时间（下载依赖）
   - 后续构建会更快（使用缓存）

## 🚀 推荐构建流程

1. **开发环境**: macOS - 用于开发和测试
2. **Windows 构建**: 使用 Windows 虚拟机或 CI/CD
3. **Android 构建**: 在 macOS/Linux 上配置 Android SDK

## 🎨 图标设置

### 图标文件结构

```
offline-wallet/
├── public/
│   ├── wallet-icon.svg      # Favicon (128x128)
│   └── wallet-logo.svg      # Header Logo (32x32)
├── src-tauri/
│   └── icons/
│       ├── wallet-icon.svg  # 源文件
│       ├── icon.png         # 主图标 (512x512)
│       ├── 32x32.png        # 小图标
│       ├── 128x128.png      # 标准图标
│       ├── 128x128@2x.png   # 高分辨率 (256x256)
│       ├── icon.icns         # macOS 图标
│       └── icon.ico          # Windows 图标
└── scripts/
    └── generate-wallet-icons.js  # 图标生成脚本
```

### 生成图标

#### 方法 1：使用 Tauri CLI（推荐）

```bash
# 从 SVG 自动生成所有尺寸和格式
pnpm tauri icon src-tauri/icons/wallet-icon.svg
```

这会自动生成所有需要的尺寸和格式。

#### 方法 2：使用在线工具

1. 访问 [CloudConvert](https://cloudconvert.com/svg-to-png) 或 [Convertio](https://convertio.co/svg-png/)
2. 上传 `src-tauri/icons/wallet-icon.svg`
3. 设置输出尺寸并下载

#### 方法 3：使用 ImageMagick（命令行）

```bash
# 安装 ImageMagick (macOS)
brew install imagemagick

# 生成不同尺寸的图标
cd src-tauri/icons
convert wallet-icon.svg -resize 32x32 32x32.png
convert wallet-icon.svg -resize 128x128 128x128.png
convert wallet-icon.svg -resize 256x256 128x128@2x.png
convert wallet-icon.svg -resize 512x512 icon.png

# macOS 专用格式
convert wallet-icon.svg -resize 512x512 icon.icns
```

#### 方法 4：使用 Node.js + sharp

```bash
# 安装 sharp
pnpm add -D sharp

# 运行生成脚本
node scripts/generate-wallet-icons.js
```

### 图标设计说明

- **颜色**：Apple Blue (#007AFF)
- **风格**：简洁、现代、扁平化
- **元素**：钱包主体 + 卡片 + 芯片
- **尺寸**：128x128 基础尺寸，可缩放

## 📚 参考文档

- [Tauri 构建文档](https://v2.tauri.app/guides/building/)
- [Android 构建指南](https://v2.tauri.app/guides/building/android/)
- [Windows 构建指南](https://v2.tauri.app/guides/building/windows/)
