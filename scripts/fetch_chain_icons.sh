#!/bin/bash
# 快速抓取区块链图标脚本

echo "🚀 开始抓取区块链图标..."

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 python3，请先安装 Python 3"
    exit 1
fi

# 检查 requests 库
if ! python3 -c "import requests" 2>/dev/null; then
    echo "📦 安装 requests 库..."
    pip3 install requests
fi

# 运行 Python 脚本
python3 "$(dirname "$0")/fetch_chain_icons.py"

