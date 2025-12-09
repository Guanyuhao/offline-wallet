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

function SignSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signedTx, qrCodeData, currentChain } = (location.state as any) || {};
  const t = useI18n();

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
            size={240}
            variant="enhanced"
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
          <div style={{ padding: '20px', textAlign: 'center', color: '#ff4d4f' }}>
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
