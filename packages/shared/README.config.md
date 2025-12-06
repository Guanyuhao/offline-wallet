# 共享配置说明

本目录包含项目共享的 TypeScript 和 ESLint 配置文件，用于统一管理所有包的代码规范。

## 文件结构

```
packages/shared/
├── tsconfig.base.json      # TypeScript 基础配置（用于前端代码）
├── tsconfig.node.json      # TypeScript Node.js 配置（用于 vite.config.ts 等）
└── .eslintrc.base.cjs      # ESLint 基础配置
```

## 使用方式

### TypeScript 配置

在各个包的 `tsconfig.json` 中继承共享配置：

```json
{
  "extends": "../shared/tsconfig.base.json",
  "compilerOptions": {
    // 包特定的配置（如 paths）
  },
  "include": ["src"]
}
```

对于 `tsconfig.node.json`（用于 vite.config.ts）：

```json
{
  "extends": "../shared/tsconfig.node.json",
  "compilerOptions": {
    "composite": true
  },
  "include": ["vite.config.ts"]
}
```

### ESLint 配置

根目录的 `.eslintrc.cjs` 继承共享配置：

```javascript
module.exports = {
  root: true,
  extends: ['./packages/shared/.eslintrc.base.cjs'],
};
```

各个包会自动使用根目录的 ESLint 配置。

## 配置说明

### TypeScript 配置特性

- **严格模式**: 启用所有严格类型检查
- **ES2020 目标**: 使用现代 JavaScript 特性
- **React JSX**: 支持 React 17+ 的 JSX 转换
- **模块解析**: 使用 bundler 模式，适合 Vite

### ESLint 配置特性

- **React 支持**: 自动检测 React 版本
- **TypeScript 支持**: 完整的 TypeScript 规则
- **React Hooks**: 强制 Hooks 规则
- **Prettier 集成**: 与 Prettier 配置兼容
- **代码质量**: 强制使用现代 JavaScript 特性

## 修改配置

如需修改配置，请：

1. 修改 `packages/shared/` 下的对应配置文件
2. 所有包会自动继承新的配置
3. 运行 `pnpm typecheck` 和 `pnpm lint` 验证配置

## 注意事项

- 共享配置应该保持通用性，包特定的配置应在各自的配置文件中覆盖
- 修改共享配置会影响所有包，请谨慎操作
- 建议在修改前先测试一个包，确认无误后再提交
