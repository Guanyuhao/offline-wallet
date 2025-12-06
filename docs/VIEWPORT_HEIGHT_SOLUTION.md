# Cursor Rules for Offline Wallet Project

## SafeArea 安全区域处理规范

### 规则说明

在移动端开发中，必须使用 **antd-mobile 的 SafeArea 组件**来处理 iOS 等设备的安全区域（刘海屏、底部指示器等），**禁止**手动使用 CSS 的 `env(safe-area-inset-*)` 变量。

### 架构设计

**重要：SafeArea 已在 App 级别统一处理，所有页面自动适配安全区域。**

项目使用 `AppLayout` 组件在应用级别统一处理 SafeArea，所有页面都会自动适配安全区域，**不需要**在每个页面单独添加 SafeArea。

### 使用方式

#### 1. App 级别统一处理（已实现）

```tsx
// App.tsx
import AppLayout from './components/AppLayout';

function App() {
  return (
    <AppLayout>
      <BrowserRouter>{/* 所有路由页面 */}</BrowserRouter>
    </AppLayout>
  );
}
```

#### 2. AppLayout 组件结构

```tsx
// components/AppLayout.tsx
import { SafeArea } from 'antd-mobile';

export default function AppLayout({ children }) {
  return (
    <div>
      <SafeArea position="top" />
      <div>{children}</div>
      <SafeArea position="bottom" />
    </div>
  );
}
```

### 示例代码

#### ✅ 正确做法（页面组件）

```tsx
// 页面组件不需要手动添加 SafeArea
function MyPage() {
  return (
    <div>
      {/* 页面内容 */}
      {/* SafeArea 已在 AppLayout 中统一处理 */}
    </div>
  );
}
```

#### ❌ 错误做法（禁止）

```tsx
// ❌ 禁止在页面组件中手动添加 SafeArea
function MyPage() {
  return (
    <div>
      <SafeArea position="top" /> {/* 不需要！已在 AppLayout 中处理 */}
      <div>内容</div>
      <SafeArea position="bottom" /> {/* 不需要！已在 AppLayout 中处理 */}
    </div>
  );
}

// ❌ 禁止手动计算安全区域
<div
  style={{
    paddingTop: 'calc(12px + env(safe-area-inset-top))',
    paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
  }}
>
  内容
</div>;
```

### 特殊情况

**全屏组件（如 QRCodeScanner）**：如果组件需要全屏显示并覆盖整个应用，可以在组件内部使用 SafeArea，但需要确保不与 AppLayout 的 SafeArea 冲突。

```tsx
// 全屏组件示例
function FullScreenComponent() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <SafeArea position="top" />
      {/* 全屏内容 */}
      <SafeArea position="bottom" />
    </div>
  );
}
```

### 适用场景

- ✅ **App 级别**：使用 `AppLayout` 统一处理（已实现）
- ✅ **全屏组件**：如扫描页面、全屏表单等，可以在组件内部使用 SafeArea
- ❌ **普通页面**：不需要单独添加 SafeArea，已在 AppLayout 中统一处理

### 参考文档

- [antd-mobile SafeArea 官方文档](https://mobile.ant.design/zh/components/safe-area)

### 注意事项

1. **App 级别统一处理**：所有页面通过 `AppLayout` 自动适配安全区域
2. **页面组件不需要手动添加 SafeArea**：避免重复处理
3. **全屏组件例外**：全屏覆盖的组件可以在内部使用 SafeArea
4. **禁止手动计算**：不要使用 `env(safe-area-inset-*)` CSS 变量
5. 如果发现页面组件中有 SafeArea，应移除（全屏组件除外）

---

## WebView 全屏配置规范

### 规则说明

为了让 WebView 的 HTML 真正占满整个屏幕（含刘海、含导航栏、含软键盘），需要配置三个层面：

### 1. HTML 层：viewport 配置

**必须配置 `viewport-fit=cover`**，让浏览器知道可用区域 = 屏幕：

```html
<meta
  name="viewport"
  content="width=device-width,
               initial-scale=1.0,
               viewport-fit=cover"
/>
<!-- 关键：让浏览器知道可用区域 = 屏幕 -->
```

**状态：** ✅ 已在 `index.html` 中配置

### 2. CSS 层：100vh 配置

**使用 `100vh` 占满屏幕**，不要使用 `100dvh`：

```css
html {
  height: 100vh; /* 使用 100vh 占满屏幕 */
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

body {
  height: 100%; /* 继承 html 的 100vh */
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

#app {
  height: 100%; /* 继承 body 的高度 */
  overflow: hidden;
}
```

**原因：**

- `html` 使用 `100vh` 占满屏幕
- `body` 和 `#app` 使用 `100%` 继承父容器高度
- `100vh` 使用布局视口高度，在 Tauri WebView 中是正确的选择
- `100dvh` 是动态视口高度，在原生 App 的 WebView 中可能导致问题
- SafeArea 组件会自动处理安全区域，无需手动计算

### 3. 原生层：WebView 配置

**Tauri 2.0 会自动处理 WebView 的全屏配置**，无需手动配置。

Tauri 框架会自动：

- 让 WebView 撑满窗口
- 设置 `contentInsetAdjustmentBehavior = .never`（iOS）
- 处理安全区域

**注意：** 如果遇到问题，检查 `tauri.conf.json` 中的 `plugins.webview` 配置。

### 完整示例

#### ✅ HTML 配置（index.html）

```html
<meta
  name="viewport"
  content="width=device-width,
               initial-scale=1.0,
               viewport-fit=cover"
/>
```

#### ✅ CSS 配置（index.css）

```css
html,
body,
#app {
  height: 100vh; /* 使用 100vh */
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

#### ✅ React 组件配置（AppLayout.tsx）

```tsx
<div style={{ height: '100vh', overflow: 'hidden' }}>
  <SafeArea position="top" />
  {children}
  <SafeArea position="bottom" />
</div>
```

### 禁止事项

#### ❌ 不要使用 `100dvh`

```css
/* 错误 */
height: 100dvh; /* 在原生 App WebView 中可能导致问题 */
```

#### ❌ 不要手动计算安全区域

```css
/* 错误 */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
/* 应该使用 SafeArea 组件 */
```
