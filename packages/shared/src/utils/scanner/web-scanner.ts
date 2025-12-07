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
          this.stream = cameraStream;

          // 将流绑定到 video 元素
          videoElement.srcObject = cameraStream;
          videoElement.play().then(() => {
            // 等待视频元数据加载
            const waitForMetadata = () => {
              if (videoElement.readyState >= videoElement.HAVE_METADATA) {
                // 设置 Canvas 尺寸与视频一致
                canvasElement.width = videoElement.videoWidth;
                canvasElement.height = videoElement.videoHeight;

                // 开始持续扫描
                this.stopScan = startContinuousQRScan(
                  videoElement,
                  canvasElement,
                  (content) => {
                    this.cleanup();
                    resolve(content);
                  },
                  (error) => {
                    this.cleanup();
                    reject(error);
                  }
                );
              } else {
                requestAnimationFrame(waitForMetadata);
              }
            };
            waitForMetadata();
          });
        })
        .catch(reject);
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
