/**
 * @Author liyongjie
 * Web API 扫描器（桌面端）
 */

import type { IScanner, ScanOptions } from './types';
import { getCameraStream, isGetUserMediaSupported } from '../camera-scanner';
import { startContinuousQRScan } from '../qr-detector';

/**
 * Web API 扫描器实现
 */
export class WebScanner implements IScanner {
  private stream: MediaStream | null = null;
  private stopScan: (() => void) | null = null;

  /**
   * 检查权限（Web API 通过 getUserMedia 自动处理）
   */
  async checkPermission(): Promise<boolean> {
    return isGetUserMediaSupported();
  }

  /**
   * 请求权限（Web API 通过 getUserMedia 自动处理）
   */
  async requestPermission(): Promise<boolean> {
    return isGetUserMediaSupported();
  }

  /**
   * 开始扫描
   */
  async scan(options: ScanOptions = {}): Promise<string> {
    const { videoElement, canvasElement } = options;

    if (!videoElement || !canvasElement) {
      throw new Error('桌面端扫描需要提供 video 和 canvas 元素');
    }

    if (!isGetUserMediaSupported()) {
      throw new Error('当前浏览器不支持相机访问');
    }

    return new Promise((resolve, reject) => {
      // 获取相机流
      getCameraStream()
        .then((cameraStream) => {
          console.log('[WebScanner] 相机流获取成功');
          this.stream = cameraStream;

          // 将流绑定到 video 元素
          videoElement.srcObject = cameraStream;
          videoElement
            .play()
            .then(() => {
              console.log('[WebScanner] 视频开始播放');
              // 等待视频元数据加载
              const waitForMetadata = () => {
                if (videoElement.readyState >= videoElement.HAVE_METADATA) {
                  console.log('[WebScanner] 视频元数据加载完成', {
                    videoWidth: videoElement.videoWidth,
                    videoHeight: videoElement.videoHeight,
                    canvasWidth: canvasElement.width,
                    canvasHeight: canvasElement.height,
                  });

                  // 设置 Canvas 尺寸与视频一致
                  canvasElement.width = videoElement.videoWidth;
                  canvasElement.height = videoElement.videoHeight;

                  console.log('[WebScanner] Canvas 尺寸已设置', {
                    width: canvasElement.width,
                    height: canvasElement.height,
                  });

                  // 开始持续扫描
                  this.stopScan = startContinuousQRScan(
                    videoElement,
                    canvasElement,
                    (content) => {
                      console.log('[WebScanner] 扫描成功:', content);
                      this.cleanup();
                      resolve(content);
                    },
                    (error) => {
                      console.error('[WebScanner] 扫描错误:', error);
                      this.cleanup();
                      reject(error);
                    }
                  );
                } else {
                  requestAnimationFrame(waitForMetadata);
                }
              };
              waitForMetadata();
            })
            .catch((playError) => {
              console.error('[WebScanner] 视频播放失败:', playError);
              reject(playError);
            });
        })
        .catch((streamError) => {
          console.error('[WebScanner] 获取相机流失败:', streamError);
          reject(streamError);
        });
    });
  }

  /**
   * 取消扫描
   */
  async cancel(): Promise<void> {
    this.cleanup();
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.stopScan) {
      this.stopScan();
      this.stopScan = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }
}
