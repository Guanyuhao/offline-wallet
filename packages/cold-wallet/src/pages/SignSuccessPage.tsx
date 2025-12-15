/**
 * @Author
 * 签名成功页面
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Result, Steps } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import { PageLayout, StandardCard, QRCodeCard } from '@offline-wallet/shared/components';
import { useI18n } from '../hooks/useI18n';

// 计算响应式二维码尺寸（签名数据量大，需要更大尺寸）
function getQRCodeSize() {
  const screenWidth = window.innerWidth;
  // 页面 padding 约 32px，卡片 padding 约 48px，留出余量
  const maxSize = Math.min(screenWidth - 100, 300);
  return Math.max(maxSize, 200); // 最小 200px，最大 300px
}

// 签名有效期（秒）
const SIGN_EXPIRE_SECONDS = 60;

interface LocationState {
  signedTx?: string;
  qrCodeData?: string;
  currentChain?: string;
}

function SignSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signedTx, qrCodeData, currentChain } = (location.state as LocationState) || {};
  const t = useI18n();
  const qrSize = getQRCodeSize();

  // 倒计时状态
  const [countdown, setCountdown] = useState(SIGN_EXPIRE_SECONDS);
  const [expired, setExpired] = useState(false);
  const expiredRef = useRef(false);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        // 使用 setTimeout 来避免在 useEffect 中同步调用 setState
        setTimeout(() => setExpired(true), 0);
      }
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (!expiredRef.current) {
            expiredRef.current = true;
            setTimeout(() => setExpired(true), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleReset = () => {
    navigate('/sign');
  };

  return (
    <PageLayout
      title={t.signSuccess.title}
      onBack={() => navigate('/sign')}
      navBarProps={{ backIcon: <CloseOutline /> }}
    >
      <StandardCard>
        <Result
          status="success"
          title={t.signSuccess.title}
          description={t.signSuccess.description}
        />
      </StandardCard>

      {qrCodeData ? (
        <StandardCard style={{ marginTop: '16px' }}>
          {/* 倒计时提示 */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: expired
                ? 'var(--adm-color-danger)'
                : countdown <= 10
                  ? 'var(--adm-color-warning)'
                  : 'var(--adm-color-primary)',
              color: '#fff',
              fontSize: '14px',
            }}
          >
            {expired ? (
              <>{t.signSuccess?.expired || '签名已过期，请重新签名'}</>
            ) : (
              <>
                {t.signSuccess?.validFor || '有效期'}: <strong>{countdown}</strong>{' '}
                {t.signSuccess?.seconds || '秒'}
              </>
            )}
          </div>

          {!expired ? (
            <QRCodeCard
              data={qrCodeData}
              size={qrSize}
              variant="simple"
              description={
                <>
                  {t.signSuccess.scanHint}
                  <br />
                  {t.signSuccess.broadcastHint.replace(
                    '{chain}',
                    currentChain?.toUpperCase() || ''
                  )}
                </>
              }
            />
          ) : (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--adm-color-danger)',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
              <p style={{ marginBottom: '16px' }}>
                {t.signSuccess?.expiredHint || '二维码已过期，请重新签名'}
              </p>
              <Button color="primary" onClick={handleReset}>
                {t.signSuccess.resignButton}
              </Button>
            </div>
          )}
        </StandardCard>
      ) : (
        <StandardCard style={{ marginTop: '16px' }}>
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--adm-color-danger)' }}>
            <p>{t.signSuccess.qrError}</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              {t.signSuccess.signedData} {signedTx?.substring(0, 100)}...
            </p>
          </div>
        </StandardCard>
      )}

      <StandardCard style={{ marginTop: '16px' }}>
        <Steps direction="vertical">
          <Steps.Step
            title={t.signSuccess.stepComplete}
            description={t.signSuccess.stepCompleteDesc}
            status="process"
          />
          <Steps.Step
            title={t.signSuccess.stepBroadcast}
            description={t.signSuccess.stepBroadcastDesc}
            status="wait"
          />
          <Steps.Step
            title={t.signSuccess.stepSuccess}
            description={t.signSuccess.stepSuccessDesc}
            status="wait"
          />
        </Steps>
      </StandardCard>

      <StandardCard style={{ marginTop: '16px' }}>
        <Button color="default" block onClick={handleReset}>
          {t.signSuccess.resignButton}
        </Button>
      </StandardCard>
    </PageLayout>
  );
}

export default SignSuccessPage;
