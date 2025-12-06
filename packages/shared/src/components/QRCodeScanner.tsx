/**
 * @Author liyongjie
 * 二维码扫描组件
 * 使用 Tauri 2.0 多 WebView + 透明 Surface 方案
 * 相机画面作为底层，Web 只画遮罩和动画，扫码框随意设计
 *
 * 实现方案：
 * 1. 使用 getUserMedia API 在 WebView 中获取相机画面
 * 2. 使用 BarcodeDetector API 进行二维码检测
 * 3. Web UI 层绘制遮罩、扫码框和动画效果
 */

/// <reference path="../types/barcode-detector.d.ts" />

import { useEffect, useRef, useState } from 'react';
import { Button, SafeArea } from 'antd-mobile';
import { LeftOutline, ScanningOutline } from 'antd-mobile-icons';
import { getCameraStream, isGetUserMediaSupported } from '../utils/camera-scanner';
import { loadBarcodeScanner } from '../utils/barcode-scanner';
import { startContinuousQRScan } from '../utils/qr-detector';

export interface QRCodeScannerProps {
  /**
   * 扫描成功回调
   */
  onScanSuccess: (content: string) => void;
  /**
   * 取消扫描回调
   */
  onCancel: () => void;
  /**
   * 扫描提示文本
   */
  hint?: string;
  /**
   * 是否自动开始扫描（默认 false，需要用户点击按钮）
   */
  autoStart?: boolean;
}

/**
 * 二维码扫描组件
 *
 * 方案选择：
 * - 移动端（iOS/Android）：使用 Tauri barcode-scanner 插件（原生方案）
 * - 桌面端/浏览器：使用 Web API (getUserMedia + BarcodeDetector)
 * - Web UI 层绘制透明遮罩、扫码框和动画效果
 */
export default function QRCodeScanner({
  onScanSuccess,
  onCancel,
  hint = '请将二维码对准扫描框',
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Web API 相关 refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopScanRef = useRef<(() => void) | null>(null);
  const isInitializingRef = useRef(false); // 防止重复初始化

  // Tauri 插件相关 refs
  const scanModuleRef = useRef<any>(null);

  // 检测环境：移动端使用原生方案，桌面端使用 Web API
  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isTauriMobile =
    typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window && isMobileDevice;

  // 桌面端使用 Web API，移动端使用原生方案
  const shouldUseWebAPI = !isTauriMobile;

  // 使用 Web API + Canvas + jsQR 开始扫描（桌面端）
  const startWebScan = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('视频或画布元素未初始化');
      return;
    }

    // 防止重复调用
    if (isScanning || isInitializingRef.current) {
      console.log('[QRCodeScanner] 扫描已在进行中，跳过重复调用');
      return;
    }

    try {
      isInitializingRef.current = true;
      setIsScanning(true);
      setError(null);

      // 获取相机流
      console.log('[QRCodeScanner] 请求相机权限...');
      const stream = await getCameraStream();

      // 检查是否在获取流的过程中组件被卸载
      if (!videoRef.current || !canvasRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      // 将流绑定到 video 元素（隐藏，仅用于捕获）
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // 等待视频元数据加载
      await new Promise<void>((resolve) => {
        if (videoRef.current!.readyState >= videoRef.current!.HAVE_METADATA) {
          resolve();
        } else {
          videoRef.current!.addEventListener('loadedmetadata', () => resolve(), { once: true });
        }
      });

      // 设置 Canvas 尺寸与视频一致
      if (canvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }

      // 开始持续扫描（使用 Canvas + jsQR）
      console.log('[QRCodeScanner] 开始扫描（Canvas + jsQR）...');
      const stopScan = startContinuousQRScan(
        videoRef.current,
        canvasRef.current,
        (content) => {
          console.log('[QRCodeScanner] 扫描成功:', content);
          setIsScanning(false);
          stopScanRef.current?.();
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          onScanSuccess(content.trim());
        },
        (error) => {
          console.error('[QRCodeScanner] 扫描错误:', error);
          setError(error.message);
          setIsScanning(false);
        }
      );

      stopScanRef.current = stopScan;
      setHasPermission(true);
      isInitializingRef.current = false;
    } catch (error: any) {
      isInitializingRef.current = false;
      setIsScanning(false);

      // 如果是 AbortError（通常是因为组件卸载或用户取消），不显示错误
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.log('[QRCodeScanner] 扫描被中断（可能是组件卸载）');
        return;
      }

      console.error('[QRCodeScanner] 启动扫描失败:', error);
      setError(error.message || '启动扫描失败');

      // 清理资源
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  useEffect(() => {
    // 防止重复初始化
    if (isInitializingRef.current) {
      return;
    }

    // 组件挂载时初始化
    async function init() {
      if (shouldUseWebAPI) {
        // 桌面端：使用 Web API + Canvas + jsQR 方案
        console.log('[QRCodeScanner] 桌面端：使用 Web API + Canvas + jsQR 方案');

        // 检查 Web API 支持
        if (!isGetUserMediaSupported()) {
          setError('当前浏览器不支持相机访问，请使用支持的浏览器或移动端应用');
          setTimeout(() => onCancel(), 2000);
          return;
        }

        setHasPermission(null);

        // 桌面端自动开始扫描（直接调用摄像头）
        // 延迟一下，确保 video 和 canvas 元素已渲染
        const timer = setTimeout(() => {
          startWebScan();
        }, 100);

        // 返回清理函数
        return () => {
          clearTimeout(timer);
        };
      }

      // 移动端：使用 Tauri 原生插件方案
      console.log('[QRCodeScanner] 移动端：使用原生扫描方案');
      try {
        const module = await loadBarcodeScanner();
        if (!module) {
          setError('当前设备不支持扫描功能');
          setTimeout(() => onCancel(), 1000);
          return;
        }
        scanModuleRef.current = module;

        // 检查权限
        console.log('[QRCodeScanner] 检查相机权限...');
        let permission = await module.checkPermissions();
        console.log('[QRCodeScanner] 权限检查结果:', permission);
        setHasPermission(permission);

        if (!permission) {
          // 请求权限
          console.log('[QRCodeScanner] 请求相机权限...');
          permission = await module.requestPermissions();
          console.log('[QRCodeScanner] 权限请求结果:', permission);
          setHasPermission(permission);
          if (!permission) {
            setError('需要相机权限才能扫描二维码，请在设置中允许访问相机');
            setTimeout(() => onCancel(), 2000);
            return;
          }
        }

        console.log('[QRCodeScanner] 权限准备完成');

        // 移动端自动开始扫描（权限获取后立即开始）
        if (permission) {
          // 延迟一下确保组件完全初始化
          setTimeout(() => {
            startNativeScan();
          }, 100);
        }
      } catch (error: any) {
        console.error('[QRCodeScanner] 初始化失败:', error);
        setError(`扫描初始化失败: ${error?.message || '未知错误'}`);
        setTimeout(() => onCancel(), 2000);
      }
    }

    init();

    // 清理函数
    return () => {
      isInitializingRef.current = false;

      // 停止 Web API 扫描
      if (stopScanRef.current) {
        stopScanRef.current();
        stopScanRef.current = null;
      }

      // 先停止 video 播放，再清空 srcObject
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
          videoRef.current.load(); // 重置 video 元素
          console.log('[QRCodeScanner] 清理：已清空 video 元素');
        } catch (error) {
          console.error('[QRCodeScanner] 清理 video 元素失败:', error);
        }
      }

      // 停止所有视频轨道
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          try {
            track.stop();
            console.log('[QRCodeScanner] 清理：停止视频轨道:', track.kind, track.label);
          } catch (error) {
            console.error('[QRCodeScanner] 清理：停止轨道失败:', error);
          }
        });
        streamRef.current = null;
      }

      // 停止 Tauri 插件扫描
      if (scanModuleRef.current?.cancel) {
        scanModuleRef.current.cancel().catch(() => {
          // 忽略取消错误
        });
      }
    };
  }, [onCancel, shouldUseWebAPI]);

  // 使用 Tauri 插件开始扫描
  const startNativeScan = async () => {
    if (!scanModuleRef.current) {
      setError('扫描模块未初始化');
      return;
    }

    if (isScanning) {
      return;
    }

    try {
      setIsScanning(true);
      setError(null);

      console.log('[QRCodeScanner] 开始调用原生扫描...');
      const result = await scanModuleRef.current.scan({
        cameraDirection: 'back',
      });

      console.log('[QRCodeScanner] 扫描返回结果:', result);
      setIsScanning(false);

      if (result?.content) {
        console.log('[QRCodeScanner] 扫描成功:', result.content);
        setTimeout(() => {
          onScanSuccess(result.content.trim());
        }, 100);
      }
    } catch (error: any) {
      setIsScanning(false);
      const errorMessage = error?.message || error?.toString() || '未知错误';

      console.error('[QRCodeScanner] 扫描异常:', error);

      // 如果是用户取消，不显示错误
      if (
        errorMessage.includes('cancel') ||
        errorMessage.includes('取消') ||
        errorMessage.includes('User cancelled') ||
        errorMessage.includes('cancelled')
      ) {
        console.log('[QRCodeScanner] 用户取消了扫描');
        return;
      }

      setError(`扫描失败: ${errorMessage}`);
    }
  };

  const handleCancel = async () => {
    console.log('[QRCodeScanner] 用户点击返回按钮');

    // 重置状态标志，防止继续扫描
    setIsScanning(false);
    isInitializingRef.current = false;

    // 停止 Web API 扫描（这会停止 requestAnimationFrame）
    if (stopScanRef.current) {
      stopScanRef.current();
      stopScanRef.current = null;
    }

    // 先停止 video 播放，再清空 srcObject
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        // 清空所有事件监听器
        videoRef.current.load(); // 重置 video 元素
        console.log('[QRCodeScanner] 已清空 video 元素');
      } catch (error) {
        console.error('[QRCodeScanner] 清空 video 元素失败:', error);
      }
    }

    // 停止所有视频轨道
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => {
        try {
          track.stop();
          console.log('[QRCodeScanner] 停止视频轨道:', track.kind, track.label);
        } catch (error) {
          console.error('[QRCodeScanner] 停止轨道失败:', error);
        }
      });
      streamRef.current = null;
    }

    // 停止 Tauri 插件扫描（移动端）
    if (scanModuleRef.current?.cancel) {
      try {
        await scanModuleRef.current.cancel();
        console.log('[QRCodeScanner] 已取消原生扫描');
      } catch (error) {
        console.error('[QRCodeScanner] 取消扫描失败:', error);
      }
    }

    // 等待一小段时间确保资源释放
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 调用取消回调
    onCancel();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100vh',
        width: '100vw',
      }}
    >
      {/* 顶部安全区域 */}
      <SafeArea position="top" />

      {/* 顶部导航栏 */}
      <div
        style={{
          position: 'relative',
          padding: '12px 16px',
          zIndex: 10001,
        }}
      >
        <Button
          fill="none"
          style={{
            padding: '8px',
            fontSize: '20px',
            minWidth: '44px',
            minHeight: '44px',
          }}
          onClick={handleCancel}
        >
          <LeftOutline fontSize={26} color="#000" />
        </Button>
      </div>

      {/* 相机画面容器（Web API 方案：隐藏 video，显示 canvas） */}
      {shouldUseWebAPI && (
        <>
          {/* 隐藏的 video 元素，仅用于捕获视频流 */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1px',
              height: '1px',
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          {/* Canvas 用于绘制视频帧和二维码识别 */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1,
              backgroundColor: '#000',
            }}
          />
        </>
      )}

      {/* 扫描提示区域 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          position: 'relative',
          zIndex: 10000,
          pointerEvents: 'none', // 允许点击穿透到视频
        }}
      >
        {/* 扫描框 */}
        <div
          style={{
            width: '280px',
            height: '280px',
            border: '2px solid #fff',
            borderRadius: '16px',
            position: 'relative',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)', // 遮罩效果
            pointerEvents: 'auto', // 恢复点击事件
          }}
        >
          {/* 四个角的装饰 */}
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              width: '40px',
              height: '40px',
              borderTop: '4px solid #1677ff',
              borderLeft: '4px solid #1677ff',
              borderTopLeftRadius: '16px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '40px',
              height: '40px',
              borderTop: '4px solid #1677ff',
              borderRight: '4px solid #1677ff',
              borderTopRightRadius: '16px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              left: '-2px',
              width: '40px',
              height: '40px',
              borderBottom: '4px solid #1677ff',
              borderLeft: '4px solid #1677ff',
              borderBottomLeftRadius: '16px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '40px',
              height: '40px',
              borderBottom: '4px solid #1677ff',
              borderRight: '4px solid #1677ff',
              borderBottomRightRadius: '16px',
            }}
          />
        </div>

        {/* 提示文字 */}
        <div
          style={{
            marginTop: '40px',
            color: '#fff',
            fontSize: '16px',
            textAlign: 'center',
            fontWeight: 500,
            pointerEvents: 'auto',
          }}
        >
          {hint}
        </div>

        {/* 扫描图标动画 */}
        {isScanning && (
          <div
            style={{
              marginTop: '20px',
              animation: 'pulse 2s ease-in-out infinite',
              pointerEvents: 'auto',
            }}
          >
            <ScanningOutline fontSize={48} color="#1677ff" />
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div
            style={{
              marginTop: '20px',
              color: '#ff4d4f',
              fontSize: '14px',
              textAlign: 'center',
              pointerEvents: 'auto',
            }}
          >
            {error}
          </div>
        )}

        {/* 权限状态提示 */}
        {hasPermission === false && (
          <div
            style={{
              marginTop: '20px',
              color: '#ff4d4f',
              fontSize: '14px',
              textAlign: 'center',
              pointerEvents: 'auto',
            }}
          >
            相机权限被拒绝，请在设置中允许访问相机
          </div>
        )}
      </div>

      {/* 底部安全区域 */}
      <SafeArea position="bottom" />

      {/* 添加动画样式 */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
