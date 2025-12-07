/**
 * @Author liyongjie
 * 二维码扫描组件
 *
 * 方案选择：
 * - 移动端（iOS/Android）：使用 Tauri barcode-scanner 插件（原生方案，windowed: true）
 * - 桌面端：使用 Web API (getUserMedia + Canvas + jsQR)
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, SafeArea, Mask } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import {
  scanQR,
  checkMobileCameraPermission,
  requestMobileCameraPermission,
} from '../utils/scanQR';
import { detectPlatform, isMobilePlatform } from '../utils/scanner/platform';
import { isGetUserMediaSupported } from '../utils/camera-scanner';
import { createScannerForCurrentPlatform } from '../utils/scanner/factory';
import type { IScanner } from '../utils/scanner/types';
import ScanningFrame from './ScanningFrame';

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
}

/**
 * 二维码扫描组件
 * 根据平台自动选择扫描方案
 */
export default function QRCodeScanner({
  onScanSuccess,
  onCancel,
  hint = '请将二维码对准扫描框',
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [shouldUseWebAPI, setShouldUseWebAPI] = useState<boolean>(true);

  // Web API 相关 refs（仅桌面端使用）
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerRef = useRef<IScanner | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInitializingRef = useRef(false);

  // 初始化平台检测
  useEffect(() => {
    detectPlatform().then((p) => {
      setPlatform(p);
      setShouldUseWebAPI(!isMobilePlatform(p));
    });
  }, []);

  // 开始扫描
  useEffect(() => {
    if (platform === null || isInitializingRef.current) {
      return;
    }

    async function startScan() {
      isInitializingRef.current = true;

      try {
        setIsScanning(true);
        setError(null);

        if (shouldUseWebAPI) {
          // 桌面端：使用 Web API
          if (!isGetUserMediaSupported()) {
            setError('当前浏览器不支持相机访问');
            setTimeout(() => onCancel(), 2000);
            return;
          }

          if (!videoRef.current || !canvasRef.current) {
            setError('视频或画布元素未初始化');
            return;
          }

          setHasPermission(null);

          // 创建扫描器实例并保存引用
          scannerRef.current = await createScannerForCurrentPlatform();

          // 调用统一的 scanQR 函数（桌面端需要 video 和 canvas）
          const content = await scannerRef.current.scan({
            videoElement: videoRef.current,
            canvasElement: canvasRef.current,
          });
          setIsScanning(false);
          onScanSuccess(content);
        } else {
          // 移动端：使用 Tauri 原生插件
          // 检查权限
          let permission = await checkMobileCameraPermission();
          setHasPermission(permission);

          if (!permission) {
            permission = await requestMobileCameraPermission();
            setHasPermission(permission);
            if (!permission) {
              setError('需要相机权限才能扫描二维码，请在设置中允许访问相机');
              setTimeout(() => onCancel(), 2000);
              return;
            }
          }

          // 调用统一的 scanQR 函数（移动端不需要 video 和 canvas）
          const content = await scanQR();
          setIsScanning(false);
          onScanSuccess(content);
        }
      } catch (error: any) {
        setIsScanning(false);
        const errorMessage = error?.message || error?.toString() || '未知错误';

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

        console.error('[QRCodeScanner] 扫描失败:', error);
        setError(errorMessage);
      } finally {
        isInitializingRef.current = false;
      }
    }

    // 延迟一下确保组件完全初始化
    const timer = setTimeout(() => {
      startScan();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [platform, shouldUseWebAPI, onScanSuccess, onCancel]);

  // 清理摄像头资源的函数
  const cleanupCamera = async () => {
    try {
      // 取消扫描器（这会停止扫描和媒体流）
      if (scannerRef.current?.cancel) {
        await scannerRef.current.cancel();
        scannerRef.current = null;
      }

      // 清理 video 元素（仅桌面端）
      if (videoRef.current) {
        try {
          // 停止视频播放
          videoRef.current.pause();

          // 停止所有视频轨道（双重保险）
          const stream = videoRef.current.srcObject as MediaStream | null;
          if (stream) {
            stream.getTracks().forEach((track) => {
              if (track.readyState === 'live') {
                track.stop();
              }
            });
          }

          // 清空 srcObject
          videoRef.current.srcObject = null;

          // 重置 video 元素
          videoRef.current.load();

          // 延迟一下确保资源完全释放
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error('[QRCodeScanner] 清理 video 元素失败:', error);
        }
      }

      // 清理 stream ref（双重保险）
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
        streamRef.current = null;
      }
    } catch (error) {
      console.error('[QRCodeScanner] 清理摄像头资源失败:', error);
    }
  };

  // 清理函数（组件卸载时）
  useEffect(() => {
    return () => {
      isInitializingRef.current = false;
      cleanupCamera();
    };
  }, []);

  const handleCancel = async () => {
    console.log('[QRCodeScanner] 用户点击返回按钮');
    setIsScanning(false);
    isInitializingRef.current = false;

    // 清理摄像头资源
    await cleanupCamera();

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
          <LeftOutline fontSize={26} color={shouldUseWebAPI ? '#000' : '#fff'} />
        </Button>
      </div>

      {/* 相机画面容器（仅桌面端 Web API 方案） */}
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

      {/* 使用 Mask 组件实现遮罩效果，扫描区域在 Mask 内部 */}
      <Mask
        visible={true}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        // 点击蒙层不需要关闭扫描界面
        onMaskClick={() => {}}
      >
        {/* 扫描提示区域 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative',
            zIndex: 10000,
            width: '100%',
            height: '100%',
          }}
        >
          {/* 扫描框组件 */}
          <ScanningFrame
            size={280}
            showScanLine={isScanning}
            scanLineColor="#1677ff"
            borderColor="#fff"
            cornerColor="#1677ff"
          />

          {/* 提示文字 */}
          <div
            style={{
              marginTop: '40px',
              color: '#fff',
              fontSize: '16px',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {hint}
          </div>

          {/* 错误提示 */}
          {error && (
            <div
              style={{
                marginTop: '20px',
                color: '#ff4d4f',
                fontSize: '14px',
                textAlign: 'center',
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
              }}
            >
              相机权限被拒绝，请在设置中允许访问相机
            </div>
          )}
        </div>
      </Mask>

      {/* 底部安全区域 */}
      <SafeArea position="bottom" />
    </div>
  );
}
