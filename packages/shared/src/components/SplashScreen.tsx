/**
 * @Author liyongjie
 * 开屏动画组件
 * 使用应用 icon 展示友好的启动动画
 * 极简风格，适配苹果设计语言
 */

import { useEffect, useState } from 'react';

export interface SplashScreenProps {
  /**
   * 动画持续时间（毫秒）
   */
  duration?: number;
  /**
   * 动画完成后的回调
   */
  onComplete?: () => void;
  /**
   * 是否自动完成（true 时会在动画结束后自动调用 onComplete）
   */
  autoComplete?: boolean;
  /**
   * 应用名称
   */
  appName?: string;
  /**
   * 副标题
   */
  subtitle?: string;
  /**
   * Icon 路径
   */
  iconPath?: string;
}

export default function SplashScreen({
  duration = 2000,
  onComplete,
  autoComplete = true,
  appName = '冷钱包',
  subtitle = 'COLD WALLET',
  iconPath = '/icon.png',
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    // 第一阶段：进入动画（0-600ms）
    const enterTimer = setTimeout(() => {
      setAnimationPhase('show');
    }, 600);

    // 第二阶段：显示阶段（600ms - duration-400ms）
    const showTimer = setTimeout(() => {
      setAnimationPhase('exit');
    }, duration - 400);

    // 第三阶段：退出动画
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      if (autoComplete && onComplete) {
        onComplete();
      }
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
    };
  }, [duration, onComplete, autoComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh', // 使用 100vh 占满屏幕
        backgroundColor: '#ffffff',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Icon 容器 */}
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform:
            animationPhase === 'enter'
              ? 'scale(0.5) rotate(-180deg)'
              : animationPhase === 'exit'
                ? 'scale(1.1) rotate(0deg)'
                : 'scale(1) rotate(0deg)',
          opacity: animationPhase === 'enter' ? 0 : animationPhase === 'exit' ? 0 : 1,
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Icon 图片 - 极简风格 */}
        <img
          src={iconPath}
          alt={appName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          onError={(e) => {
            // 如果 icon.png 加载失败，尝试使用其他路径
            const target = e.target as HTMLImageElement;
            target.src = '/src-tauri/icons/icon.png';
            target.onerror = () => {
              // 如果还是失败，显示默认图标
              target.style.display = 'none';
            };
          }}
        />
      </div>

      {/* 应用名称 - 极简风格 */}
      <div
        style={{
          marginTop: '32px',
          fontSize: '28px',
          fontWeight: 300,
          color: '#1d1d1f',
          letterSpacing: '0.5px',
          opacity: animationPhase === 'enter' ? 0 : animationPhase === 'exit' ? 0 : 1,
          transform:
            animationPhase === 'enter'
              ? 'translateY(20px)'
              : animationPhase === 'exit'
                ? 'translateY(-20px)'
                : 'translateY(0)',
          transition: 'all 0.6s ease-out',
        }}
      >
        {appName}
      </div>

      {/* 副标题 - 极简风格 */}
      {subtitle && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '15px',
            fontWeight: 300,
            color: '#86868b',
            letterSpacing: '1px',
            opacity: animationPhase === 'enter' ? 0 : animationPhase === 'exit' ? 0 : 1,
            transform:
              animationPhase === 'enter'
                ? 'translateY(20px)'
                : animationPhase === 'exit'
                  ? 'translateY(-20px)'
                  : 'translateY(0)',
            transition: 'all 0.6s ease-out 0.2s',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
