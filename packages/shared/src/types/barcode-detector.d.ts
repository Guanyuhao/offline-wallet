/**
 * @Author liyongjie
 * BarcodeDetector API 类型定义
 */

interface BarcodeDetectorOptions {
  formats: string[];
}

interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  rawValue: string;
  format: string;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
}

interface BarcodeDetector {
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: BarcodeDetectorOptions): BarcodeDetector;
}

declare var BarcodeDetector: BarcodeDetectorConstructor | undefined;
