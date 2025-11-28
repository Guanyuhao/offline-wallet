# 区块链图标设置指南

## 📦 图标已成功抓取

所有主流区块链的图标已成功抓取并保存在 `public/icons/` 目录：

- ✅ `eth.png` - Ethereum (160 KB)
- ✅ `btc.png` - Bitcoin (87 KB)
- ✅ `bnb.png` - BNB Chain (104 KB)
- ✅ `sol.png` - Solana (123 KB)
- ✅ `tron.png` - Tron (103 KB)

## 🚀 使用方法

### 重新抓取图标

如果需要更新图标，运行：

```bash
npm run fetch-icons
```

或直接运行：

```bash
python3 scripts/fetch_chain_icons.py
```

### 前端使用

图标已经集成到应用中，会在以下位置显示：

1. **链选择器** - 显示每个链的图标
2. **地址徽章** - 显示当前选择链的图标
3. **地址列表** - 显示每个链的图标

## 🎨 图标配置

图标配置在 `src/App.vue` 中的 `chains` 数组：

```typescript
const chains = [
  { 
    value: 'ETH', 
    name: 'Ethereum', 
    icon: '/icons/eth.png',  // PNG 图标路径
    emoji: '🔷',              // 备用 emoji
    color: '#627EEA' 
  },
  // ...
];
```

## 📝 图标源

图标从以下公开 CDN 抓取（按优先级）：

1. **CryptoLogos.cc** - 高质量区块链图标
2. **CoinGecko** - 加密货币数据平台
3. **Trust Wallet Assets** - Trust Wallet 官方资源

如果第一个源失败，脚本会自动尝试下一个源。

## 🔄 更新图标

如果需要更新特定链的图标：

1. 编辑 `scripts/fetch_chain_icons.py`
2. 修改对应链的 `urls` 数组
3. 运行 `npm run fetch-icons`

## 📂 文件结构

```
offline-wallet/
├── public/
│   └── icons/
│       ├── eth.png
│       ├── btc.png
│       ├── bnb.png
│       ├── sol.png
│       ├── tron.png
│       └── manifest.json
└── scripts/
    ├── fetch_chain_icons.py
    ├── fetch_chain_icons.sh
    └── README.md
```

## ✨ 特性

- ✅ 自动多源下载（容错机制）
- ✅ 无需外部依赖（使用 Python 标准库）
- ✅ 自动生成图标清单
- ✅ 支持批量更新
- ✅ 前端自动集成

## 🐛 故障排除

如果图标无法显示：

1. 检查 `public/icons/` 目录是否存在图标文件
2. 检查浏览器控制台是否有 404 错误
3. 确认 Vite 配置正确（`public` 目录会自动服务）
4. 尝试重新运行 `npm run fetch-icons`

