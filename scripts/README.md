# 图标抓取脚本

## 功能

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
