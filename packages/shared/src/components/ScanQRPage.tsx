/**
 * @Author liyongjie
 * 通用二维码扫描页面组件
 *
 * 移动端使用独立页面，确保相机画面能正常显示
 * 可在冷钱包和热钱包中复用
 */

import React, { useEffect, useCallback, useState } from 'react';
import { Button } from 'antd-mobile';
import { detectPlatform, isMobilePlatform } from '../utils/platform';
import MobileQRCodeScanner from './QRCodeScanner/MobileQRCodeScanner';
import DesktopQRCodeScanner from './QRCodeScanner/DesktopQRCodeScanner';
import PageLayout from './PageLayout';
import StandardCard from './StandardCard';

export interface ScanQRPageTexts {
  title: string;
  configError: string;
  enterCorrectly: string;
  orRetry: string;
  goBack: string;
}

export interface ScanQRPageProps {
  /** 扫描类型，用于判断是否有有效的扫描配置 */
  scanType: string | null;
  /** 扫描提示文字 */
  hint?: string;
  /** 返回路径 */
  returnPath: string;
  /** 扫描成功回调 */
  onScanSuccess: (content: string) => void;
  /** 取消扫描回调 */
  onCancel: () => void;
  /** 返回上一页 */
  onBack: () => void;
  /** 国际化文本 */
  texts: ScanQRPageTexts;
}

/**
 * 通用二维码扫描页面
 */
const ScanQRPage: React.FC<ScanQRPageProps> = ({
  scanType,
  hint,
  returnPath,
  onScanSuccess,
  onCancel,
  onBack,
  texts,
}) => {
  const [platform, setPlatform] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // 如果没有扫描配置，显示友好提示
  if (!scanType) {
    return (
      <PageLayout title={texts.title} onBack={onBack}>
        <StandardCard>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '20px',
                color: 'var(--adm-color-danger)',
              }}
            >
              ⚠️
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--app-title-color)',
                marginBottom: '12px',
              }}
            >
              {texts.configError}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '15px',
                color: 'var(--app-subtitle-color)',
                marginBottom: '32px',
                lineHeight: '1.5',
              }}
            >
              {texts.enterCorrectly}
              <br />
              {texts.orRetry}
            </p>
            <Button
              color="primary"
              block
              onClick={onBack}
              style={{ maxWidth: '200px', borderRadius: '8px' }}
            >
              {texts.goBack}
            </Button>
          </div>
        </StandardCard>
      </PageLayout>
    );
  }

  // 初始化平台检测
  useEffect(() => {
    detectPlatform()
      .then((p) => {
        console.log('[ScanQRPage] 检测到的平台:', p);
        setPlatform(p);
        setIsMobile(isMobilePlatform(p));
      })
      .catch((error) => {
        console.error('[ScanQRPage] 平台检测失败:', error);
        // 默认使用桌面端（降级方案）
        setPlatform('macOS');
        setIsMobile(false);
      });
  }, []);

  // 扫描成功回调
  const handleScanSuccess = useCallback(
    (content: string) => {
      console.log('[ScanQRPage] 扫描成功，返回结果:', content, '扫描类型:', scanType);
      onScanSuccess(content);
    },
    [scanType, onScanSuccess]
  );

  // 取消扫描回调
  const handleCancel = useCallback(() => {
    console.log('[ScanQRPage] 取消扫描');
    onCancel();
  }, [onCancel]);

  // 平台未检测完成时，不渲染任何内容
  if (platform === null) {
    return null;
  }

  // 根据平台选择对应的扫描组件
  if (isMobile) {
    return (
      <MobileQRCodeScanner onScanSuccess={handleScanSuccess} onCancel={handleCancel} hint={hint} />
    );
  }

  return (
    <DesktopQRCodeScanner onScanSuccess={handleScanSuccess} onCancel={handleCancel} hint={hint} />
  );
};

export default ScanQRPage;
