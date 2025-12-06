#!/bin/bash

# 开发环境启动脚本
# 用法: ./scripts/dev.sh [cold|hot|all]

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
APP=${1:-cold}

echo -e "${BLUE}🚀 启动开发环境...${NC}"

case $APP in
  cold)
    echo -e "${GREEN}启动冷钱包...${NC}"
    pnpm --filter cold-wallet tauri dev
    ;;
  hot)
    echo -e "${GREEN}启动热钱包...${NC}"
    pnpm --filter hot-wallet tauri dev
    ;;
  all)
    echo -e "${GREEN}并行启动所有应用...${NC}"
    pnpm --parallel --filter './packages/*' tauri dev
    ;;
  *)
    echo -e "${YELLOW}用法: ./scripts/dev.sh [cold|hot|all]${NC}"
    echo -e "${YELLOW}默认启动冷钱包${NC}"
    exit 1
    ;;
esac

