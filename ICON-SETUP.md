# 钱包图标设置指南

## ✅ 已完成的配置

1. **前端 Logo**
   - ✅ SVG 图标已创建：`public/wallet-logo.svg` (32x32)
   - ✅ Favicon 已创建：`public/wallet-icon.svg` (128x128)
   - ✅ HTML title 已更新为："离线钱包 - 安全 · 简单 · 离线"
   - ✅ AppHeader 已更新使用钱包图标

2. **Tauri 应用配置**
   - ✅ 窗口标题已更新为："离线钱包"
   - ✅ SVG 源文件已创建：`src-tauri/icons/wallet-icon.svg`

## 📝 生成 PNG 图标（用于 Tauri 应用）

Tauri 应用需要 PNG 格式的图标。您可以使用以下方法生成：

### 方法 1：使用在线工具（推荐）

1. 访问 [CloudConvert](https://cloudconvert.com/svg-to-png) 或 [Convertio](https://convertio.co/svg-png/)
2. 上传 `src-tauri/icons/wallet-icon.svg`
3. 设置输出尺寸：
   - 32x32 → `32x32.png`
   - 128x128 → `128x128.png`
   - 256x256 → `128x128@2x.png`
   - 512x512 → `icon.png` (主图标)
4. 下载并保存到 `src-tauri/icons/` 目录

### 方法 2：使用 ImageMagick（命令行）

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

### 方法 3：使用 Node.js + sharp

```bash
# 安装 sharp
pnpm add -D sharp

# 运行生成脚本
node scripts/generate-icons-png.js
```

### 方法 4：使用 Tauri CLI

Tauri CLI 可以自动从 SVG 生成图标：

```bash
pnpm tauri icon src-tauri/icons/wallet-icon.svg
```

这会自动生成所有需要的尺寸和格式。

## 🎨 图标设计说明

钱包图标设计特点：
- **颜色**：Apple Blue (#007AFF)
- **风格**：简洁、现代、扁平化
- **元素**：钱包主体 + 卡片 + 芯片
- **尺寸**：128x128 基础尺寸，可缩放

## 📂 文件结构

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

## ✨ 当前状态

- ✅ 前端 Logo 和 Favicon 已配置
- ✅ HTML title 已优化
- ✅ Tauri 窗口标题已更新
- ✅ **Tauri 应用图标已生成**（使用 `pnpm tauri icon` 命令）

## 🎉 图标生成完成

所有 Tauri 应用图标已成功生成：

### 桌面端图标
- ✅ `icon.png` (512x512) - 主图标
- ✅ `32x32.png` - 小图标
- ✅ `128x128.png` - 标准图标
- ✅ `128x128@2x.png` (256x256) - 高分辨率
- ✅ `icon.icns` - macOS 图标
- ✅ `icon.ico` - Windows 图标

### 移动端图标
- ✅ iOS 图标（所有尺寸）
- ✅ Android 图标（所有密度）
- ✅ Windows Store 图标（所有尺寸）

应用现在可以在所有平台上显示自定义钱包图标了！

