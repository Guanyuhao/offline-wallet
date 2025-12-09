#!/usr/bin/env node

/**
 * @Author liyongjie
 * 生成钱包应用图标
 * 从 SVG 生成不同尺寸的 PNG 图标，支持冷钱包和热钱包
 * 支持深色/浅色主题适配
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 冷钱包图标 SVG（蓝色/冷色调，离线/安全主题 - 简约现代风格）
const coldWalletSVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="coldBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E40AF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="512" height="512" rx="112" fill="url(#coldBg)"/>
  
  <!-- 盾牌外框 -->
  <path d="M256 80 L400 140 L400 280 Q400 380 256 440 Q112 380 112 280 L112 140 Z" 
        fill="none" stroke="#FFFFFF" stroke-width="24" stroke-linejoin="round" opacity="0.9"/>
  
  <!-- 锁图标 -->
  <rect x="196" y="240" width="120" height="100" rx="16" fill="#FFFFFF" opacity="0.95"/>
  <path d="M216 240 L216 200 Q216 160 256 160 Q296 160 296 200 L296 240" 
        fill="none" stroke="#FFFFFF" stroke-width="20" stroke-linecap="round" opacity="0.95"/>
  <circle cx="256" cy="290" r="16" fill="#1E40AF"/>
  <rect x="250" y="290" width="12" height="28" rx="4" fill="#1E40AF"/>
  
  <!-- 离线标识 (断开的圆) -->
  <circle cx="400" cy="112" r="36" fill="#EF4444" opacity="0.95"/>
  <path d="M384 96 L416 128 M416 96 L384 128" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
</svg>`;

// 热钱包图标 SVG（橙红色/暖色调，在线/交易主题 - 简约现代风格）
const hotWalletSVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hotBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DC2626;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F97316;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="512" height="512" rx="112" fill="url(#hotBg)"/>
  
  <!-- 钱包外形 -->
  <rect x="96" y="160" width="320" height="220" rx="32" fill="#FFFFFF" opacity="0.95"/>
  
  <!-- 钱包折叠处 -->
  <path d="M96 200 L416 200" stroke="#DC2626" stroke-width="8" opacity="0.3"/>
  
  <!-- 卡片芯片 -->
  <rect x="136" y="240" width="64" height="48" rx="8" fill="#F97316" opacity="0.9"/>
  <rect x="144" y="248" width="48" height="32" rx="4" fill="#DC2626"/>
  <line x1="156" y1="256" x2="180" y2="256" stroke="#FFFFFF" stroke-width="2" opacity="0.6"/>
  <line x1="156" y1="264" x2="180" y2="264" stroke="#FFFFFF" stroke-width="2" opacity="0.6"/>
  <line x1="156" y1="272" x2="180" y2="272" stroke="#FFFFFF" stroke-width="2" opacity="0.6"/>
  
  <!-- 交易线条 -->
  <line x1="224" y1="260" x2="376" y2="260" stroke="#F97316" stroke-width="12" stroke-linecap="round" opacity="0.4"/>
  <line x1="224" y1="300" x2="340" y2="300" stroke="#F97316" stroke-width="12" stroke-linecap="round" opacity="0.3"/>
  <line x1="224" y1="340" x2="300" y2="340" stroke="#F97316" stroke-width="12" stroke-linecap="round" opacity="0.2"/>
  
  <!-- 在线标识 (WiFi) -->
  <circle cx="400" cy="112" r="36" fill="#10B981" opacity="0.95"/>
  <path d="M380 120 Q400 100 420 120" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" fill="none"/>
  <path d="M388 112 Q400 100 412 112" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" fill="none"/>
  <circle cx="400" cy="120" r="6" fill="#FFFFFF"/>
</svg>`;

/**
 * 将 SVG 转换为 PNG
 * @param {string} svg - SVG 字符串
 * @param {number} size - 输出尺寸
 * @param {string} outputPath - 输出路径
 * @param {boolean} removeAlpha - 是否移除透明通道（iOS 营销图标需要）
 */
async function svgToPng(svg, size, outputPath, removeAlpha = false) {
  const buffer = Buffer.from(svg);
  let sharpInstance = sharp(buffer).resize(size, size, {
    fit: 'contain',
    background: removeAlpha ? { r: 255, g: 255, b: 255, alpha: 1 } : { r: 0, g: 0, b: 0, alpha: 0 }
  });
  
  // 如果要求移除透明通道，使用 flatten 确保不透明
  if (removeAlpha) {
    sharpInstance = sharpInstance.flatten({ background: { r: 255, g: 255, b: 255 } });
  }
  
  await sharpInstance.png().toFile(outputPath);
}

/**
 * 生成所有尺寸的图标
 */
async function generateIcons(walletType, svg, iconDir) {
  const sizes = [
    { name: '32x32.png', size: 32 },
    { name: '128x128.png', size: 128 },
    { name: '128x128@2x.png', size: 256 },
    { name: 'icon.png', size: 512 }
  ];

  console.log(`\n🎨 生成 ${walletType} 钱包图标...`);
  
  // 确保目录存在
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }

  // 保存 SVG 源文件
  const svgPath = path.join(iconDir, `${walletType}-icon.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`  ✅ 保存 SVG: ${svgPath}`);

  // 生成所有尺寸的 PNG
  for (const { name, size } of sizes) {
    const outputPath = path.join(iconDir, name);
    await svgToPng(svg, size, outputPath);
    console.log(`  ✅ 生成 ${name} (${size}x${size})`);
  }

  // 生成 macOS icon.icns
  const tempIcnsDir = path.join(iconDir, 'icon.iconset');
  if (!fs.existsSync(tempIcnsDir)) {
    fs.mkdirSync(tempIcnsDir, { recursive: true });
  }
  
  // 生成 icns 所需的各种尺寸
  const icnsSizes = [16, 32, 64, 128, 256, 512, 1024];
  for (const size of icnsSizes) {
    const size2x = size * 2;
    const png1x = path.join(tempIcnsDir, `icon_${size}x${size}.png`);
    const png2x = path.join(tempIcnsDir, `icon_${size}x${size}@2x.png`);
    await svgToPng(svg, size, png1x);
    await svgToPng(svg, size2x, png2x);
  }
  
  // 尝试自动生成 .icns 文件（macOS 需要）
  const icnsPath = path.join(iconDir, 'icon.icns');
  try {
    const { execSync } = await import('child_process');
    execSync(`iconutil -c icns "${tempIcnsDir}" -o "${icnsPath}"`, { stdio: 'ignore' });
    console.log(`  ✅ 生成 icon.icns`);
    // 清理临时目录
    fs.rmSync(tempIcnsDir, { recursive: true, force: true });
  } catch (error) {
    console.log(`  ⚠️  无法自动生成 icon.icns (需要 macOS)`);
    console.log(`  💡 提示: 手动运行 'iconutil -c icns "${tempIcnsDir}" -o "${icnsPath}"'`);
  }

  // 生成 Windows icon.ico（512x512 PNG 作为基础）
  const icoPath = path.join(iconDir, 'icon.ico');
  await svgToPng(svg, 512, icoPath);
  console.log(`  ✅ 生成 icon.ico (512x512)`);
}

/**
 * 生成 public 目录下的 icon（用于 Web/SplashScreen）
 */
async function generatePublicIcon(walletType, svg, rootDir) {
  const publicDir = path.join(rootDir, 'packages', `${walletType}-wallet`, 'public');
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log(`\n🌐 生成 ${walletType} 钱包 public 图标...`);
  
  const iconPath = path.join(publicDir, 'icon.png');
  await svgToPng(svg, 512, iconPath);
  console.log(`  ✅ 生成 public/icon.png (512x512)`);
}

/**
 * 生成 iOS AppIcon 所需的所有尺寸
 */
async function generateIOSIcons(walletType, svg, rootDir) {
  // iOS AppIcon 目录路径
  const iosAppIconDir = path.join(
    rootDir,
    'packages',
    `${walletType}-wallet`,
    'src-tauri',
    'gen',
    'apple',
    'Assets.xcassets',
    'AppIcon.appiconset'
  );

  // 如果目录不存在，跳过（iOS 项目可能还未初始化）
  if (!fs.existsSync(path.dirname(iosAppIconDir))) {
    console.log(`  ⚠️  iOS 项目目录不存在，跳过 iOS 图标生成`);
    return;
  }

  console.log(`\n📱 生成 ${walletType} 钱包 iOS 图标...`);

  // 确保目录存在
  if (!fs.existsSync(iosAppIconDir)) {
    fs.mkdirSync(iosAppIconDir, { recursive: true });
  }

  // iOS 所需的图标尺寸配置
  const iosIcons = [
    // iPhone
    { filename: 'AppIcon-20x20@2x.png', size: 40 },
    { filename: 'AppIcon-20x20@3x.png', size: 60 },
    { filename: 'AppIcon-29x29@2x-1.png', size: 58 },
    { filename: 'AppIcon-29x29@2x.png', size: 58 },
    { filename: 'AppIcon-29x29@3x.png', size: 87 },
    { filename: 'AppIcon-40x40@2x.png', size: 80 },
    { filename: 'AppIcon-40x40@3x.png', size: 120 },
    { filename: 'AppIcon-60x60@2x.png', size: 120 },
    { filename: 'AppIcon-60x60@3x.png', size: 180 },
    // iPad
    { filename: 'AppIcon-20x20@1x.png', size: 20 },
    { filename: 'AppIcon-20x20@2x-1.png', size: 40 },
    { filename: 'AppIcon-29x29@1x.png', size: 29 },
    { filename: 'AppIcon-40x40@1x.png', size: 40 },
    { filename: 'AppIcon-40x40@2x-1.png', size: 80 },
    { filename: 'AppIcon-76x76@1x.png', size: 76 },
    { filename: 'AppIcon-76x76@2x.png', size: 152 },
    { filename: 'AppIcon-83.5x83.5@2x.png', size: 167 },
    // Marketing
    { filename: 'AppIcon-512@2x.png', size: 1024 },
  ];

  // 生成所有 iOS 图标
  for (const { filename, size } of iosIcons) {
    const outputPath = path.join(iosAppIconDir, filename);
    // iOS 营销图标（1024x1024）不能包含透明通道
    const isMarketingIcon = filename === 'AppIcon-512@2x.png' && size === 1024;
    await svgToPng(svg, size, outputPath, isMarketingIcon);
    console.log(`  ✅ 生成 ${filename} (${size}x${size})${isMarketingIcon ? ' [无透明通道]' : ''}`);
  }

  console.log(`  ✅ iOS 图标生成完成: ${iosAppIconDir}`);
}

/**
 * 生成 iOS assets/icons 目录下的图标（用于应用内资源）
 */
async function generateIOSAssetsIcons(walletType, svg, rootDir) {
  // iOS assets/icons 目录路径
  const iosAssetsIconsDir = path.join(
    rootDir,
    'packages',
    `${walletType}-wallet`,
    'src-tauri',
    'gen',
    'apple',
    'assets',
    'icons'
  );

  // 如果目录不存在，跳过
  if (!fs.existsSync(path.dirname(iosAssetsIconsDir))) {
    console.log(`  ⚠️  iOS assets 目录不存在，跳过 assets/icons 图标生成`);
    return;
  }

  console.log(`\n📦 生成 ${walletType} 钱包 iOS assets/icons...`);

  // 确保目录存在
  if (!fs.existsSync(iosAssetsIconsDir)) {
    fs.mkdirSync(iosAssetsIconsDir, { recursive: true });
  }

  // 生成 assets/icons 所需的图标尺寸
  const assetsIcons = [
    { filename: 'icon.png', size: 512 },
    { filename: '128x128.png', size: 128 },
  ];

  // 生成所有 assets/icons 图标
  for (const { filename, size } of assetsIcons) {
    const outputPath = path.join(iosAssetsIconsDir, filename);
    await svgToPng(svg, size, outputPath);
    console.log(`  ✅ 生成 ${filename} (${size}x${size})`);
  }

  console.log(`  ✅ iOS assets/icons 图标生成完成: ${iosAssetsIconsDir}`);
}

/**
 * 生成 Android 图标
 */
async function generateAndroidIcons(walletType, svg, rootDir) {
  // Android res 目录路径
  const androidResDir = path.join(
    rootDir,
    'packages',
    `${walletType}-wallet`,
    'src-tauri',
    'gen',
    'android',
    'app',
    'src',
    'main',
    'res'
  );

  // 如果目录不存在，跳过（Android 项目可能还未初始化）
  if (!fs.existsSync(path.dirname(androidResDir))) {
    console.log(`  ⚠️  Android 项目目录不存在，跳过 Android 图标生成`);
    return;
  }

  console.log(`\n🤖 生成 ${walletType} 钱包 Android 图标...`);

  // Android 图标尺寸配置
  const androidSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
  };

  // 为每个密度生成图标
  for (const [density, size] of Object.entries(androidSizes)) {
    const densityDir = path.join(androidResDir, density);
    
    // 确保目录存在
    if (!fs.existsSync(densityDir)) {
      fs.mkdirSync(densityDir, { recursive: true });
    }

    console.log(`  📱 生成 ${density} (${size}x${size})...`);

    // 将 SVG 字符串转换为 Buffer
    const svgBuffer = Buffer.from(svg);

    // 生成 ic_launcher.png (主图标)
    const launcherPath = path.join(densityDir, 'ic_launcher.png');
    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(launcherPath);
    console.log(`    ✅ ic_launcher.png`);

    // 生成 ic_launcher_round.png (圆形图标)
    const launcherRoundPath = path.join(densityDir, 'ic_launcher_round.png');
    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(launcherRoundPath);
    console.log(`    ✅ ic_launcher_round.png`);

    // 生成 ic_launcher_foreground.png (前景图标)
    const foregroundPath = path.join(densityDir, 'ic_launcher_foreground.png');
    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(foregroundPath);
    console.log(`    ✅ ic_launcher_foreground.png`);
  }

  console.log(`  ✅ Android 图标生成完成: ${androidResDir}`);
}

/**
 * 主函数
 */
async function main() {
  const rootDir = path.join(__dirname, '..');
  
  // 冷钱包图标目录
  const coldWalletIconDir = path.join(rootDir, 'packages/cold-wallet/src-tauri/icons');
  
  // 热钱包图标目录
  const hotWalletIconDir = path.join(rootDir, 'packages/hot-wallet/src-tauri/icons');

  console.log('🚀 开始生成钱包图标...\n');
  console.log(`📁 根目录: ${rootDir}`);

  try {
    // 生成冷钱包图标
    await generateIcons('cold', coldWalletSVG, coldWalletIconDir);
    await generatePublicIcon('cold', coldWalletSVG, rootDir);
    await generateIOSIcons('cold', coldWalletSVG, rootDir);
    await generateIOSAssetsIcons('cold', coldWalletSVG, rootDir);
    await generateAndroidIcons('cold', coldWalletSVG, rootDir);
    
    // 生成热钱包图标
    await generateIcons('hot', hotWalletSVG, hotWalletIconDir);
    await generatePublicIcon('hot', hotWalletSVG, rootDir);
    await generateIOSIcons('hot', hotWalletSVG, rootDir);
    await generateIOSAssetsIcons('hot', hotWalletSVG, rootDir);
    await generateAndroidIcons('hot', hotWalletSVG, rootDir);

    console.log('\n✨ 所有图标生成完成！');
    console.log('\n📂 图标位置:');
    console.log(`   冷钱包: ${coldWalletIconDir}`);
    console.log(`   热钱包: ${hotWalletIconDir}`);
    console.log('\n💡 提示:');
    console.log('   - public/icon.png 已更新（用于 SplashScreen）');
    console.log('   - iOS 图标已自动生成到 gen/apple/Assets.xcassets/AppIcon.appiconset/');
    console.log('   - Android 图标已自动生成到 gen/android/app/src/main/res/mipmap-*/');
    console.log('   - .icns 文件已生成，可用于 macOS');
    console.log('   - .ico 文件已生成，可直接用于 Windows');
    console.log('\n🎨 新图标特点:');
    console.log('   - 冷钱包: 蓝色盾牌 + 锁 + 离线标识');
    console.log('   - 热钱包: 橙红色钱包 + 卡片 + 在线标识');
    console.log('   - 简约现代设计，在深色/浅色主题下都清晰可见');
    
  } catch (error) {
    console.error('\n❌ 生成图标时出错:', error);
    process.exit(1);
  }
}

main();
