/**
 * @Author liyongjie
 * 桌面端二维码扫描组件
 * 使用 Web API (getUserMedia + Canvas + jsQR)
 */

import React, { useEffect, useRef, useState } from 'react';
import { isGetUserMediaSupported } from '../../utils/camera-scanner';
import { cancelScanQR } from '../../utils/scanQR';
import { createScannerForCurrentPlatform } from '../../utils/scanner/factory';
import type { IScanner } from '../../utils/scanner/types';
import ScannerHeader from './ScannerHeader';
import ScanContent from './ScanContent';
import { containerStyle, contentStyle } from './styles';

export interface DesktopQRCodeScannerProps {
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
 * 桌面端二维码扫描组件
 */
const DesktopQRCodeScanner: React.FC<DesktopQRCodeScannerProps> = ({
  onScanSuccess,
  onCancel,
  hint = '请将二维码对准扫描框',
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerRef = useRef<IScanner | null>(null);
  const isInitializingRef = useRef(false);

  // 清理摄像头资源
  const cleanupCamera = async () => {
    try {
      if (scannerRef.current?.cancel) {
        await scannerRef.current.cancel();
        scannerRef.current = null;
      }

      if (videoRef.current) {
        try {
          videoRef.current.pause();
          const stream = videoRef.current.srcObject as MediaStream | null;
          if (stream) {
            stream.getTracks().forEach((track) => {
              if (track.readyState === 'live') {
                track.stop();
              }
            });
          }
          videoRef.current.srcObject = null;
          videoRef.current.load();
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error('[DesktopQRCodeScanner] 清理 video 元素失败:', error);
        }
      }
    } catch (error) {
      console.error('[DesktopQRCodeScanner] 清理摄像头资源失败:', error);
    }
  };

  // 开始扫描
  useEffect(() => {
    if (isInitializingRef.current) {
      return;
    }

    async function startScan() {
      isInitializingRef.current = true;

      try {
        setIsScanning(true);
        setError(null);

        if (!isGetUserMediaSupported()) {
          setError('当前浏览器不支持相机访问');
          setTimeout(() => onCancel(), 2000);
          return;
        }

        if (!videoRef.current || !canvasRef.current) {
          setError('视频或画布元素未初始化');
          return;
        }

        // 创建扫描器实例
        scannerRef.current = await createScannerForCurrentPlatform();

        // 开始扫描
        const content = await scannerRef.current.scan({
          videoElement: videoRef.current,
          canvasElement: canvasRef.current,
        });
        setIsScanning(false);
        onScanSuccess(content);
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
          console.log('[DesktopQRCodeScanner] 用户取消了扫描');
          return;
        }

        console.error('[DesktopQRCodeScanner] 扫描失败:', error);
        setError(errorMessage);
      } finally {
        isInitializingRef.current = false;
      }
    }

    const timer = setTimeout(() => {
      startScan();
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanupCamera();
    };
  }, [onScanSuccess, onCancel]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isInitializingRef.current = false;
      cleanupCamera();
    };
  }, []);

  const handleCancel = async () => {
    console.log('[DesktopQRCodeScanner] 用户点击返回按钮');
    setIsScanning(false);
    isInitializingRef.current = false;

    // 使用统一的取消函数
    try {
      await cancelScanQR();
    } catch (error) {
      console.error('[DesktopQRCodeScanner] 取消扫描失败:', error);
      // 如果统一取消失败，降级到本地清理
      await cleanupCamera();
    }

    onCancel();
  };

  return (
    <div style={{ ...containerStyle, backgroundColor: '#000' }}>
      <ScannerHeader onCancel={handleCancel} />

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
        }}
      />

      {/* Canvas 用于绘制视频帧和二维码识别 */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#000',
        }}
      />

      <div style={{ ...contentStyle, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <ScanContent isScanning={isScanning} hint={hint} error={error} />
      </div>
    </div>
  );
};

export default DesktopQRCodeScanner;
