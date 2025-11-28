#!/usr/bin/env python3
"""
抓取区块链图标脚本
从公开 API 或 CDN 获取主流区块链的图标，保存为 PNG 格式
"""

import os
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import json

# 区块链图标源配置
CHAIN_ICONS = {
    'ETH': {
        'name': 'Ethereum',
        'urls': [
            'https://cryptologos.cc/logos/ethereum-eth-logo.png',
            'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        ],
        'color': '#627EEA'
    },
    'BTC': {
        'name': 'Bitcoin',
        'urls': [
            'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
            'https://assets.coingecko.com/coins/images/coins/images/1/small/bitcoin.png',
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
        ],
        'color': '#F7931A'
    },
    'BNB': {
        'name': 'BNB Chain',
        'urls': [
            'https://cryptologos.cc/logos/bnb-bnb-logo.png',
            'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
        ],
        'color': '#F3BA2F'
    },
    'SOL': {
        'name': 'Solana',
        'urls': [
            'https://cryptologos.cc/logos/solana-sol-logo.png',
            'https://assets.coingecko.com/coins/images/4128/small/solana.png',
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
        ],
        'color': '#9945FF'
    },
    'TRON': {
        'name': 'Tron',
        'urls': [
            'https://cryptologos.cc/logos/tron-trx-logo.png',
            'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png',
        ],
        'color': '#FF0018'
    },
}

# 输出目录
OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'icons'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def download_image(url: str, output_path: Path) -> bool:
    """下载图片"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        req = Request(url, headers=headers)
        
        with urlopen(req, timeout=10) as response:
            # 检查是否是图片
            content_type = response.headers.get('Content-Type', '')
            if not content_type.startswith('image/'):
                print(f"  ⚠️  警告: {url} 不是图片类型 ({content_type})")
                return False
            
            # 读取并保存图片
            image_data = response.read()
            with open(output_path, 'wb') as f:
                f.write(image_data)
            
            file_size = len(image_data)
            print(f"  ✅ 成功: {file_size} bytes -> {output_path.name}")
            return True
    except (URLError, HTTPError, Exception) as e:
        print(f"  ❌ 失败: {e}")
        return False

def fetch_chain_icon(chain_code: str, config: dict):
    """抓取单个链的图标"""
    print(f"\n📦 抓取 {config['name']} ({chain_code}) 图标...")
    
    icon_path = OUTPUT_DIR / f'{chain_code.lower()}.png'
    
    # 如果文件已存在，自动覆盖（非交互模式）
    if icon_path.exists():
        print(f"  ℹ️  文件已存在: {icon_path.name}，将覆盖")
    
    # 尝试从多个源下载
    success = False
    for i, url in enumerate(config['urls'], 1):
        print(f"  尝试源 {i}/{len(config['urls'])}: {url}")
        if download_image(url, icon_path):
            success = True
            break
    
    if not success:
        print(f"  ⚠️  所有源都失败，跳过 {chain_code}")
        return False
    
    return True

def create_icon_manifest():
    """创建图标清单文件"""
    manifest = {
        'chains': {}
    }
    
    for chain_code, config in CHAIN_ICONS.items():
        icon_path = OUTPUT_DIR / f'{chain_code.lower()}.png'
        if icon_path.exists():
            manifest['chains'][chain_code] = {
                'name': config['name'],
                'icon': f'/icons/{chain_code.lower()}.png',
                'color': config['color']
            }
    
    manifest_path = OUTPUT_DIR / 'manifest.json'
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 图标清单已保存: {manifest_path}")

def main():
    """主函数"""
    print("🚀 开始抓取区块链图标...")
    print(f"📁 输出目录: {OUTPUT_DIR}")
    
    success_count = 0
    for chain_code, config in CHAIN_ICONS.items():
        if fetch_chain_icon(chain_code, config):
            success_count += 1
    
    print(f"\n✨ 完成! 成功抓取 {success_count}/{len(CHAIN_ICONS)} 个图标")
    
    # 创建清单文件
    create_icon_manifest()
    
    print(f"\n📂 图标保存在: {OUTPUT_DIR}")
    print("💡 提示: 可以在前端使用这些图标，路径为 /icons/{chain}.png")

if __name__ == '__main__':
    main()

