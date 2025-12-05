# 生产级别改造指南

本项目已经过生产级别的改造，包含完整的测试框架、代码质量工具、错误处理、UX 优化和 CI/CD 流程。

## ✅ 已完成的核心功能

- ✅ **测试框架**: Vitest + React Testing Library（覆盖率目标 70%）
- ✅ **代码质量**: TypeScript 严格模式 + ESLint + Prettier + Git Hooks
- ✅ **错误处理**: ErrorBoundary + 全局错误处理 + 错误国际化
- ✅ **UX 优化**: LoadingState + EmptyState + ErrorState 组件
- ✅ **CI/CD**: GitHub Actions 自动化流程
- ✅ **安全实施**: 系统级加密存储 + 内存加密 + 生物识别支持

## 📦 新增依赖

### 测试相关

- `vitest`: 测试框架
- `@vitest/ui`: 测试 UI
- `@testing-library/react`: React 组件测试工具
- `@testing-library/jest-dom`: DOM 断言
- `@testing-library/user-event`: 用户交互模拟
- `jsdom`: DOM 环境模拟

### 代码质量

- `eslint`: 代码检查
- `@typescript-eslint/eslint-plugin`: TypeScript ESLint 插件
- `@typescript-eslint/parser`: TypeScript ESLint 解析器
- `eslint-plugin-react`: React ESLint 插件
- `eslint-plugin-react-hooks`: React Hooks ESLint 插件
- `eslint-config-prettier`: Prettier 集成
- `prettier`: 代码格式化

### Git Hooks

- `husky`: Git hooks 管理
- `lint-staged`: 暂存文件 lint

## 🎯 新增脚本命令

```bash
# 测试
pnpm test              # 运行测试
pnpm test:ui           # 测试 UI
pnpm test:coverage     # 测试覆盖率
pnpm test:watch        # 监听模式

# 代码质量
pnpm lint              # ESLint 检查
pnpm lint:fix          # ESLint 自动修复
pnpm format            # Prettier 格式化
pnpm format:check      # Prettier 检查
pnpm type-check        # TypeScript 类型检查
pnpm check             # 完整检查（类型+lint+格式）

# 构建
pnpm build:prod       # 生产构建（包含检查）
```

## 📁 关键文件结构

```
.
├── .eslintrc.cjs          # ESLint 配置
├── .prettierrc.json       # Prettier 配置
├── vitest.config.ts       # Vitest 配置
├── .github/workflows/     # CI/CD 配置
├── .husky/                # Git Hooks
├── src/
│   ├── test/              # 测试工具和配置
│   ├── components/common/ # 通用组件（Loading/Empty/Error）
│   └── hooks/             # React Hooks（错误处理等）
```

详细文件结构请查看项目根目录。

## 🔧 配置优化

### TypeScript 配置

- 启用所有严格模式选项
- 提高类型安全性
- 更好的 IDE 支持

### Vite 配置

- 代码分割优化（已存在）
- 生产构建优化（已存在）

### ESLint 规则

- React 最佳实践
- React Hooks 规则
- TypeScript 严格规则
- 代码质量规则

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并查看覆盖率
pnpm test:coverage

# 运行测试并打开 UI
pnpm test:ui

# 监听模式
pnpm test:watch
```

### 测试覆盖率要求

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

详细测试指南请参考 [TESTING.md](./TESTING.md)

## 🔍 代码质量

### ESLint

```bash
# 检查代码
pnpm lint

# 自动修复
pnpm lint:fix
```

### Prettier

```bash
# 格式化代码
pnpm format

# 检查格式
pnpm format:check
```

### TypeScript 类型检查

```bash
pnpm type-check
```

### 完整检查

```bash
pnpm check  # 运行类型检查、lint 和格式检查
```

## 🪝 Git Hooks

项目使用 Husky 和 lint-staged 来确保代码质量：

- **pre-commit**: 自动运行 ESLint 和 Prettier
- **pre-push**: 运行类型检查和测试

## 🚀 CI/CD

GitHub Actions 配置了完整的 CI/CD 流程：

1. **Lint & Type Check**: 代码质量和类型检查
2. **Test**: 运行测试并生成覆盖率报告
3. **Build**: 构建生产版本

## 🛡️ 错误处理

### Error Boundary

使用 `ErrorBoundary` 组件包装应用，捕获组件树中的错误。

### 全局错误处理

- 捕获未处理的 Promise 拒绝
- 捕获全局 JavaScript 错误
- 集成错误监控服务（可扩展）

## 📦 组件

### 通用组件

- `LoadingState`: 加载状态组件
- `EmptyState`: 空状态组件
- `ErrorState`: 错误状态组件
- `ErrorBoundary`: 错误边界组件

## 🎨 UX 优化

### 加载状态

所有异步操作都应该显示加载状态，使用 `LoadingState` 组件。

### 错误处理

使用 `ErrorState` 组件显示错误，并提供重试功能。

### 空状态

使用 `EmptyState` 组件显示空数据状态。

## 📝 代码规范

### 命名规范

- 组件：PascalCase
- 文件：kebab-case
- 变量/函数：camelCase
- 常量：UPPER_SNAKE_CASE

### 类型安全

- 使用 TypeScript 严格模式
- 避免使用 `any`
- 为所有函数添加返回类型

### 组件规范

- 使用函数式组件
- 明确 props 类型（使用 TypeScript interface）
- 使用 React Hooks 管理状态和副作用
- 添加必要的注释和类型注解

## 🔒 安全

### 核心安全原则

1. **助记词加密存储在系统级安全存储**
   - 使用操作系统提供的安全存储机制（Keychain/Keystore）
   - AES-256-GCM 加密 + Argon2id 密码哈希
   - 通过密码解锁导出

2. **内存中助记词加密存储**
   - 使用 Web Crypto API 的 AES-GCM 加密
   - 锁定后立即清除内存中的加密数据
   - 增加从内存转储中提取助记词的难度

3. **前端不存储敏感信息**
   - 助记词不在 localStorage
   - 密码不在任何存储中
   - 敏感信息仅在内存中（临时）

### 安全特性

- **加密算法**:
  - AES-256-GCM：对称加密，256位密钥，认证加密模式
  - Argon2id：密码哈希，内存硬函数，抗暴力破解

- **存储位置**:
  - macOS/iOS: Keychain Services
  - Android: Keystore
  - Windows: Credential Manager
  - Linux: Secret Service API

- **文件权限**:
  - Unix: 600（仅所有者可读写）
  - Windows: ACL 保护

### 安全操作

- 所有敏感操作都有二次确认
- 错误信息不泄露敏感数据
- 使用安全的存储方式
- 自动锁定机制保护钱包（5分钟无活动或应用进入后台）

> 📖 **详细说明**: 关于助记词存储生命周期、创建和删除时机、典型场景分析等，请参考 [MNEMONIC_STORAGE_LIFECYCLE.md](./MNEMONIC_STORAGE_LIFECYCLE.md)

## 📊 性能优化

- 代码分割
- 懒加载
- 虚拟滚动（大数据列表）
- 防抖和节流

## 🚢 部署

### 构建生产版本

```bash
pnpm build:prod  # 包含 lint、类型检查和构建
```

### 预览构建结果

```bash
pnpm preview
```

## 📊 代码质量指标

### 测试覆盖率目标

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

### 代码规范

- ESLint 规则强制执行
- Prettier 自动格式化
- TypeScript 严格类型检查

## 🚀 下一步建议

- **测试覆盖**: 提高测试覆盖率到 80%，添加 E2E 测试
- **性能优化**: 虚拟滚动、懒加载、代码分割
- **可访问性**: ARIA 标签、键盘导航、屏幕阅读器支持
- **监控**: 错误监控（Sentry）、性能监控
- **文档**: API 文档、组件文档、开发指南

详细路线图请参考 [ROADMAP.md](./ROADMAP.md)

## 📚 最佳实践

- ✅ 编写测试：为新功能编写测试
- ✅ 类型安全：充分利用 TypeScript
- ✅ 错误处理：优雅处理所有错误情况
- ✅ 用户体验：提供清晰的反馈和状态
- ✅ 性能：关注性能指标和优化
- ✅ 可访问性：遵循 WCAG 指南
- ✅ 文档：保持代码和文档同步
