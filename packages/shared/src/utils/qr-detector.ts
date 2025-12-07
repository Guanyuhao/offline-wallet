/**
 * @Author liyongjie
 * 二维码检测工具函数
 * 使用 jsQR 库进行二维码识别（WASM/纯 JS 实现）
 */

import jsQR from 'jsqr';

/**
 * 从 Canvas ImageData 中检测二维码
 */
export function detectQRCodeFromImageData(imageData: ImageData): string | null {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      return code.data;
    }
    return null;
  } catch (error) {
    console.error('[QRDetector] 检测二维码失败:', error);
    return null;
  }
}

/**
 * 从 Canvas 元素中检测二维码
 */
export function detectQRCodeFromCanvas(
  canvas: HTMLCanvasElement,
  x: number = 0,
  y: number = 0,
  width?: number,
  height?: number
): string | null {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return null;
    }

    const w = width || canvas.width;
    const h = height || canvas.height;
    const imageData = ctx.getImageData(x, y, w, h);

    return detectQRCodeFromImageData(imageData);
  } catch (error) {
    console.error('[QRDetector] 从 Canvas 检测二维码失败:', error);
    return null;
  }
}

/**
 * 从 Video 元素中检测二维码（通过 Canvas 中转）
 */
export function detectQRCodeFromVideo(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  x: number = 0,
  y: number = 0,
  width?: number,
  height?: number
): string | null {
  try {
    // 将视频帧绘制到 Canvas
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return null;
    }

    // 确保 Canvas 尺寸与视频一致
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // 绘制视频帧到 Canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 从 Canvas 检测二维码
    const w = width || canvas.width;
    const h = height || canvas.height;
    const imageData = ctx.getImageData(x, y, w, h);

    return detectQRCodeFromImageData(imageData);
  } catch (error) {
    console.error('[QRDetector] 从 Video 检测二维码失败:', error);
    return null;
  }
}

/**
 * 开始持续扫描二维码（使用 Canvas + jsQR）
 */
export function startContinuousQRScan(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  onDetect: (content: string) => void,
  onError?: (error: Error) => void,
  scanRegion?: { x: number; y: number; width: number; height: number }
): () => void {
  let isScanning = true;
  let animationFrameId: number | null = null;

  const scan = () => {
    if (!isScanning) {
      return;
    }

    try {
      // 检查视频是否准备好
      if (video.readyState < video.HAVE_CURRENT_DATA) {
        animationFrameId = requestAnimationFrame(scan);
        return;
      }

      // 确保视频尺寸有效
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameId = requestAnimationFrame(scan);
        return;
      }

      // 从视频帧检测二维码（这会绘制到 Canvas）
      const content = detectQRCodeFromVideo(
        video,
        canvas,
        scanRegion?.x,
        scanRegion?.y,
        scanRegion?.width,
        scanRegion?.height
      );

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

    // 继续扫描下一帧
    if (isScanning) {
      animationFrameId = requestAnimationFrame(scan);
    }
  };

  // 等待视频开始播放
  const handlePlay = () => {
    scan();
  };

  video.addEventListener('play', handlePlay, { once: true });

  // 如果视频已经在播放，立即开始扫描
  if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
    scan();
  }

  // 返回停止扫描的函数
  return () => {
    isScanning = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    video.removeEventListener('play', handlePlay);
  };
}
