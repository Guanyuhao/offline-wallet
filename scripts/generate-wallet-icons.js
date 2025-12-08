#!/usr/bin/env node

/**
 * @Author liyongjie
 * 生成钱包应用图标
 * 从 SVG 生成不同尺寸的 PNG 图标，支持冷钱包和热钱包
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 冷钱包图标 SVG（蓝色/冷色调，离线/安全主题）
const coldWalletSVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景渐变 -->
  <defs>
    <linearGradient id="coldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E3A8A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="coldShine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:0" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- 背景圆角矩形 -->
  <rect width="512" height="512" rx="120" fill="url(#coldGradient)"/>
  
  <!-- 高光效果 -->
  <rect width="512" height="512" rx="120" fill="url(#coldShine)"/>
  
  <!-- 钱包主体（保险箱风格） -->
  <rect x="96" y="160" width="320" height="240" rx="24" fill="#FFFFFF" opacity="0.95" filter="url(#shadow)"/>
  <rect x="96" y="160" width="320" height="240" rx="24" stroke="#1E3A8A" stroke-width="4" opacity="0.2"/>
  
  <!-- 保险箱门 -->
  <rect x="120" y="184" width="272" height="192" rx="16" fill="#EFF6FF"/>
  <rect x="120" y="184" width="272" height="192" rx="16" stroke="#3B82F6" stroke-width="3"/>
  
  <!-- 锁孔 -->
  <circle cx="256" cy="280" r="24" fill="#1E3A8A" opacity="0.8"/>
  <circle cx="256" cy="280" r="16" fill="#3B82F6"/>
  <rect x="252" y="280" width="8" height="20" fill="#1E3A8A"/>
  
  <!-- 装饰线条（表示离线/安全） -->
  <line x1="160" y1="320" x2="352" y2="320" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
  <line x1="160" y1="340" x2="320" y2="340" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
  
  <!-- 离线指示器（WiFi 断开图标） -->
  <g transform="translate(400, 200)">
    <circle cx="0" cy="0" r="20" fill="#EF4444" opacity="0.9"/>
    <path d="M -8 -8 L 8 8 M 8 -8 L -8 8" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
  </g>
  
  <!-- 安全盾牌装饰 -->
  <g transform="translate(112, 200)">
    <path d="M 0 0 L 12 -8 L 24 0 L 24 16 L 12 24 L 0 16 Z" fill="#3B82F6" opacity="0.6"/>
    <path d="M 6 4 L 10 8 L 18 0" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;

// 热钱包图标 SVG（红色/暖色调，在线/交易主题）
const hotWalletSVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景渐变 -->
  <defs>
    <linearGradient id="hotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DC2626;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F97316;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="hotShine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:0" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- 背景圆角矩形 -->
  <rect width="512" height="512" rx="120" fill="url(#hotGradient)"/>
  
  <!-- 高光效果 -->
  <rect width="512" height="512" rx="120" fill="url(#hotShine)"/>
  
  <!-- 钱包主体（现代钱包风格） -->
  <rect x="96" y="160" width="320" height="240" rx="24" fill="#FFFFFF" opacity="0.95" filter="url(#shadow)"/>
  <rect x="96" y="160" width="320" height="240" rx="24" stroke="#DC2626" stroke-width="4" opacity="0.2"/>
  
  <!-- 钱包开口 -->
  <path d="M 96 200 Q 96 180 116 180 L 396 180 Q 416 180 416 200 L 416 400 Q 416 420 396 420 L 116 420 Q 96 420 96 400 Z" fill="#FEF2F2"/>
  <path d="M 96 200 Q 96 180 116 180 L 396 180 Q 416 180 416 200" stroke="#DC2626" stroke-width="4" stroke-linecap="round"/>
  
  <!-- 卡片 -->
  <rect x="128" y="240" width="256" height="120" rx="12" fill="#FFFFFF" opacity="0.9"/>
  <rect x="128" y="240" width="256" height="120" rx="12" stroke="#F97316" stroke-width="2" opacity="0.5"/>
  
  <!-- 卡片芯片 -->
  <rect x="152" y="280" width="48" height="32" rx="4" fill="#F97316"/>
  <rect x="156" y="284" width="40" height="24" rx="2" fill="#DC2626"/>
  
  <!-- 卡片线条 -->
  <line x1="216" y1="280" x2="360" y2="280" stroke="#F97316" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <line x1="216" y1="300" x2="344" y2="300" stroke="#F97316" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
  <line x1="216" y1="320" x2="328" y2="320" stroke="#F97316" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
  
  <!-- 在线指示器（WiFi 图标） -->
  <g transform="translate(400, 200)">
    <circle cx="0" cy="0" r="20" fill="#10B981" opacity="0.9"/>
    <path d="M -8 -4 Q 0 -12 8 -4 M -12 -8 Q 0 -16 12 -8 M -8 -4 Q 0 -8 8 -4" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  </g>
  
  <!-- 交易箭头装饰 -->
  <g transform="translate(112, 200)">
    <circle cx="12" cy="12" r="16" fill="#F97316" opacity="0.6"/>
    <path d="M 6 12 L 12 6 L 18 12 M 12 6 L 12 18" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
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
    { filename: 'AppIcon-20x20@2x.png', size: 40 },   // 20x20@2x
    { filename: 'AppIcon-20x20@3x.png', size: 60 },   // 20x20@3x
    { filename: 'AppIcon-29x29@2x-1.png', size: 58 }, // 29x29@2x
    { filename: 'AppIcon-29x29@2x.png', size: 58 },   // 29x29@2x (iPad)
    { filename: 'AppIcon-29x29@3x.png', size: 87 },  // 29x29@3x
    { filename: 'AppIcon-40x40@2x.png', size: 80 },  // 40x40@2x
    { filename: 'AppIcon-40x40@3x.png', size: 120 }, // 40x40@3x
    { filename: 'AppIcon-60x60@2x.png', size: 120 }, // 60x60@2x
    { filename: 'AppIcon-60x60@3x.png', size: 180 },  // 60x60@3x
    // iPad
    { filename: 'AppIcon-20x20@1x.png', size: 20 },   // 20x20@1x
    { filename: 'AppIcon-20x20@2x-1.png', size: 40 },  // 20x20@2x
    { filename: 'AppIcon-29x29@1x.png', size: 29 },   // 29x29@1x
    { filename: 'AppIcon-40x40@1x.png', size: 40 },   // 40x40@1x
    { filename: 'AppIcon-40x40@2x-1.png', size: 80 },  // 40x40@2x
    { filename: 'AppIcon-76x76@1x.png', size: 76 },   // 76x76@1x
    { filename: 'AppIcon-76x76@2x.png', size: 152 },  // 76x76@2x
    { filename: 'AppIcon-83.5x83.5@2x.png', size: 167 }, // 83.5x83.5@2x
    // Marketing
    { filename: 'AppIcon-512@2x.png', size: 1024 },   // 1024x1024
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
    await generateIOSIcons('cold', coldWalletSVG, rootDir);
    await generateIOSAssetsIcons('cold', coldWalletSVG, rootDir);
    await generateAndroidIcons('cold', coldWalletSVG, rootDir);
    
    // 生成热钱包图标
    await generateIcons('hot', hotWalletSVG, hotWalletIconDir);
    await generateIOSIcons('hot', hotWalletSVG, rootDir);
    await generateIOSAssetsIcons('hot', hotWalletSVG, rootDir);
    await generateAndroidIcons('hot', hotWalletSVG, rootDir);

    console.log('\n✨ 所有图标生成完成！');
    console.log('\n📂 图标位置:');
    console.log(`   冷钱包: ${coldWalletIconDir}`);
    console.log(`   热钱包: ${hotWalletIconDir}`);
    console.log('\n💡 提示:');
    console.log('   - iOS 图标已自动生成到 gen/apple/Assets.xcassets/AppIcon.appiconset/');
    console.log('   - Android 图标已自动生成到 gen/android/app/src/main/res/mipmap-*/');
    console.log('   - .icns 文件已生成，可用于 macOS');
    console.log('   - .ico 文件已生成，可直接用于 Windows');
    
  } catch (error) {
    console.error('\n❌ 生成图标时出错:', error);
    process.exit(1);
  }
}

main();
