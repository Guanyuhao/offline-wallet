import { useEffect, useState } from 'react';
import { Image } from 'antd-mobile';
import { invoke } from '@tauri-apps/api/core';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
}

function QRCodeDisplay({ data, size = 256 }: QRCodeDisplayProps) {
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function generateQR() {
      try {
        setLoading(true);
        const base64 = await invoke<string>('generate_qrcode', {
          data,
          size,
        });
        // Rust 返回的是纯 base64 字符串，需要添加 data URI 前缀
        setQrCodeBase64(base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`);
      } catch (error) {
        console.error('生成二维码失败:', error);
      } finally {
        setLoading(false);
      }
    }
    generateQR();
  }, [data, size]);

  if (loading) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          borderRadius: '8px',
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
          background: '#f5f5f5',
          borderRadius: '8px',
          color: '#999',
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
        background: '#ffffff',
      }}
    />
  );
}

export default QRCodeDisplay;
