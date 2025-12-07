# 扫描器架构设计

## 架构概述

采用**策略模式**和**工厂模式**，将扫描逻辑分层，便于单元测试和维护。

## 目录结构

```
scanner/
├── types.ts          # 类型定义（IScanner 接口、Platform 类型）
├── platform.ts       # 平台检测工具
├── web-scanner.ts    # Web API 扫描器实现（桌面端）
├── native-scanner.ts # 原生扫描器实现（移动端）
├── factory.ts        # 扫描器工厂
└── index.ts          # 模块导出
```

## 核心设计

### 1. 扫描器接口（IScanner）

```typescript
interface IScanner {
  checkPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  scan(options?: ScanOptions): Promise<string>;
  cancel?(): Promise<void>;
}
```

### 2. 平台检测

- `detectPlatform()`: 检测当前平台
- `isMobilePlatform()`: 判断是否为移动端
- `isDesktopPlatform()`: 判断是否为桌面端

### 3. 扫描器实现

- **WebScanner**: 桌面端实现（getUserMedia + Canvas + jsQR）
- **NativeScanner**: 移动端实现（Tauri barcode-scanner 插件）

### 4. 工厂模式

- `createScanner(platform)`: 根据平台创建扫描器
- `createScannerForCurrentPlatform()`: 自动检测平台并创建扫描器

## 使用方式

```typescript
import { createScannerForCurrentPlatform } from './scanner';

// 自动选择扫描器
const scanner = await createScannerForCurrentPlatform();
const content = await scanner.scan({ videoElement, canvasElement });
```

## 单元测试

每个模块都可以独立测试：

- `platform.ts`: 测试平台检测逻辑
- `web-scanner.ts`: Mock DOM API，测试 Web 扫描逻辑
- `native-scanner.ts`: Mock Tauri 插件，测试原生扫描逻辑
- `factory.ts`: 测试工厂创建逻辑
