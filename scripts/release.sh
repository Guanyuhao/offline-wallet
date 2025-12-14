#!/bin/bash

# 发布脚本
# 用法：./scripts/release.sh <app> <platform> <version>
# 示例：./scripts/release.sh cold desktop 1.0.0

set -e

APP=$1
PLATFORM=$2
VERSION=$3

if [ -z "$APP" ] || [ -z "$PLATFORM" ] || [ -z "$VERSION" ]; then
  echo "❌ 缺少参数"
  echo ""
  echo "用法：./scripts/release.sh <app> <platform> <version>"
  echo ""
  echo "参数说明："
  echo "  app      : cold 或 hot"
  echo "  platform : desktop 或 mobile"
  echo "  version  : 版本号（例如：1.0.0）"
  echo ""
  echo "示例："
  echo "  ./scripts/release.sh cold desktop 1.0.0"
  echo "  ./scripts/release.sh hot mobile 1.5.0"
  exit 1
fi

# 验证参数
if [ "$APP" != "cold" ] && [ "$APP" != "hot" ]; then
  echo "❌ 错误：app 必须是 'cold' 或 'hot'"
  exit 1
fi

if [ "$PLATFORM" != "desktop" ] && [ "$PLATFORM" != "mobile" ]; then
  echo "❌ 错误：platform 必须是 'desktop' 或 'mobile'"
  exit 1
fi

# 版本号格式验证
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ 错误：版本号格式不正确，应为 x.y.z（例如：1.0.0）"
  exit 1
fi

APP_FULL_NAME="${APP}-wallet"
TAG="${APP}-${PLATFORM}-v${VERSION}"

echo "=========================================="
echo "🚀 准备发布"
echo "=========================================="
echo "应用: ${APP_FULL_NAME}"
echo "平台: ${PLATFORM}"
echo "版本: ${VERSION}"
echo "Tag:  ${TAG}"
echo ""

# 确认
read -p "确认发布？(y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ 取消发布"
  exit 1
fi

echo ""
echo "=========================================="
echo "📝 更新版本号"
echo "=========================================="

# 更新 package.json
PACKAGE_JSON="packages/${APP_FULL_NAME}/package.json"
if [ -f "$PACKAGE_JSON" ]; then
  sed -i.bak "s/\"version\": \".*\"/\"version\": \"${VERSION}\"/" "$PACKAGE_JSON"
  rm "${PACKAGE_JSON}.bak"
  echo "✅ 更新 ${PACKAGE_JSON}"
else
  echo "⚠️  未找到 ${PACKAGE_JSON}"
fi

# 更新 tauri.conf.json
TAURI_CONF="packages/${APP_FULL_NAME}/src-tauri/tauri.conf.json"
if [ -f "$TAURI_CONF" ]; then
  sed -i.bak "s/\"version\": \".*\"/\"version\": \"${VERSION}\"/" "$TAURI_CONF"
  rm "${TAURI_CONF}.bak"
  echo "✅ 更新 ${TAURI_CONF}"
else
  echo "⚠️  未找到 ${TAURI_CONF}"
fi

# 更新 Cargo.toml
CARGO_TOML="packages/${APP_FULL_NAME}/src-tauri/Cargo.toml"
if [ -f "$CARGO_TOML" ]; then
  sed -i.bak "s/^version = \".*\"/version = \"${VERSION}\"/" "$CARGO_TOML"
  rm "${CARGO_TOML}.bak"
  echo "✅ 更新 ${CARGO_TOML}"
else
  echo "⚠️  未找到 ${CARGO_TOML}"
fi

echo ""
echo "=========================================="
echo "💾 提交更改"
echo "=========================================="

git add packages/${APP_FULL_NAME}/
git commit -m "chore: bump ${APP_FULL_NAME} ${PLATFORM} to v${VERSION}"
git push origin main

echo "✅ 已提交版本更新"

echo ""
echo "=========================================="
echo "🏷️  创建并推送 Tag"
echo "=========================================="

git tag -a "${TAG}" -m "Release ${APP_FULL_NAME} ${PLATFORM} v${VERSION}"
git push origin "${TAG}"

echo "✅ 已推送 Tag: ${TAG}"

echo ""
echo "=========================================="
echo "🎉 发布已触发"
echo "=========================================="
echo ""
echo "GitHub Actions 将自动构建并发布"
echo ""
echo "查看构建状态："
echo "  https://github.com/Guanyuhao/offline-wallet/actions"
echo ""
echo "查看发布："
echo "  https://github.com/Guanyuhao/offline-wallet/releases/tag/${TAG}"
echo ""

