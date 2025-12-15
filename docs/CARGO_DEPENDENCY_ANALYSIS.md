# Cargo 依赖配置冗余分析

## 📊 当前依赖重复情况

### 1. **链相关依赖重复** ⚠️ 严重冗余

#### 重复的依赖（在 `cold-wallet` 和 `shared` 中都定义）：

- `bitcoin = "0.32"`
- `ethers = "2.0"`
- `k256 = "0.13"`
- `secp256k1 = "0.29"`
- `ed25519-dalek = "2.1"`
- `bs58 = "0.5"`
- `sha3 = "0.10"`
- `bech32 = "0.11"`
- `kaspa-addresses = "0.15"`
- `bip39 = "2.0"`
- `tiny-hderive = "0.3"`
- `hex = "0.4"`

**问题**：

- `cold-wallet` 依赖 `shared`，这些依赖会被传递，但 `cold-wallet` 自己也在定义
- 可能导致版本不一致或编译时间增加
- `cold-wallet` 有自己的 `chains/` 模块，`shared` 也有 `chains/` 模块，功能重复

### 2. **Tauri 插件重复** ⚠️ 中等冗余

#### `tauri-plugin-os`：

- ✅ `cold-wallet/Cargo.toml` (第21行)
- ✅ `hot-wallet/Cargo.toml` (第22行)
- ✅ `shared/Cargo.toml` (第36行)

#### `tauri-plugin-clipboard-manager`：

- ✅ `hot-wallet/Cargo.toml` (第23行)
- ✅ `shared/Cargo.toml` (第37行)

#### `tauri-plugin-stronghold`：

- ✅ `cold-wallet/Cargo.toml` (第72行)
- ✅ `shared/Cargo.toml` (第40行)

#### `tauri-plugin-barcode-scanner`：

- ✅ `cold-wallet/Cargo.toml` (第89行，移动端)
- ✅ `hot-wallet/Cargo.toml` (第42行，移动端)
- ✅ `shared/Cargo.toml` (第48行，移动端)

#### `tauri-plugin-biometric`：

- ✅ `cold-wallet/Cargo.toml` (第88行，移动端)
- ✅ `shared/Cargo.toml` (第49行，移动端)

**问题**：

- 插件在多个地方定义，但实际使用可能只在 `shared` 中注册
- 如果只在 `shared` 中定义，依赖传递也能正常工作

### 3. **基础工具库重复** ⚠️ 轻微冗余

#### `qrcode`, `image`, `base64`：

- ✅ `cold-wallet/Cargo.toml` (第67-71行)
- ✅ `hot-wallet/Cargo.toml` (第35-39行)
- ✅ `shared/Cargo.toml` (第16-18行，使用 workspace)

**问题**：

- `cold-wallet` 和 `hot-wallet` 直接定义，`shared` 使用 workspace
- 应该统一使用 workspace 依赖

### 4. **加密相关依赖重复** ⚠️ 中等冗余

#### `argon2`, `rand`：

- ✅ `cold-wallet/Cargo.toml` (第64-65行，第55行)
- ✅ `shared/Cargo.toml` (第42-43行)

## 🔧 优化建议

### 方案 1: 完全统一到 shared（推荐）⭐

**原则**：所有共享依赖都定义在 `shared`，应用包只定义自己特有的依赖

#### 优化后的结构：

**`shared/Cargo.toml`** - 包含所有共享依赖：

```toml
[dependencies]
# 基础工具（使用 workspace）
serde = { workspace = true }
serde_json = { workspace = true }
qrcode = { workspace = true }
image = { workspace = true }
base64 = { workspace = true }

# 链相关依赖（统一管理）
bitcoin = { version = "0.32", features = ["rand", "std"] }
ethers = { version = "2.0", features = ["legacy"] }
k256 = { version = "0.13", features = ["ecdsa"] }
secp256k1 = { version = "0.29", features = ["rand", "global-context", "recovery"] }
ed25519-dalek = { version = "2.1", features = ["rand_core"] }
bs58 = "0.5"
sha3 = "0.10"
bech32 = "0.11"
kaspa-addresses = "0.15"
bip39 = "2.0"
tiny-hderive = "0.3"
hex = "0.4"

# Tauri 插件（统一管理）
tauri = { version = "2", features = [] }
tauri-plugin-os = "2"
tauri-plugin-clipboard-manager = "2"
tauri-plugin-stronghold = "2"
argon2 = "0.5"
rand = "0.8"

# 移动端插件
[target.'cfg(any(target_os = "android", target_os = "ios"))'.dependencies]
tauri-plugin-barcode-scanner = "2"
tauri-plugin-biometric = "2"
```

**`cold-wallet/Cargo.toml`** - 只保留冷钱包特有依赖：

```toml
[dependencies]
tauri = { version = "2", features = [] }
offline-wallet-shared = { path = "../../shared/src-tauri" }

# 冷钱包特有依赖
zeroize = "1.7"
sha2 = "0.10"
aes-gcm = "0.10"
tokio = { version = "1", features = ["time"] }
chrono = "0.4"

# 桌面端特有
[target.'cfg(not(any(target_os = "ios", target_os = "android")))'.dependencies]
dirs = "5.0"
keyring = "2.0"
```

**`hot-wallet/Cargo.toml`** - 只保留热钱包特有依赖：

```toml
[dependencies]
tauri = { version = "2", features = [] }
offline-wallet-shared = { path = "../../shared/src-tauri" }

# 热钱包特有依赖
tauri-plugin-opener = "2"
reqwest = { version = "0.12", features = ["json"] }
tokio = { version = "1", features = ["full"] }
```

### 方案 2: 保持现状但统一版本（保守）

如果担心重构风险，可以：

1. 保持当前结构
2. 使用 workspace 统一版本管理
3. 在根 `Cargo.toml` 中定义共享依赖版本

## 📋 具体优化步骤

### 步骤 1: 统一基础依赖到 workspace

在根 `Cargo.toml` 中添加更多 workspace 依赖：

```toml
[workspace.dependencies]
# ... 现有依赖 ...
bitcoin = { version = "0.32", features = ["rand", "std"] }
ethers = { version = "2.0", features = ["legacy"] }
# ... 其他链依赖 ...
```

### 步骤 2: 从 cold-wallet 移除重复依赖

移除已在 `shared` 中定义的依赖，只保留冷钱包特有的：

- `zeroize`, `sha2`, `aes-gcm` - 冷钱包特有，保留
- `tokio`, `chrono` - 冷钱包特有，保留
- 其他链相关依赖 - 移除，使用 `shared` 的

### 步骤 3: 从 hot-wallet 移除重复依赖

移除已在 `shared` 中定义的依赖，只保留热钱包特有的：

- `tauri-plugin-opener` - 热钱包特有，保留
- `reqwest`, `tokio` - 热钱包特有，保留
- 其他依赖 - 移除，使用 `shared` 的

### 步骤 4: 统一 Tauri 插件管理

所有 Tauri 插件都在 `shared` 中定义和管理，应用包通过 `shared` 使用。

## ⚠️ 注意事项

1. **chains 模块重复**：
   - `cold-wallet` 有自己的 `chains/` 实现（包含签名功能）
   - `shared` 也有 `chains/` 实现（主要用于地址验证）
   - 需要评估是否可以合并，或者明确职责分工

2. **插件注册**：
   - 插件依赖可以在 `shared` 中定义
   - 但插件注册可能需要在应用包中完成（因为 Tauri Builder 的类型）

3. **测试**：
   - 重构后需要全面测试 iOS/Android/Desktop 构建
   - 确保依赖传递正常工作

## 📈 预期收益

1. **减少冗余**：消除 ~30% 的重复依赖定义
2. **统一版本**：避免版本不一致问题
3. **简化维护**：依赖更新只需在一个地方修改
4. **加快编译**：减少重复编译（虽然 Cargo 会缓存）

## 🎯 推荐行动

**立即执行**（低风险）：

1. ✅ 统一 `qrcode`, `image`, `base64` 使用 workspace
2. ✅ 统一 Tauri 插件版本管理

**后续优化**（需要测试）：

1. ⚠️ 移除 `cold-wallet` 和 `hot-wallet` 中的重复链依赖
2. ⚠️ 统一插件依赖到 `shared`
