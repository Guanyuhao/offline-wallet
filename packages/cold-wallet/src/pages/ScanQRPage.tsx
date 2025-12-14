/**
 * @Author liyongjie
 * 二维码扫描页面（使用 shared 组件）
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanQRPage as SharedScanQRPage } from '@offline-wallet/shared/components';
import useScanStore from '../stores/useScanStore';
import { useI18n } from '../hooks/useI18n';

/**
 * 冷钱包二维码扫描页面
 */
const ScanQRPage: React.FC = () => {
  const navigate = useNavigate();
  const { scanType, hint, returnPath, setScanResult, clearScanState } = useScanStore();
  const t = useI18n();

  // 扫描成功回调
  const handleScanSuccess = useCallback(
    (content: string) => {
      // 保存扫描结果到 store
      setScanResult(content);
      // 返回上一页
      navigate(returnPath, { replace: false });
    },
    [navigate, returnPath, setScanResult]
  );

  // 取消扫描回调
  const handleCancel = useCallback(() => {
    // 先保存 returnPath，因为清除状态会重置它
    const savedReturnPath = returnPath || '/wallet';
    // 清除扫描结果状态
    clearScanState();
    // 返回上一页
    navigate(savedReturnPath, { replace: false });
  }, [navigate, returnPath, clearScanState]);

  // 返回上一页
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <SharedScanQRPage
      scanType={scanType}
      hint={hint}
      returnPath={returnPath}
      onScanSuccess={handleScanSuccess}
      onCancel={handleCancel}
      onBack={handleBack}
      texts={{
        title: t.scanQR.title,
        configError: t.scanQR.configError,
        enterCorrectly: t.scanQR.enterCorrectly,
        orRetry: t.scanQR.orRetry,
        goBack: t.scanQR.goBack,
      }}
    />
  );
};

export default ScanQRPage;
