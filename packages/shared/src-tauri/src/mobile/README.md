# 移动端插件模块

本模块提供了移动端 Tauri 插件的统一接口和工具函数，包括：

- `tauri-plugin-barcode-scanner` - 二维码扫描
- `tauri-plugin-biometric` - 生物识别（指纹/面容ID）

## 目录结构

```
mobile/
├── mod.rs              # 模块入口，导出所有子模块
├── barcode_scanner.rs  # 二维码扫描类型定义
├── biometric.rs        # 生物识别类型定义
├── commands.rs         # Tauri 命令函数（可选）
├── utils.rs            # 工具函数
└── plugins.rs          # 插件注册辅助函数
```

## 使用方法

### 1. 在应用的 `main.rs` 中注册插件

#### 方法一：使用统一的注册函数（推荐）

```rust
use offline_wallet_shared::mobile::register_mobile_plugins;

fn setup_app() {
    let builder = tauri::Builder::default();

    // 注册 OS 插件（所有平台）
    let builder = builder.plugin(tauri_plugin_os::init());

    // 注册移动端插件（二维码扫描 + 生物识别）
    #[cfg(any(target_os = "android", target_os = "ios"))]
    let builder = register_mobile_plugins(builder);

    builder
        .invoke_handler(tauri::generate_handler![...])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 方法二：单独注册插件

```rust
use offline_wallet_shared::mobile::{register_barcode_scanner, register_biometric};

fn setup_app() {
    let builder = tauri::Builder::default();

    // 仅注册二维码扫描插件
    #[cfg(any(target_os = "android", target_os = "ios"))]
    let builder = register_barcode_scanner(builder);

    // 仅注册生物识别插件
    #[cfg(any(target_os = "android", target_os = "ios"))]
    let builder = register_biometric(builder);

    builder
        .invoke_handler(tauri::generate_handler![...])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 2. 在前端使用插件

#### 二维码扫描

```typescript
import {
  scan,
  checkPermissions,
  requestPermissions,
  Format,
} from '@tauri-apps/plugin-barcode-scanner';

// 检查权限
const hasPermission = (await checkPermissions()) === 'granted';

if (!hasPermission) {
  // 请求权限
  const status = await requestPermissions();
  if (status !== 'granted') {
    throw new Error('相机权限被拒绝');
  }
}

// 开始扫描
const result = await scan({
  windowed: false, // false: 原生全屏 UI, true: 透明窗口 + Web UI
  formats: [Format.QRCode],
  cameraDirection: 'back',
});

console.log('扫描结果:', result.content);
```

#### 生物识别

```typescript
import { check, authenticate, type } from '@tauri-apps/plugin-biometric';

// 检查是否可用
const available = await check();
if (!available) {
  throw new Error('生物识别不可用');
}

// 获取生物识别类型
const biometricType = await type();
console.log('生物识别类型:', biometricType); // 'Fingerprint' | 'Face' | 'Iris' | 'Unknown'

// 执行验证
try {
  await authenticate({
    reason: '请验证身份以解锁钱包',
  });
  console.log('验证成功');
} catch (error) {
  console.error('验证失败:', error);
}
```

### 3. 使用共享的类型定义

```rust
use offline_wallet_shared::mobile::{ScanConfig, BiometricType, BiometricStatus};

// 创建扫描配置
let config = ScanConfig {
    windowed: false,
    formats: vec!["QR_CODE".to_string()],
    camera_direction: Some("back".to_string()),
};

// 使用生物识别类型
let biometric_type = BiometricType::Face;
```

### 4. 使用工具函数

```rust
use offline_wallet_shared::mobile::{default_scan_config, windowed_scan_config, parse_biometric_type};

// 获取默认扫描配置（原生全屏 UI）
let config = default_scan_config();

// 获取窗口模式扫描配置（透明窗口 + Web UI）
let windowed_config = windowed_scan_config();

// 解析生物识别类型字符串
let biometric_type = parse_biometric_type("FaceID"); // 返回 BiometricType::Face
```

## 注意事项

1. **插件注册**：插件必须在应用的 `main.rs` 中注册才能使用
2. **平台限制**：这些插件仅在移动端（iOS/Android）可用
3. **权限配置**：
   - iOS: 需要在 `Info.plist` 中添加 `NSCameraUsageDescription`
   - Android: 需要在 `AndroidManifest.xml` 中添加相机权限
4. **Capabilities 配置**：需要在 `capabilities/mobile.json` 中配置插件权限

## 示例

完整示例请参考：

- `packages/cold-wallet/src-tauri/src/main.rs`
- `packages/hot-wallet/src-tauri/src/main.rs`
