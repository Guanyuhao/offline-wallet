# 脚本说明

## 钱包图标生成脚本

### 功能

自动生成冷钱包和热钱包的应用图标，支持多种尺寸和格式（PNG、ICNS、ICO）。

### 使用方法

```bash
# 使用 npm 脚本（推荐）
pnpm generate-icons

# 或直接运行
node scripts/generate-wallet-icons.js
```

### 生成的图标

脚本会为冷钱包和热钱包分别生成以下图标文件：

**桌面平台图标**（位于 `src-tauri/icons/`）：

- `32x32.png` - 小尺寸图标
- `128x128.png` - 标准尺寸图标
- `128x128@2x.png` - 高分辨率图标（256x256）
- `icon.png` - 大尺寸图标（512x512）
- `icon.icns` - macOS 图标文件
- `icon.ico` - Windows 图标文件
- `{cold|hot}-icon.svg` - SVG 源文件

**iOS 图标**（位于 `gen/apple/Assets.xcassets/AppIcon.appiconset/`）：

- 所有 iOS 设备所需的图标尺寸（iPhone、iPad、Marketing）

**Android 图标**（位于 `gen/android/app/src/main/res/mipmap-*/`）：

- `mipmap-mdpi` (48x48)
- `mipmap-hdpi` (72x72)
- `mipmap-xhdpi` (96x96)
- `mipmap-xxhdpi` (144x144)
- `mipmap-xxxhdpi` (192x192)

每个密度包含：

- `ic_launcher.png` - 主图标
- `ic_launcher_round.png` - 圆形图标
- `ic_launcher_foreground.png` - 前景图标

### 图标设计

- **冷钱包图标**：蓝色/冷色调，保险箱风格，带有离线指示器和安全盾牌装饰
- **热钱包图标**：红色/暖色调，现代钱包风格，带有在线指示器和交易箭头装饰

### 输出位置

- **冷钱包图标**：
  - 桌面图标：`packages/cold-wallet/src-tauri/icons/`
  - iOS 图标：`packages/cold-wallet/src-tauri/gen/apple/Assets.xcassets/AppIcon.appiconset/`
  - Android 图标：`packages/cold-wallet/src-tauri/gen/android/app/src/main/res/mipmap-*/`

- **热钱包图标**：
  - 桌面图标：`packages/hot-wallet/src-tauri/icons/`
  - iOS 图标：`packages/hot-wallet/src-tauri/gen/apple/Assets.xcassets/AppIcon.appiconset/`
  - Android 图标：`packages/hot-wallet/src-tauri/gen/android/app/src/main/res/mipmap-*/`

### 注意事项

- 如果 iOS 或 Android 项目目录不存在，脚本会自动跳过相应平台的图标生成
- 首次运行前需要先初始化 iOS/Android 项目（`tauri ios init` 或 `tauri android init`）
- 脚本会自动检测项目目录，只生成已初始化平台的图标

---

## 区块链图标抓取脚本

### 功能

自动从公开 CDN 抓取主流区块链的图标，保存为 PNG 格式供应用使用。

## 使用方法

### 方法 1: 使用 npm 脚本（推荐）

```bash
npm run fetch-icons
```

### 方法 2: 直接运行 Python 脚本

```bash
python3 scripts/fetch_chain_icons.py
```

### 方法 3: 使用 Shell 脚本

```bash
./scripts/fetch_chain_icons.sh
```

## 输出

图标文件保存在 `public/icons/` 目录：

- `eth.png` - Ethereum 图标
- `btc.png` - Bitcoin 图标
- `bnb.png` - BNB Chain 图标
- `sol.png` - Solana 图标
- `tron.png` - Tron 图标
- `manifest.json` - 图标清单文件

## 图标源

脚本会尝试从以下源下载图标（按优先级排序）：

1. CryptoLogos.cc
2. CoinGecko
3. Trust Wallet Assets

如果第一个源失败，会自动尝试下一个源。

## 前端使用

在前端代码中，可以通过以下方式使用图标：

```tsx
<img src="/icons/eth.png" alt="Ethereum" />
```

或者使用动态路径：

```tsx
<img src={`/icons/${chain.toLowerCase()}.png`} alt={chainName} />
```

## 注意事项

- 脚本使用 Python 标准库，无需额外依赖
- 图标会自动覆盖已存在的文件
- 如果所有源都失败，会跳过该链的图标下载
