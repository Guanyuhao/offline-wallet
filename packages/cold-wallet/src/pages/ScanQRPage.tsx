/**
 * @Author liyongjie
 * 二维码扫描页面
 *
 * 移动端使用独立页面，确保相机画面能正常显示
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd-mobile';
import { detectPlatform, isMobilePlatform } from '@offline-wallet/shared/utils/platform';
import MobileQRCodeScanner from '@offline-wallet/shared/components/QRCodeScanner/MobileQRCodeScanner';
import DesktopQRCodeScanner from '@offline-wallet/shared/components/QRCodeScanner/DesktopQRCodeScanner';
import useScanStore from '../stores/useScanStore';
import PageLayout from '../components/PageLayout';
import StandardCard from '../components/StandardCard';
import { useI18n } from '../hooks/useI18n';

/**
 * 二维码扫描页面
 */
const ScanQRPage: React.FC = () => {
  const navigate = useNavigate();
  const { scanType, hint, returnPath, setScanResult, clearScanState } = useScanStore();
  const [platform, setPlatform] = React.useState<string | null>(null);
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  const t = useI18n();

  // 如果没有扫描配置，显示友好提示
  if (!scanType) {
    return (
      <PageLayout title={t.scanQR.title} onBack={() => navigate(-1)}>
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
              {t.scanQR.configError}
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
              {t.scanQR.enterCorrectly}
              <br />
              {t.scanQR.orRetry}
            </p>
            <Button
              color="primary"
              block
              onClick={() => navigate(-1)}
              style={{ maxWidth: '200px', borderRadius: '8px' }}
            >
              {t.scanQR.goBack}
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
  const handleScanSuccess = React.useCallback(
    (content: string) => {
      console.log('[ScanQRPage] 扫描成功，返回结果:', content, '扫描类型:', scanType);
      // 保存扫描结果到 store
      setScanResult(content);
      // 返回上一页
      navigate(returnPath, { replace: false });
    },
    [navigate, returnPath, scanType, setScanResult]
  );

  // 取消扫描回调
  const handleCancel = React.useCallback(() => {
    console.log('[ScanQRPage] 取消扫描，返回上一页');
    // 先保存 returnPath，因为清除状态会重置它
    const savedReturnPath = returnPath || '/wallet';
    // 清除扫描结果状态（但不清除配置，因为我们需要 returnPath 来返回）
    clearScanState();
    // 返回上一页
    navigate(savedReturnPath, { replace: false });
  }, [navigate, returnPath, clearScanState]);

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
