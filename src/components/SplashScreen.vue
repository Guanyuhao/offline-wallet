<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const emit = defineEmits<{
  (e: 'complete'): void;
}>();

const isVisible = ref(false);
const logoScale = ref(0);
const textOpacity = ref(0);

onMounted(() => {
  // 延迟显示动画
  setTimeout(() => {
    isVisible.value = true;

    // Logo 缩放动画
    setTimeout(() => {
      logoScale.value = 1;
    }, 100);

    // 文字淡入动画
    setTimeout(() => {
      textOpacity.value = 1;
    }, 400);

    // 动画完成后触发完成事件
    setTimeout(() => {
      emit('complete');
    }, 2000); // 总时长 2 秒
  }, 100);
});
</script>

<template>
  <div class="splash-screen" :class="{ 'splash-visible': isVisible }">
    <div class="splash-content">
      <!-- Logo 区域 -->
      <div class="splash-logo" :style="{ transform: `scale(${logoScale})` }">
        <img src="/wallet-logo.svg" alt="Wallet Logo" class="logo-image" />
      </div>

      <!-- 应用名称 -->
      <div class="splash-title" :style="{ opacity: textOpacity }">
        <h1 class="app-name">{{ t('app.name') }}</h1>
        <p class="app-subtitle">{{ t('app.subtitle') }}</p>
      </div>

      <!-- 加载指示器 -->
      <div class="splash-loader" :style="{ opacity: textOpacity }">
        <div class="loader-dot"></div>
        <div class="loader-dot"></div>
        <div class="loader-dot"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--apple-bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.3s ease-out;
}

.splash-screen.splash-visible {
  opacity: 1;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--apple-spacing-xl);
  padding: var(--apple-spacing-xl);
}

.splash-logo {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.splash-title {
  text-align: center;
  transition: opacity 0.6s ease-out;
}

.app-name {
  font-size: var(--apple-font-size-title-1);
  font-weight: var(--apple-font-weight-bold);
  color: var(--apple-text-primary);
  margin: 0 0 var(--apple-spacing-sm) 0;
  letter-spacing: -0.02em;
}

.app-subtitle {
  font-size: var(--apple-font-size-body);
  color: var(--apple-text-secondary);
  margin: 0;
  font-weight: var(--apple-font-weight-regular);
}

.splash-loader {
  display: flex;
  gap: var(--apple-spacing-xs);
  transition: opacity 0.6s ease-out;
}

.loader-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--apple-blue);
  animation: bounce 1.4s infinite ease-in-out both;
}

.loader-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loader-dot:nth-child(2) {
  animation-delay: -0.16s;
}

.loader-dot:nth-child(3) {
  animation-delay: 0;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .splash-screen {
    background: var(--apple-bg-primary);
  }
}

/* 移动端适配 */
@media (max-width: 640px) {
  .splash-logo {
    width: 100px;
    height: 100px;
  }

  .app-name {
    font-size: var(--apple-font-size-title-2);
  }
}
</style>
