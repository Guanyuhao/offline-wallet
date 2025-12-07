#!/bin/bash

# @Author liyongjie
# 设置代码签名配置
# 
# 此脚本帮助配置 Tauri 代码签名，输出 Base64 编码的私钥

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SIGNING_DIR="$PROJECT_ROOT/signing"

# 支持的应用程序
APPS=("cold-wallet" "hot-wallet")

# 显示指定应用的签名信息
show_signing_info() {
    local app_name=$1
    local key_file="$SIGNING_DIR/${app_name}.key"
    local password_file="$SIGNING_DIR/${app_name}.password.txt"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔐 $app_name 签名配置"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # 检查密钥文件是否存在
    if [ ! -f "$key_file" ]; then
        echo "❌ 未找到 $app_name 密钥文件"
        echo "请先运行: ./scripts/generate-signing-keys.sh"
        return 1
    fi
    
    # 读取密码
    if [ ! -f "$password_file" ]; then
        echo "⚠️  未找到密码文件，密钥可能没有密码保护"
        PASSWORD=""
    else
        PASSWORD=$(cat "$password_file")
    fi
    
    # 读取私钥并转换为 Base64
    echo "📝 生成 Base64 编码的私钥..."
    if [ -z "$PASSWORD" ]; then
        PRIVATE_KEY_BASE64=$(base64 -i "$key_file" | tr -d '\n')
    else
        # 如果密钥有密码，需要先解密（但 Base64 编码时不需要密码）
        PRIVATE_KEY_BASE64=$(base64 -i "$key_file" | tr -d '\n')
    fi
    
    echo ""
    echo "✅ 私钥已转换为 Base64"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "GitHub Secrets 配置："
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    APP_NAME_UPPER=$(echo "$app_name" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    echo "Secret Name: TAURI_PRIVATE_KEY_${APP_NAME_UPPER}"
    echo "Secret Value:"
    echo "$PRIVATE_KEY_BASE64"
    echo ""
    
    if [ -n "$PASSWORD" ]; then
        echo "Secret Name: TAURI_KEY_PASSWORD_${APP_NAME_UPPER}"
        echo "Secret Value:"
        echo "$PASSWORD"
        echo ""
    else
        echo "⚠️  此密钥没有密码，无需设置 TAURI_KEY_PASSWORD"
        echo ""
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    return 0
}

echo "🔐 代码签名配置助手"
echo ""

# 检查签名目录
if [ ! -d "$SIGNING_DIR" ]; then
    echo "❌ 签名目录不存在: $SIGNING_DIR"
    echo "请先运行: ./scripts/generate-signing-keys.sh"
    exit 1
fi

# 如果没有指定应用，显示所有应用的配置
if [ -z "$1" ]; then
    echo "请选择要查看配置的应用："
    echo "1) cold-wallet (冷钱包)"
    echo "2) hot-wallet (热钱包)"
    echo "3) 全部显示"
    echo ""
    read -p "请输入选项 [1/2/3，默认: 3]: " choice
    choice=${choice:-3}
    
    case $choice in
        1)
            show_signing_info "cold-wallet"
            ;;
        2)
            show_signing_info "hot-wallet"
            ;;
        3)
            for app in "${APPS[@]}"; do
                show_signing_info "$app"
            done
            ;;
        *)
            echo "❌ 无效选项"
            exit 1
            ;;
    esac
else
    # 使用命令行参数指定的应用
    show_signing_info "$1"
fi

echo ""
echo "✅ 配置完成！"
echo ""
echo "📝 下一步："
echo "1. 访问 GitHub 仓库: Settings → Secrets and variables → Actions"
echo "2. 添加上述 Secrets"
echo "3. 更新 GitHub Actions workflow 使用对应的 Secrets"
echo ""
