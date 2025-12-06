# @offline-wallet/shared

共享代码包，包含跨 App 使用的组件、工具函数和类型定义。

## 目录结构

```
src/
├── components/          # 共享组件
│   ├── AppLayout.tsx   # 应用级布局组件（SafeArea 处理）
│   ├── SplashScreen.tsx # 开屏动画组件
│   ├── QRCodeScanner.tsx # 二维码扫描组件
│   └── index.ts        # 组件导出
├── utils/              # 工具函数
│   ├── barcode-scanner.ts # 二维码扫描工具
│   ├── qrcode.ts       # 二维码相关工具
│   └── index.ts        # 工具函数导出
├── types/              # 类型定义
│   ├── qrcode.ts       # 二维码类型定义
│   └── index.ts        # 类型导出
└── index.ts            # 主入口
```

## 使用方式

### 在 cold-wallet 或 hot-wallet 中使用

```typescript
// 导入组件
import { AppLayout, SplashScreen, QRCodeScanner } from '@offline-wallet/shared/components';

// 导入工具函数
import {
  createAddressQRCode,
  formatAddress,
  loadBarcodeScanner,
} from '@offline-wallet/shared/utils';

// 导入类型
import { QRCodeProtocol, QRCodeType } from '@offline-wallet/shared/types';
```

## 组件说明

### AppLayout

应用级布局组件，统一处理 SafeArea，所有页面自动适配安全区域。

### SplashScreen

开屏动画组件，极简风格，适配苹果设计语言。

### QRCodeScanner

二维码扫描组件，使用 Tauri 2.0 barcode-scanner 插件。

**注意**：当前实现使用 Tauri 2.0 的 barcode-scanner 插件，会打开原生相机界面。
如果需要真正的多 WebView + 透明 Surface 方案（相机画面作为底层，Web 只画遮罩），
需要自定义原生插件。

## 工具函数说明

### barcode-scanner.ts

- `loadBarcodeScanner()`: 加载二维码扫描模块
- `ensureCameraPermission()`: 检查并请求相机权限
- `scanQRCode()`: 扫描二维码（带权限检查）

### qrcode.ts

- `createAddressQRCode(address)`: 生成地址二维码数据
- `formatAddress(address, startLength?, endLength?)`: 格式化地址显示

## 开发规范

1. 所有共享代码必须放在 `packages/shared/src` 目录下
2. 组件必须支持跨 App 使用，不能依赖特定 App 的状态或配置
3. 工具函数应该是纯函数，不依赖外部状态
4. 类型定义应该放在 `types` 目录下
