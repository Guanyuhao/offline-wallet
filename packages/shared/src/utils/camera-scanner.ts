/**
 * @Author liyongjie
 * 相机工具函数（桌面端 Web API）
 * 仅用于桌面端，移动端使用 Tauri barcode-scanner 插件
 */

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
 * 请求相机权限并获取视频流（桌面端）
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
