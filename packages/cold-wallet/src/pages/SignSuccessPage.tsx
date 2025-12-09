/**
 * @Author
 * 签名成功页面
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Result, Steps } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import PageLayout from '../components/PageLayout';
import StandardCard from '../components/StandardCard';
import QRCodeCard from '../components/QRCodeCard';
import { useI18n } from '../hooks/useI18n';

// 计算响应式二维码尺寸（签名数据量大，需要更大尺寸）
function getQRCodeSize() {
  const screenWidth = window.innerWidth;
  // 页面 padding 约 32px，卡片 padding 约 48px，留出余量
  const maxSize = Math.min(screenWidth - 100, 300);
  return Math.max(maxSize, 200); // 最小 200px，最大 300px
}

function SignSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signedTx, qrCodeData, currentChain } = (location.state as any) || {};
  const t = useI18n();
  const qrSize = getQRCodeSize();

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
          <QRCodeCard
            data={qrCodeData}
            size={qrSize}
            variant="simple"
            description={
              <>
                {t.signSuccess.scanHint}
                <br />
                {t.signSuccess.broadcastHint.replace('{chain}', currentChain?.toUpperCase() || '')}
              </>
            }
          />
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
