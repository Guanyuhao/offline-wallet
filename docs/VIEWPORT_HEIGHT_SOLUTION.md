# 移动端 WebView 视口高度问题 - W3C 官方标准解决方案

## 📋 问题概述

这是移动端 WebView 渲染的**经典问题**，几乎所有移动端 Web 应用都会遇到。

## 🔍 问题原因详解

### 1. **地址栏动态显示/隐藏**

**问题现象：**

- iOS Safari 和 Android Chrome 的地址栏会随滚动自动显示/隐藏
- 传统 `100vh` 使用的是**布局视口（Layout Viewport）**高度，包含地址栏
- 滚动时地址栏隐藏，`100vh` 突然变大，造成布局跳动

**技术原因：**

```
布局视口（Layout Viewport）= 设备屏幕高度（固定）
可视视口（Visual Viewport）= 布局视口 - 地址栏 - 键盘（动态变化）
```

### 2. **虚拟键盘弹起**

**iOS Safari 的问题：**

- 键盘弹起时，**布局视口高度不变**
- `window.innerHeight` 保持不变，无法感知键盘存在
- `100vh` 使用的是布局视口高度，不包含键盘
- 导致内容被键盘遮挡或出现"不合理区域"

**Android WebView 的问题：**

- 键盘弹起时，**布局视口高度会减小**
- `window.innerHeight` 会变化，但变化时机不准确
- 不同 Android 版本和 WebView 版本行为不一致
- 可能导致布局计算错误

### 3. **position: fixed 元素异常**

**问题现象：**

- iOS Safari 中，键盘弹起时 `position: fixed` 元素可能被重新定位
- 导致底部导航栏、固定按钮等元素位置错乱
- 元素可能被键盘遮挡或出现在错误位置

**技术原因：**

- `position: fixed` 相对于布局视口定位，而不是可视视口
- 键盘弹起时，可视视口变化但布局视口不变，导致定位错乱

## ✅ W3C 官方标准解决方案

W3C 提供了**三层官方标准解决方案**（按优先级）：

### 方案 1: `interactive-widget=resizes-content` (2023年新标准)

**标准文档：**

- CSS Viewport Module Level 4
- https://www.w3.org/TR/css-viewport-4/#interactive-widget

**作用：**

- 告诉浏览器键盘弹起时应该自动调整内容大小
- 浏览器原生处理，无需 JS 干预

**使用方法：**

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, interactive-widget=resizes-content"
/>
```

**支持情况：**

- ✅ Chrome 114+ (2023年5月)
- ✅ Safari 15.4+ (2022年3月)
- ❌ Firefox (尚未支持)

**状态：** ✅ 已在 `index.html` 中配置

### 方案 2: CSS 视口单位 `dvh/svh/lvh` (2022年标准)

**标准文档：**

- CSS Values and Units Module Level 4
- https://www.w3.org/TR/css-values-4/#viewport-relative-lengths

**单位说明：**

- **`dvh`** (Dynamic Viewport Height): 动态视口高度，排除地址栏和键盘（**推荐使用**）
- **`svh`** (Small Viewport Height): 小视口高度，包含地址栏和键盘
- **`lvh`** (Large Viewport Height): 大视口高度，排除地址栏和键盘

**使用方法：**

```css
.container {
  height: 100dvh; /* 自动适应键盘弹起 */
}
```

**支持情况：**

- ✅ Chrome 108+ (2022年11月)
- ✅ Safari 15.4+ (2022年3月)
- ✅ Firefox 101+ (2022年6月)
- ❌ 旧版浏览器（需要降级方案）

**优势：**

- 零 JS 开销，性能最佳
- 浏览器原生处理，最符合 W3C 标准

### 方案 3: Visual Viewport API (2017年标准)

**标准文档：**

- Visual Viewport API (W3C Working Draft)
- https://www.w3.org/TR/visual-viewport/

**作用：**

- 提供精确的可视视口信息，包括键盘弹起时的尺寸
- 可以监听视口变化事件

**使用方法：**

```javascript
if (window.visualViewport) {
  const height = window.visualViewport.height; // 排除键盘后的高度
  window.visualViewport.addEventListener('resize', () => {
    // 键盘弹起/收起时触发
  });
}
```

**支持情况：**

- ✅ Chrome 61+ (2017年9月)
- ✅ Safari 13+ (2019年9月)
- ✅ Firefox 91+ (2021年8月)
- ❌ 旧版浏览器（需要降级方案）

## 🎯 为什么没有"完全统一"的官方解决方案？

### 历史原因

1. **标准制定滞后**
   - 移动端 WebView 问题在 2010 年左右开始出现
   - W3C 标准制定需要时间，直到 2017 年才有 Visual Viewport API
   - CSS 视口单位直到 2022 年才广泛支持

2. **浏览器实现差异**
   - iOS Safari 和 Android WebView 处理方式不同
   - 不同浏览器版本行为不一致
   - 需要兼容性处理

3. **渐进式标准化**
   - W3C 采用渐进增强策略
   - 新标准需要时间推广
   - 旧浏览器需要降级方案

### 现状

**好消息：**

- ✅ W3C 已经提供了官方标准解决方案
- ✅ 现代浏览器已经广泛支持
- ✅ 可以使用渐进增强策略

**坏消息：**

- ❌ 旧版浏览器仍需要降级方案
- ❌ 不同平台行为仍有差异
- ❌ 需要兼容性处理

## 🛠️ 本项目的实现方案

### 渐进增强策略

```
优先级 1: CSS dvh 单位（现代浏览器，零 JS 开销）
    ↓ 不支持时降级
优先级 2: visualViewport API + CSS 变量（兼容性更好）
    ↓ 不支持时降级
优先级 3: JS 计算的 vh 单位（旧浏览器）
```

### 实现特点

1. **优先使用 W3C 标准**
   - 优先使用 CSS `dvh` 单位（符合 W3C 标准）
   - 降级使用 Visual Viewport API（W3C 标准）

2. **性能优化**
   - 现代浏览器零 JS 开销
   - 使用防抖和 RAF 优化
   - Passive 事件监听

3. **兼容性处理**
   - 自动检测浏览器支持
   - 提供完整的降级方案
   - 支持所有主流浏览器

## 📚 参考资源

### W3C 官方标准

- [CSS Values and Units Level 4](https://www.w3.org/TR/css-values-4/)
- [CSS Viewport Module Level 4](https://www.w3.org/TR/css-viewport-4/)
- [Visual Viewport API](https://www.w3.org/TR/visual-viewport/)

### MDN 文档

- [CSS Viewport Units](https://developer.mozilla.org/en-US/docs/Web/CSS/length#viewport-relative_lengths)
- [Visual Viewport API](https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API)

### 浏览器支持情况

- [Can I Use: dvh](https://caniuse.com/viewport-unit-variants)
- [Can I Use: Visual Viewport API](https://caniuse.com/visual-viewport)

## 🔗 相关文件

- `src/composables/useViewportHeight.ts` - 视口高度管理工具
- `src/composables/useAppLayout.ts` - 布局管理 Composable
- `src/main.ts` - 应用启动时的初始化
- `index.html` - viewport meta 配置
- `src/styles/global.css` - 全局样式

## 📝 总结

虽然 W3C 已经提供了官方标准解决方案，但由于：

1. **历史原因**：标准制定滞后于问题出现
2. **浏览器差异**：不同平台实现不同
3. **渐进式标准化**：需要时间推广

所以目前仍需要：

1. ✅ 使用 W3C 官方标准（优先）
2. ✅ 提供降级方案（兼容性）
3. ✅ 渐进增强策略（最佳实践）

**好消息是：** 现代浏览器已经广泛支持，未来这个问题会越来越少！
