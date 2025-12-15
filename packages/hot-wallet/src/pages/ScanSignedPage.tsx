import { useState, useEffect } from 'react';
import { Button, Toast, Result } from 'antd-mobile';
import { ScanningOutline } from 'antd-mobile-icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PageLayout, StandardCard } from '@offline-wallet/shared/components';
import { QRCodeProtocol, QRCodeType } from '@offline-wallet/shared/types';
import { useI18n } from '../hooks/useI18n';
import useAddressStore from '../stores/useAddressStore';
import useScanStore, { ScanType } from '../stores/useScanStore';
import { useBroadcastTransaction } from '../hooks/useTransactions';

function ScanSignedPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useI18n();
  const { getAddressById } = useAddressStore();
  const address = id ? getAddressById(id) : null;
  const { broadcast, broadcasting } = useBroadcastTransaction();
  const [signedTx, setSignedTx] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const txInfo = location.state?.txInfo;

  // 扫描 Store
  const { scanResult, scanSuccess, scanType, setScanConfig, clearScanState } = useScanStore();

  // 处理扫描结果（签名交易）
  useEffect(() => {
    if (scanSuccess && scanResult && scanType === ScanType.SIGNED_TRANSACTION && address) {
      handleScanResult(scanResult);
      clearScanState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanSuccess, scanResult, scanType]);

  // 处理扫描结果
  const handleScanResult = (qrData: string) => {
    try {
      // 解析二维码
      const parsed = QRCodeProtocol.decode(qrData);

      // 验证是签名交易
      if (parsed.type !== QRCodeType.SIGNED_TRANSACTION) {
        Toast.show({ content: t.scanSigned.invalidQR || '无效的签名交易二维码', icon: 'fail' });
        return;
      }

      // 验证链匹配
      if (!address || parsed.chain !== address.chain) {
        Toast.show({ content: t.scanSigned.chainMismatch || '链类型不匹配', icon: 'fail' });
        return;
      }

      // 验证签名有效期（1分钟 = 60000毫秒）
      const SIGN_EXPIRE_TIME = 60 * 1000;
      const signedTime = parsed.timestamp || 0;
      const currentTime = Date.now();
      if (currentTime - signedTime > SIGN_EXPIRE_TIME) {
        Toast.show({
          content: t.scanSigned.signExpired || '签名已过期，请重新签名',
          icon: 'fail',
        });
        return;
      }

      setSignedTx(parsed.signedTx);
      setTxHash(parsed.txHash);

      Toast.show({ content: t.scanSigned.scanSuccess || '扫描成功', icon: 'success' });
    } catch (error) {
      console.error('解析二维码失败:', error);
      Toast.show({ content: `${t.scanSigned.scanFailed || '扫描失败'}: ${error}`, icon: 'fail' });
    }
  };

  if (!address) {
    return (
      <PageLayout title={t.scanSigned.title} onBack={() => navigate('/')}>
        <Result status="error" title="地址不存在" />
      </PageLayout>
    );
  }

  // 跳转到扫描页面
  const handleScan = () => {
    setScanConfig({
      scanType: ScanType.SIGNED_TRANSACTION,
      hint: t.scanSigned.scanHint || '请扫描冷钱包签名后的交易二维码',
      returnPath: `/scan-signed/${id}`,
      callbackData: { txInfo },
    });
    navigate('/scan-qr', { replace: true });
  };

  // 广播交易
  const handleBroadcast = async () => {
    if (!signedTx) return;

    try {
      const hash = await broadcast(address.chain, signedTx);

      // 跳转到结果页面
      navigate('/broadcast-result', {
        state: {
          success: true,
          txHash: hash,
          chain: address.chain,
          txInfo,
        },
        replace: true,
      });
    } catch (error) {
      console.error('广播失败:', error);
      navigate('/broadcast-result', {
        state: {
          success: false,
          error: String(error),
          chain: address.chain,
          txInfo,
        },
        replace: true,
      });
    }
  };

  return (
    <PageLayout title={t.scanSigned.title} onBack={() => navigate('/')}>
      <StandardCard style={{ marginBottom: '16px' }}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📷</div>
          <div style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 500 }}>
            {t.scanSigned.title}
          </div>
          <div
            style={{ fontSize: '14px', color: 'var(--app-subtitle-color)', marginBottom: '24px' }}
          >
            {t.scanSigned.scanHint}
          </div>

          {!signedTx ? (
            <Button
              color="primary"
              size="large"
              onClick={handleScan}
              style={{ borderRadius: '12px', height: '50px', fontSize: '17px', minWidth: '200px' }}
            >
              <ScanningOutline fontSize={20} style={{ marginRight: '8px' }} />
              {t.home.scanQRCode}
            </Button>
          ) : (
            <div
              style={{
                background: 'var(--adm-color-fill-content)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
              >
                <span style={{ color: 'var(--adm-color-success)', fontSize: '20px' }}>✓</span>
                <span style={{ fontWeight: 500 }}>
                  {t.scanSigned.signedTxReceived || '已获取签名交易'}
                </span>
              </div>
              {txHash && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--app-subtitle-color)',
                    fontFamily: 'monospace',
                  }}
                >
                  Hash: {txHash.slice(0, 16)}...{txHash.slice(-8)}
                </div>
              )}
            </div>
          )}
        </div>
      </StandardCard>

      {signedTx && (
        <StandardCard>
          <Button
            color="primary"
            block
            size="large"
            loading={broadcasting}
            onClick={handleBroadcast}
            style={{ borderRadius: '12px', height: '50px', fontSize: '17px' }}
          >
            {broadcasting ? t.scanSigned.broadcasting : t.broadcast.broadcast || '广播交易'}
          </Button>
          <Button
            block
            size="large"
            onClick={handleScan}
            style={{ borderRadius: '12px', height: '50px', fontSize: '17px', marginTop: '12px' }}
          >
            {t.scanSigned.rescan || '重新扫描'}
          </Button>
        </StandardCard>
      )}
    </PageLayout>
  );
}

export default ScanSignedPage;
