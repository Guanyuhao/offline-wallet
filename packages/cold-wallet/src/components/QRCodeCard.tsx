import React from 'react';
import QRCodeDisplay from './QRCodeDisplay';

interface QRCodeCardProps {
  /** 二维码数据 */
  data: string;
  /** 二维码尺寸，默认 240 */
  size?: number;
  /** 标题 */
  title?: string;
  /** 描述文本 */
  description?: string | React.ReactNode;
  /** 样式变体：'simple' 简单样式，'enhanced' 增强样式（带渐变背景） */
  variant?: 'simple' | 'enhanced';
  /** 自定义容器样式 */
  containerStyle?: React.CSSProperties;
  /** 是否显示中心 logo */
  showLogo?: boolean;
  /** 自定义 logo URL（默认使用 App icon） */
  logoUrl?: string;
  /** logo 占二维码的比例（0.1-0.3，默认 0.2） */
  logoSizeRatio?: number;
}

// 默认使用 App icon
const DEFAULT_LOGO = '/icon.png';

/**
 * 二维码卡片组件
 * 用于统一显示收款和签名交易的二维码
 */
function QRCodeCard({
  data,
  size = 240,
  title,
  description,
  variant = 'enhanced',
  containerStyle,
  showLogo = true,
  logoUrl,
  logoSizeRatio = 0.2,
}: QRCodeCardProps) {
  const isEnhanced = variant === 'enhanced';
  const logo = showLogo ? logoUrl || DEFAULT_LOGO : undefined;

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    padding: '24px',
    ...containerStyle,
  };

  const qrCodeContainerStyle: React.CSSProperties = isEnhanced
    ? {
        padding: '32px',
        background: 'var(--adm-color-fill-content)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        border: '2px solid var(--adm-color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }
    : {
        padding: '24px',
        background: 'var(--adm-color-box)',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid var(--adm-color-border)',
      };

  const innerContainerStyle: React.CSSProperties = isEnhanced
    ? {
        padding: '16px',
        background: 'var(--adm-color-box)',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      }
    : {};

  const descriptionStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    color: 'var(--app-subtitle-color)',
    textAlign: 'center',
    lineHeight: '1.5',
  };

  return (
    <div style={wrapperStyle}>
      {title && (
        <div
          style={{
            textAlign: 'center',
            width: '100%',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--app-title-color)',
              marginBottom: '8px',
            }}
          >
            {title}
          </h2>
        </div>
      )}

      <div style={qrCodeContainerStyle}>
        {isEnhanced ? (
          <div style={innerContainerStyle}>
            <QRCodeDisplay data={data} size={size} logo={logo} logoSizeRatio={logoSizeRatio} />
          </div>
        ) : (
          <QRCodeDisplay data={data} size={size} logo={logo} logoSizeRatio={logoSizeRatio} />
        )}
      </div>

      {description && <p style={descriptionStyle}>{description}</p>}
    </div>
  );
}

export default QRCodeCard;
