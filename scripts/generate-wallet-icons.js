#!/usr/bin/env node

/**
 * 生成钱包应用图标
 * 从 SVG 生成不同尺寸的 PNG 图标
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG 模板（钱包图标）
const walletSVG = `<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 钱包主体 -->
  <rect x="20" y="40" width="88" height="64" rx="12" fill="#007AFF"/>
  <rect x="20" y="40" width="88" height="64" rx="12" stroke="#FFFFFF" stroke-width="2" opacity="0.3"/>
  
  <!-- 钱包开口 -->
  <path d="M20 64 L20 40 C20 32 28 24 36 24 L72 24 C80 24 88 32 88 40 L88 64" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.5"/>
  
  <!-- 卡片 -->
  <rect x="32" y="72" width="64" height="24" rx="4" fill="#FFFFFF" opacity="0.9"/>
  
  <!-- 卡片芯片 -->
  <rect x="40" y="80" width="12" height="8" rx="1" fill="#007AFF"/>
  
  <!-- 装饰线条 -->
  <line x1="56" y1="80" x2="88" y2="80" stroke="#007AFF" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <line x1="56" y1="88" x2="80" y2="88" stroke="#007AFF" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
</svg>`;

// 保存 SVG
const iconDir = path.join(__dirname, '../src-tauri/icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// 保存 SVG 作为源文件
fs.writeFileSync(path.join(iconDir, 'wallet-icon.svg'), walletSVG);
console.log('✅ Created wallet-icon.svg');

// 提示用户使用工具转换
console.log('\n📝 Note: To generate PNG icons from SVG, you can:');
console.log('1. Use an online SVG to PNG converter');
console.log('2. Install sharp: npm install sharp');
console.log('3. Use ImageMagick: convert wallet-icon.svg -resize 128x128 icon.png');
console.log('\n💡 For now, you can use the SVG directly or manually convert it.');

