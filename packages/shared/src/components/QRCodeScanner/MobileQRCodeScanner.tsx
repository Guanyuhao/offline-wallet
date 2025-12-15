/**
 * @Author liyongjie
 * 移动端二维码扫描组件
 * 使用 Tauri barcode-scanner 插件（原生方案）
 */

import React, { useEffect, useState, useRef } from 'react';
import { SafeArea } from 'antd-mobile';
import {
  scanQR,
  cancelScanQR,
  checkMobileCameraPermission,
  requestMobileCameraPermission,
} from '../../utils/scanQR';
import { scanQRCodeWindowed } from '../../utils/rust-scanner';
import ScannerHeader from './ScannerHeader';
import ScanContent from './ScanContent';
import { containerStyle } from './styles';

export interface MobileQRCodeScannerProps {
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
 * 移动端二维码扫描组件
 */
const MobileQRCodeScanner: React.FC<MobileQRCodeScannerProps> = ({
  onScanSuccess,
  onCancel,
  hint = '请将二维码对准扫描框',
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const scanAbortedRef = useRef(false);

  // 保存原始 html 背景色
  const originalBgColorRef = useRef<string>('');

  // 设置 html 背景色为透明（让相机视图可见）
  const setHtmlBackgroundTransparent = () => {
    const html = document.documentElement;
    originalBgColorRef.current = html.style.backgroundColor || '';
    html.style.backgroundColor = 'transparent';
  };

  // 还原 html 背景色
  const restoreHtmlBackground = () => {
    const html = document.documentElement;
    html.style.backgroundColor = originalBgColorRef.current;
  };

  // 检查并请求相机权限
  const checkAndRequestPermission = async (): Promise<boolean> => {
    let permission = await checkMobileCameraPermission();
    if (!permission) {
      permission = await requestMobileCameraPermission();
    }
    return permission;
  };

  // 开始扫描
  useEffect(() => {
    let isMounted = true;
    scanAbortedRef.current = false;
    // 使用 setTimeout 避免同步 setState
    setTimeout(() => {
      if (isMounted) setIsCameraReady(false);
    }, 0);

    async function startScan() {
      try {
        setIsScanning(true);
        setError(null);

        // 检查并请求权限
        const hasPermission = await checkAndRequestPermission();
        if (!hasPermission || scanAbortedRef.current) {
          if (!hasPermission) {
            setError('需要相机权限才能扫描二维码，请在设置中允许访问相机');
            setTimeout(() => onCancel(), 2000);
          }
          return;
        }

        // 优先使用窗口模式（windowed: true）
        try {
          // 启动扫描后，相机应该已经准备好，设置背景透明
          setIsCameraReady(true);
          setHtmlBackgroundTransparent();

          const content = await scanQRCodeWindowed({
            windowed: true,
            camera_direction: 'back',
          });
          if (isMounted && !scanAbortedRef.current) {
            setIsScanning(false);
            restoreHtmlBackground();
            onScanSuccess(content);
          }
        } catch (error: any) {
          if (scanAbortedRef.current) {
            return;
          }

          // 如果窗口模式失败，降级到原生扫描
          console.warn('[MobileQRCodeScanner] 窗口模式扫描失败，降级到原生扫描:', error);

          // 降级到原生扫描，相机也应该已经准备好
          setIsCameraReady(true);
          setHtmlBackgroundTransparent();

          const content = await scanQR();
          if (isMounted && !scanAbortedRef.current) {
            setIsScanning(false);
            restoreHtmlBackground();
            onScanSuccess(content);
          }
        }
      } catch (error: any) {
        if (!isMounted || scanAbortedRef.current) return;

        setIsScanning(false);
        const errorMessage = error?.message || error?.toString() || '未知错误';

        // 如果是用户取消，不显示错误
        if (
          errorMessage.includes('cancel') ||
          errorMessage.includes('取消') ||
          errorMessage.includes('User cancelled') ||
          errorMessage.includes('cancelled')
        ) {
          return;
        }

        console.error('[MobileQRCodeScanner] 扫描失败:', error);
        setError(errorMessage);
      }
    }

    startScan();

    return () => {
      isMounted = false;
      scanAbortedRef.current = true;
      setIsScanning(false);
      setIsCameraReady(false);

      // 还原 html 背景色
      restoreHtmlBackground();

      // 组件卸载时取消扫描，关闭相机
      cancelScanQR().catch((error) => {
        console.error('[MobileQRCodeScanner] 组件卸载时取消扫描失败:', error);
      });
    };
  }, [onScanSuccess, onCancel]);

  const handleCancel = async () => {
    scanAbortedRef.current = true;
    setIsScanning(false);
    setIsCameraReady(false);

    // 还原 html 背景色
    restoreHtmlBackground();

    // 取消正在进行的扫描，关闭相机
    try {
      await cancelScanQR();
    } catch (error) {
      console.error('[MobileQRCodeScanner] 取消扫描失败:', error);
    }

    onCancel();
  };

  const errorMessage = error;

  return (
    <div
      style={{
        ...containerStyle,
        backgroundColor: isCameraReady ? 'transparent' : 'rgba(0, 0, 0, 0.8)',
        transition: 'background-color 0.3s ease',
      }}
    >
      <SafeArea position="top" />

      <ScannerHeader onCancel={handleCancel} />

      {/* 扫描内容区域：扫描框是透明"洞"，相机画面会在这里显示 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <ScanContent isScanning={isScanning} hint={hint} error={errorMessage} />
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

export default MobileQRCodeScanner;
