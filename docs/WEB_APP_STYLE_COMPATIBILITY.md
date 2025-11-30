# Web 与 App 样式兼容性指南

## 📋 常见兼容性问题清单

### 1. 视口和布局问题 ✅ 已解决

- ✅ 视口高度问题（100vh 在移动端的表现）
- ✅ 键盘弹起时的布局调整
- ✅ Safe Area 适配（刘海屏、底部安全区域）

**解决方案：** 使用 W3C 标准的 `dvh` 单位和 `visualViewport` API

### 2. 触摸交互问题

#### 问题 1: 点击延迟（300ms 延迟）

**问题原因：**

- 移动端浏览器需要等待 300ms 来判断是单击还是双击
- 导致点击响应延迟，用户体验差

**解决方案：**

```css
/* 禁用双击缩放 */
* {
  touch-action: manipulation;
}

/* 或者更精确的控制 */
button,
a {
  touch-action: manipulation;
}
```

#### 问题 2: 滚动性能

**问题原因：**

- 移动端滚动需要硬件加速
- 滚动时可能触发重排重绘

**解决方案：**

```css
/* 启用硬件加速滚动 */
.scrollable {
  -webkit-overflow-scrolling: touch;
  overflow-scrolling: touch;
  will-change: scroll-position;
  transform: translateZ(0); /* 触发硬件加速 */
}
```

#### 问题 3: 文本选择

**问题原因：**

- 移动端长按会选中文本，影响交互
- 按钮、链接等交互元素不应该被选中

**解决方案：**

```css
/* 禁用文本选择 */
button,
a,
.interactive {
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent; /* 移除点击高亮 */
}

/* 允许文本选择的地方 */
input,
textarea,
.selectable {
  -webkit-user-select: text;
  user-select: text;
}
```

### 3. 输入框问题

#### 问题 1: 输入框缩放

**问题原因：**

- iOS Safari 中，输入框聚焦时如果字体小于 16px，会自动缩放
- 导致页面布局跳动

**解决方案：**

```css
/* 方案 1: 设置最小字体大小 */
input,
textarea,
select {
  font-size: 16px; /* 最小 16px */
}

/* 方案 2: 禁用缩放（已在 viewport meta 中配置） */
/* <meta name="viewport" content="user-scalable=no" /> */
```

#### 问题 2: 输入框样式重置

**问题原因：**

- iOS Safari 和 Android WebView 会应用默认样式
- 导致样式不一致

**解决方案：**

```css
input,
textarea,
select {
  /* 移除默认样式 */
  -webkit-appearance: none;
  appearance: none;

  /* 移除 iOS 阴影 */
  -webkit-box-shadow: none;
  box-shadow: none;

  /* 移除边框 */
  border: none;
  outline: none;

  /* 自定义样式 */
  border-radius: 8px;
  background-color: var(--bg-primary);
}
```

#### 问题 3: 自动填充样式

**问题原因：**

- 浏览器自动填充会应用黄色背景
- 影响设计一致性

**解决方案：**

```css
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px var(--bg-primary) inset;
  -webkit-text-fill-color: var(--text-primary);
  transition: background-color 5000s ease-in-out 0s;
}
```

### 4. Safe Area 适配

#### 问题: 刘海屏和底部安全区域

**问题原因：**

- iPhone X 及以后的设备有刘海屏
- 底部有 Home Indicator
- 内容可能被遮挡

**解决方案：**

```css
/* 使用 env() 函数适配安全区域 */
.container {
  /* 顶部安全区域 */
  padding-top: env(safe-area-inset-top, 0);

  /* 底部安全区域 */
  padding-bottom: env(safe-area-inset-bottom, 0);

  /* 左侧安全区域 */
  padding-left: env(safe-area-inset-left, 0);

  /* 右侧安全区域 */
  padding-right: env(safe-area-inset-right, 0);
}

/* 固定定位元素 */
.fixed-bottom {
  bottom: env(safe-area-inset-bottom, 0);
}
```

### 5. 字体渲染问题

#### 问题 1: 字体模糊

**问题原因：**

- 移动端字体渲染可能模糊
- 需要优化字体渲染

**解决方案：**

```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
```

#### 问题 2: 字体大小适配

**问题原因：**

- 不同设备 DPR 不同
- 需要适配不同屏幕密度

**解决方案：**

```css
/* 使用 rem 单位 */
html {
  font-size: 16px; /* 基准字体大小 */
}

/* 响应式字体大小 */
@media (max-width: 640px) {
  html {
    font-size: 14px;
  }
}
```

### 6. 动画和过渡问题

#### 问题 1: 动画性能

**问题原因：**

- 移动端性能有限
- 复杂动画可能导致卡顿

**解决方案：**

```css
/* 使用 transform 和 opacity（GPU 加速） */
.animate {
  will-change: transform, opacity;
  transform: translateZ(0); /* 触发硬件加速 */
  backface-visibility: hidden;
}

/* 避免使用 left/top/width/height 动画 */
/* ❌ 不好 */
.animate {
  left: 100px; /* 触发重排 */
}

/* ✅ 好 */
.animate {
  transform: translateX(100px); /* GPU 加速 */
}
```

#### 问题 2: 减少动画

**问题原因：**

- 用户可能偏好减少动画
- 需要尊重系统设置

**解决方案：**

```css
/* 尊重 prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 7. 图片和媒体问题

#### 问题 1: 图片加载性能

**问题原因：**

- 移动端网络可能较慢
- 大图片影响加载速度

**解决方案：**

```css
/* 图片懒加载 */
img {
  content-visibility: auto;
  image-rendering: -webkit-optimize-contrast;
}

/* 使用 srcset 和 sizes */
<img
  srcset="image-320w.jpg 320w,
          image-640w.jpg 640w,
          image-1280w.jpg 1280w"
  sizes="(max-width: 640px) 100vw, 640px"
  src="image-640w.jpg"
  alt="Description"
/>
```

#### 问题 2: 视频播放

**问题原因：**

- 移动端视频播放需要特殊处理
- 全屏播放可能有问题

**解决方案：**

```css
video {
  width: 100%;
  height: auto;
  object-fit: contain;
}

/* iOS Safari 全屏播放 */
video::-webkit-media-controls {
  display: none !important;
}
```

### 8. 弹窗和模态框问题

#### 问题: 滚动穿透

**问题原因：**

- 弹窗打开时，背景页面仍可滚动
- 影响用户体验

**解决方案：**

```css
/* 弹窗打开时 */
.modal-open {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}

/* 或者使用 overscroll-behavior */
body {
  overscroll-behavior-y: contain;
}
```

### 9. 表单问题

#### 问题 1: 数字键盘

**问题原因：**

- 数字输入应该显示数字键盘
- 提升用户体验

**解决方案：**

```html
<!-- 数字输入 -->
<input type="tel" inputmode="numeric" pattern="[0-9]*" />

<!-- 小数输入 -->
<input type="text" inputmode="decimal" />

<!-- 邮箱输入 -->
<input type="email" inputmode="email" />
```

#### 问题 2: 表单验证样式

**问题原因：**

- 浏览器默认验证样式不一致
- 需要自定义样式

**解决方案：**

```css
/* 移除默认验证样式 */
input:invalid {
  box-shadow: none;
}

/* 自定义验证样式 */
input:invalid:not(:focus):not(:placeholder-shown) {
  border-color: var(--color-error);
}
```

### 10. 性能优化

#### 问题 1: 重排重绘

**解决方案：**

```css
/* 使用 contain 属性 */
.container {
  contain: layout style paint;
}

/* 使用 content-visibility */
.lazy-content {
  content-visibility: auto;
}
```

#### 问题 2: 滚动优化

**解决方案：**

```css
/* 使用 passive 事件监听器 */
/* 在 JS 中：addEventListener('scroll', handler, { passive: true }) */

/* CSS 优化 */
.scroll-container {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

## 🛠️ 最佳实践检查清单

### CSS 检查清单

- [ ] 使用 `touch-action: manipulation` 消除点击延迟
- [ ] 使用 `-webkit-overflow-scrolling: touch` 优化滚动
- [ ] 禁用不必要的文本选择（`user-select: none`）
- [ ] 移除点击高亮（`-webkit-tap-highlight-color: transparent`）
- [ ] 输入框字体大小至少 16px
- [ ] 使用 `env(safe-area-inset-*)` 适配安全区域
- [ ] 使用 `transform` 和 `opacity` 做动画（GPU 加速）
- [ ] 尊重 `prefers-reduced-motion` 设置
- [ ] 使用 `will-change` 优化动画性能
- [ ] 使用 `contain` 属性优化渲染

### JavaScript 检查清单

- [ ] 使用 `passive: true` 事件监听器
- [ ] 使用 `requestAnimationFrame` 做动画
- [ ] 使用防抖/节流优化事件处理
- [ ] 使用 Intersection Observer 做懒加载
- [ ] 避免频繁的 DOM 操作

### HTML 检查清单

- [ ] 正确配置 viewport meta 标签
- [ ] 使用正确的 inputmode 属性
- [ ] 使用语义化 HTML
- [ ] 添加适当的 ARIA 属性

## 📚 参考资源

- [MDN: Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [MDN: CSS Touch Action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)
- [MDN: Safe Area](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [Web.dev: Mobile Performance](https://web.dev/mobile/)
