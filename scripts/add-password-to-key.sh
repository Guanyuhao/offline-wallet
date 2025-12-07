#!/bin/bash

# @Author liyongjie
# 为现有密钥添加密码保护
# 
# 此脚本为已存在的无密码密钥添加密码保护

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COLD_WALLET_DIR="$PROJECT_ROOT/packages/cold-wallet/src-tauri"
SIGNING_DIR="$COLD_WALLET_DIR/signing"
KEY_FILE="$SIGNING_DIR/cold-wallet.key"

echo "🔐 为密钥添加密码保护..."
echo ""

# 检查密钥文件是否存在
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ 未找到密钥文件: $KEY_FILE"
    echo "请先运行: ./scripts/generate-signing-keys.sh"
    exit 1
fi

# 检查密钥是否已有密码
if openssl rsa -in "$KEY_FILE" -check -noout -passin pass:"" 2>/dev/null; then
    echo "⚠️  密钥已有密码保护"
    exit 0
fi

# 读取密码
read -sp "请输入新密码: " NEW_PASSWORD
echo ""
read -sp "请再次确认密码: " NEW_PASSWORD_CONFIRM
echo ""

if [ "$NEW_PASSWORD" != "$NEW_PASSWORD_CONFIRM" ]; then
    echo "❌ 密码不匹配，退出"
    exit 1
fi

if [ -z "$NEW_PASSWORD" ]; then
    echo "❌ 密码不能为空"
    exit 1
fi

# 备份原密钥
BACKUP_FILE="${KEY_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$KEY_FILE" "$BACKUP_FILE"
echo "✅ 已备份原密钥到: $BACKUP_FILE"

# 转换为带密码的密钥
echo ""
echo "正在添加密码保护..."
openssl rsa -aes256 -in "$KEY_FILE" -out "$KEY_FILE.encrypted" -passout pass:"$NEW_PASSWORD"

# 替换原密钥
mv "$KEY_FILE.encrypted" "$KEY_FILE"

# 重新生成公钥
openssl rsa -in "$KEY_FILE" -passin pass:"$NEW_PASSWORD" -pubout -out "$SIGNING_DIR/cold-wallet.pub"

# 保存密码提示
echo "$NEW_PASSWORD" > "$SIGNING_DIR/.key_password.txt"
chmod 600 "$SIGNING_DIR/.key_password.txt"

echo ""
echo "✅ 密钥已添加密码保护"
echo ""
echo "📝 下一步："
echo "1. 将密码添加到 GitHub Secrets: TAURI_KEY_PASSWORD"
echo "2. 重新运行: ./scripts/setup-signing.sh 获取 Base64 编码的私钥"
echo ""

