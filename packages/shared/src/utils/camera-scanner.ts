/**
 * @Author liyongjie
 * 相机扫描工具函数
 * 使用 Web API (getUserMedia + BarcodeDetector) 实现相机画面 + Web UI 方案
 */

/// <reference path="../types/barcode-detector.d.ts" />

/**
 * 检查浏览器是否支持 BarcodeDetector API
 */
export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

/**
 * 检查浏览器是否支持 getUserMedia API
 */
export function isGetUserMediaSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getUserMedia' in navigator.mediaDevices
  );
}

/**
 * 请求相机权限并获取视频流
 */
export async function getCameraStream(
  constraints: MediaStreamConstraints = { video: { facingMode: 'environment' } }
): Promise<MediaStream> {
  if (!isGetUserMediaSupported()) {
    throw new Error('当前浏览器不支持相机访问');
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('相机权限被拒绝，请在设置中允许访问相机');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      throw new Error('未找到可用的相机设备');
    } else {
      throw new Error(`相机访问失败: ${error.message || '未知错误'}`);
    }
  }
}

/**
 * 创建 BarcodeDetector 实例
 */
export function createBarcodeDetector(formats: string[] = ['qr_code']): BarcodeDetector | null {
  if (!isBarcodeDetectorSupported() || typeof BarcodeDetector === 'undefined') {
    return null;
  }

  try {
    return new BarcodeDetector({ formats });
  } catch (error) {
    console.error('创建 BarcodeDetector 失败:', error);
    return null;
  }
}

/**
 * 从视频流中检测二维码
 */
export async function detectQRCodeFromStream(
  videoElement: HTMLVideoElement,
  barcodeDetector: BarcodeDetector | null
): Promise<string | null> {
  if (!barcodeDetector) {
    throw new Error('BarcodeDetector 不支持，请使用 Tauri barcode-scanner 插件');
  }

  if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
    return null;
  }

  try {
    const barcodes = await barcodeDetector.detect(videoElement);
    if (barcodes.length > 0) {
      return barcodes[0].rawValue;
    }
    return null;
  } catch (error) {
    console.error('检测二维码失败:', error);
    return null;
  }
}

/**
 * 开始持续扫描二维码
 */
export function startContinuousScan(
  videoElement: HTMLVideoElement,
  barcodeDetector: BarcodeDetector | null,
  onDetect: (content: string) => void,
  onError?: (error: Error) => void
): () => void {
  let isScanning = true;
  let animationFrameId: number | null = null;

  const scan = async () => {
    if (!isScanning) {
      return;
    }

    try {
      const content = await detectQRCodeFromStream(videoElement, barcodeDetector);
      if (content) {
        isScanning = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        onDetect(content);
        return;
      }
    } catch (error: any) {
      isScanning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      return;
    }

    if (isScanning) {
      animationFrameId = requestAnimationFrame(scan);
    }
  };

  // 等待视频开始播放
  const handlePlay = () => {
    scan();
  };

  videoElement.addEventListener('play', handlePlay, { once: true });

  // 如果视频已经在播放，立即开始扫描
  if (videoElement.readyState >= videoElement.HAVE_CURRENT_DATA) {
    scan();
  }

  // 返回停止扫描的函数
  return () => {
    isScanning = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    videoElement.removeEventListener('play', handlePlay);
  };
}
