# 移动端存储位置说明

## 📱 平台存储位置

### iOS (iPhone/iPad)

**存储位置：iOS Keychain Services**

- **物理位置**：设备的安全芯片（Secure Enclave）或加密的 Keychain 数据库
- **路径**：`/private/var/Keychains/keychain-2.db`（加密存储，用户无法直接访问）
- **访问方式**：通过 iOS Keychain Services API
- **安全级别**：
  - 硬件级加密（Secure Enclave）
  - 应用沙盒隔离
  - 需要用户密码/生物识别才能访问
  - 应用卸载后自动清除（如果设置了 `kSecAttrAccessibleWhenUnlocked`）

**存储标识**：

```
Service: offline-wallet-mnemonic
Account: com.offlinewallet
```

### Android

**存储位置：Android Keystore System**

- **物理位置**：
  - Android 6.0+ (API 23+): 硬件安全模块（HSM）或软件 Keystore
  - 使用硬件支持的设备：存储在 TEE（Trusted Execution Environment）或硬件安全模块中
  - 软件实现：存储在 `/data/system/users/0/keystore/`（加密，需要 root 权限才能访问）
- **访问方式**：通过 Android Keystore API
- **安全级别**：
  - 硬件级加密（如果设备支持）
  - 应用沙盒隔离
  - 需要用户密码/生物识别才能访问
  - 应用卸载后自动清除

**存储标识**：

```
Alias: offline-wallet-mnemonic
Namespace: com.offlinewallet
```

## 🔐 存储机制

### 数据加密流程

```
助记词（明文）
    ↓
AES-256-GCM 加密（使用用户密码派生的密钥）
    ↓
Argon2id 密码哈希（用于验证密码）
    ↓
Base64 编码
    ↓
JSON 序列化
    ↓
系统密钥库存储（Keychain/Keystore）
```

### 安全特性

1. **多层加密**
   - 应用层：AES-256-GCM 加密
   - 系统层：Keychain/Keystore 硬件加密

2. **密码保护**
   - 用户密码通过 Argon2id 哈希验证
   - 密码错误无法解密数据

3. **应用隔离**
   - 每个应用只能访问自己的 Keychain/Keystore 条目
   - 其他应用无法读取数据

4. **自动清除**
   - 应用卸载时，Keychain/Keystore 数据自动删除
   - 设备恢复出厂设置时，所有数据清除

## 📂 实际存储位置

### iOS Keychain

**开发/调试时查看**：

```bash
# 需要越狱设备或使用 Xcode 调试
# 通过 Keychain Access.app 查看（仅限开发证书签名的应用）
```

**存储位置**：

- 加密数据库：`/private/var/Keychains/keychain-2.db`
- 访问权限：仅系统进程可访问，应用通过 API 访问

### Android Keystore

**存储位置**：

```
/data/system/users/0/keystore/
├── .masterkey (主密钥)
├── user_0 (用户密钥)
└── 应用密钥条目（加密存储）
```

**访问权限**：

- 需要 root 权限才能直接访问文件系统
- 正常使用通过 Android Keystore API 访问

## 🔍 如何验证存储

### iOS

1. **通过代码验证**：

```rust
let entry = Entry::new("offline-wallet-mnemonic", "com.offlinewallet")?;
let exists = entry.get_password().is_ok();
```

2. **通过 Xcode 调试**：
   - 连接设备到 Xcode
   - 使用 Keychain Access.app（需要开发证书）

### Android

1. **通过代码验证**：

```rust
let entry = Entry::new("offline-wallet-mnemonic", "com.offlinewallet")?;
let exists = entry.get_password().is_ok();
```

2. **通过 ADB 调试**（需要 root）：

```bash
adb shell
su
ls -la /data/system/users/0/keystore/
```

## ⚠️ 重要注意事项

### 数据安全

1. **备份重要性**
   - Keychain/Keystore 数据与应用绑定
   - 应用卸载或设备重置会导致数据丢失
   - **必须备份助记词到安全位置**

2. **设备更换**
   - 更换设备时，需要重新导入助记词
   - Keychain/Keystore 数据无法跨设备迁移

3. **Root/越狱风险**
   - Root/越狱设备安全性降低
   - 建议在未 Root/越狱的设备上使用

### 数据恢复

如果忘记密码或丢失设备：

1. **有助记词备份**：
   - 卸载应用
   - 重新安装应用
   - 使用助记词导入钱包

2. **无助记词备份**：
   - **数据无法恢复**
   - 钱包资产永久丢失

## 📊 存储对比

| 特性       | iOS Keychain               | Android Keystore       |
| ---------- | -------------------------- | ---------------------- |
| 硬件加密   | ✅ Secure Enclave          | ✅ TEE/HSM（如果支持） |
| 应用隔离   | ✅ 沙盒隔离                | ✅ 应用隔离            |
| 生物识别   | ✅ Face ID/Touch ID        | ✅ 指纹/面部识别       |
| 数据持久化 | ✅ 应用卸载前保留          | ✅ 应用卸载前保留      |
| 跨设备同步 | ❌ 不支持                  | ❌ 不支持              |
| 云备份     | ⚠️ iCloud Keychain（可选） | ❌ 不支持              |

## 🔧 技术实现

### Rust keyring Crate

我们使用的 `keyring` crate 会根据平台自动选择存储方式：

```rust
use keyring::Entry;

// iOS: 使用 Keychain Services
// Android: 使用 Android Keystore
let entry = Entry::new("offline-wallet-mnemonic", "com.offlinewallet")?;
entry.set_password(&encrypted_data)?;
```

### 平台差异处理

`keyring` crate 自动处理平台差异，开发者无需关心底层实现：

- **iOS**: 调用 `SecItemAdd` / `SecItemCopyMatching` API
- **Android**: 调用 `KeyStore` / `KeyManager` API
- **macOS**: 使用 Keychain Services（与 iOS 相同）
- **Windows**: 使用 Credential Manager
- **Linux**: 使用 Secret Service API

## 📝 总结

在移动设备上，冷钱包的加密助记词存储在：

- **iOS**: iOS Keychain Services（安全芯片或加密数据库）
- **Android**: Android Keystore System（硬件安全模块或软件 Keystore）

**关键点**：

1. ✅ 数据经过多层加密保护
2. ✅ 存储在系统级安全存储中
3. ✅ 应用卸载后自动清除
4. ⚠️ **必须备份助记词**（数据无法跨设备迁移）
5. ⚠️ 忘记密码且无备份 = 永久丢失
