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
 * 热钱包二维码扫描页面
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
      // 返回指定页面（replace 避免历史堆积）
      navigate(returnPath, { replace: true });
    },
    [navigate, returnPath, setScanResult]
  );

  // 取消扫描或返回（统一使用 returnPath，避免循环）
  const handleCancel = useCallback(() => {
    clearScanState();
    // 使用 replace 替换历史，避免返回循环
    navigate(returnPath || '/', { replace: true });
  }, [navigate, returnPath, clearScanState]);

  // 返回按钮（与取消相同逻辑）
  const handleBack = useCallback(() => {
    clearScanState();
    navigate(returnPath || '/', { replace: true });
  }, [navigate, returnPath, clearScanState]);

  return (
    <SharedScanQRPage
      scanType={scanType}
      hint={hint}
      returnPath={returnPath}
      onScanSuccess={handleScanSuccess}
      onCancel={handleCancel}
      onBack={handleBack}
      texts={{
        title: t.scanQR?.title || '扫描二维码',
        configError: t.scanQR?.configError || '扫描配置错误',
        enterCorrectly: t.scanQR?.enterCorrectly || '请从正确的入口进入扫描页面',
        orRetry: t.scanQR?.orRetry || '或返回重试',
        goBack: t.scanQR?.goBack || '返回',
      }}
    />
  );
};

export default ScanQRPage;
