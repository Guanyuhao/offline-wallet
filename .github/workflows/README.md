# GitHub Actions Workflows 配置说明

## 工作流说明

### 1. release.yml - 桌面版构建和发布

**触发条件：**

- 推送到 `main` 分支
- Pull Request 合并到 `main` 分支

**功能：**

- 构建 Windows (x86_64) 桌面版
- 构建 macOS (Intel) 桌面版
- 构建 macOS (Apple Silicon) 桌面版
- 自动创建 GitHub Release 并上传构建产物

**需要的 Secrets：**

- `TAURI_PRIVATE_KEY`: Tauri 代码签名私钥（可选，用于代码签名）
- `TAURI_KEY_PASSWORD`: Tauri 私钥密码（可选）

### 2. mobile-build.yml - 移动端构建

**触发条件：**

- 手动触发（workflow_dispatch）
- 推送到 `main` 分支（仅当相关文件变更时）

**功能：**

- 构建 iOS 应用
- 构建 Android APK

**需要的 Secrets：**

#### iOS 构建：

- `APPLE_CERTIFICATE`: Apple 证书（Base64 编码）
- `APPLE_CERTIFICATE_PASSWORD`: 证书密码
- `APPLE_PROVISIONING_PROFILE`: 配置文件（Base64 编码）
- `APPLE_TEAM_ID`: Apple 开发团队 ID

#### Android 构建：

- `ANDROID_KEYSTORE_BASE64`: Android Keystore（Base64 编码）
- `ANDROID_KEYSTORE_PASSWORD`: Keystore 密码
- `ANDROID_KEY_ALIAS`: Key 别名
- `ANDROID_KEY_PASSWORD`: Key 密码

## 配置 Secrets

1. 访问 GitHub 仓库设置：`Settings` → `Secrets and variables` → `Actions`
2. 点击 `New repository secret`
3. 添加上述所需的 secrets

## 注意事项

1. **代码签名**：桌面版构建的代码签名是可选的，如果不配置 secrets，构建仍会成功但不会签名
2. **移动端构建**：iOS 和 Android 构建需要完整的证书和密钥配置
3. **版本号**：Release 版本号从 `package.json` 的 `version` 字段读取
4. **分支名称**：当前配置使用 `main` 分支，如需修改请更新 workflow 文件中的分支名称
