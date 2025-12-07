#!/bin/bash

# @Author liyongjie
# 生成桌面版代码签名密钥
# 
# 此脚本会为不同应用生成独立的代码签名密钥
# 支持：cold-wallet（冷钱包）、hot-wallet（热钱包）

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SIGNING_DIR="$PROJECT_ROOT/signing"

# 支持的应用程序
APPS=("cold-wallet" "hot-wallet")

# 生成随机密码（32字符，包含字母、数字、特殊字符）
generate_random_password() {
    openssl rand -base64 24 | tr -d "=+/" | cut -c1-32
}

# 为指定应用生成密钥
generate_keys_for_app() {
    local app_name=$1
    local key_file="$SIGNING_DIR/${app_name}.key"
    local pub_file="$SIGNING_DIR/${app_name}.pub"
    local password_file="$SIGNING_DIR/${app_name}.password.txt"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 生成 $app_name 代码签名密钥..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # 检查密钥是否已存在
    if [ -f "$key_file" ]; then
        echo "⚠️  $app_name 密钥已存在，跳过生成"
        echo "   密钥文件: $key_file"
        if [ -f "$password_file" ]; then
            echo "   密码文件: $password_file"
        fi
        return 0
    fi
    
    # 生成随机密码
    local password=$(generate_random_password)
    echo "🔐 已生成随机密码（32字符）"
    
    # 使用 OpenSSL 生成带密码保护的密钥对
    echo "正在生成密钥对..."
    openssl genrsa -aes256 -passout pass:"$password" -out "$key_file" 2048
    openssl rsa -in "$key_file" -passin pass:"$password" -pubout -out "$pub_file"
    
    # 保存密码到文件
    echo "$password" > "$password_file"
    chmod 600 "$password_file"
    
    echo ""
    echo "✅ $app_name 密钥对已生成"
    echo "   私钥: $key_file"
    echo "   公钥: $pub_file"
    echo "   密码: $password_file"
    echo ""
    echo "🔒 密码信息："
    echo "   $password"
    echo ""
    echo "⚠️  请妥善保管密码，并添加到 GitHub Secrets:"
    APP_NAME_UPPER=$(echo "$app_name" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    echo "   TAURI_PRIVATE_KEY_${APP_NAME_UPPER} (Base64 私钥)"
    echo "   TAURI_KEY_PASSWORD_${APP_NAME_UPPER} (密钥密码)"
    echo ""
}

echo "🔐 开始生成代码签名密钥..."
echo ""
echo "签名密钥将统一保存在: $SIGNING_DIR"
echo ""

# 创建签名目录
mkdir -p "$SIGNING_DIR"

# 询问要生成哪些应用的密钥
echo "请选择要生成密钥的应用："
echo "1) cold-wallet (冷钱包)"
echo "2) hot-wallet (热钱包)"
echo "3) 全部生成"
echo ""
read -p "请输入选项 [1/2/3，默认: 3]: " choice
choice=${choice:-3}

case $choice in
    1)
        generate_keys_for_app "cold-wallet"
        ;;
    2)
        generate_keys_for_app "hot-wallet"
        ;;
    3)
        for app in "${APPS[@]}"; do
            generate_keys_for_app "$app"
        done
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 生成完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 签名文件位置: $SIGNING_DIR"
echo ""
ls -lh "$SIGNING_DIR" | grep -v "^total" | grep -v ".gitkeep" || echo "   (空)"
echo ""
echo "🔒 安全提示："
echo "1. 所有密钥文件已添加到 .gitignore"
echo "2. 密码文件权限已设置为 600（仅所有者可读写）"
echo "3. 请妥善保管密码，不要泄露"
echo ""
echo "📝 下一步："
echo "1. 运行: ./scripts/setup-signing.sh [app-name] 获取 Base64 编码的私钥"
echo "2. 将私钥和密码添加到 GitHub Secrets"
echo ""
