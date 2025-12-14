import { useEffect, useState } from 'react';
import { Image } from 'antd-mobile';
import { invoke } from '@tauri-apps/api/core';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  /** logo 图片的 base64 或 URL（可选） */
  logo?: string;
  /** logo 占二维码的比例（0.1-0.3，默认 0.2） */
  logoSizeRatio?: number;
}

function QRCodeDisplay({ data, size = 256, logo, logoSizeRatio = 0.2 }: QRCodeDisplayProps) {
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  // 预加载 logo 并转换为 base64
  useEffect(() => {
    if (!logo) {
      setLogoBase64(null);
      return;
    }

    // 如果已经是 base64，直接使用
    if (logo.startsWith('data:')) {
      setLogoBase64(logo.split(',')[1] || logo);
      return;
    }

    // 如果是 URL，加载并转换
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        setLogoBase64(dataUrl.split(',')[1]);
      }
    };
    img.src = logo;
  }, [logo]);

  useEffect(() => {
    async function generateQR() {
      try {
        setLoading(true);
        let base64: string;

        if (logoBase64) {
          // 使用带 logo 的二维码生成
          base64 = await invoke<string>('generate_qrcode_with_logo', {
            data,
            size,
            logoBase64,
            logoSizeRatio,
          });
        } else {
          // 使用普通二维码生成
          base64 = await invoke<string>('generate_qrcode', {
            data,
            size,
          });
        }

        // Rust 返回的是纯 base64 字符串，需要添加 data URI 前缀
        setQrCodeBase64(base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`);
      } catch (error) {
        console.error('生成二维码失败:', error);
      } finally {
        setLoading(false);
      }
    }

    // 如果需要 logo 但还没加载完成，等待
    if (logo && logoBase64 === null) {
      return;
    }

    generateQR();
  }, [data, size, logo, logoBase64, logoSizeRatio]);

  if (loading) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--adm-color-fill-content)',
          borderRadius: '8px',
          color: 'var(--app-subtitle-color)',
        }}
      >
        生成中...
      </div>
    );
  }

  if (!qrCodeBase64) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--adm-color-fill-content)',
          borderRadius: '8px',
          color: 'var(--app-subtitle-color)',
        }}
      >
        生成失败
      </div>
    );
  }

  return (
    <Image
      src={qrCodeBase64}
      alt="QR Code"
      style={{
        width: size,
        height: size,
        borderRadius: '12px',
        display: 'block',
        background: 'var(--adm-color-box)',
      }}
    />
  );
}

export default QRCodeDisplay;
