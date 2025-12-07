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

function SignSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signedTx, qrCodeData, currentChain } = (location.state as any) || {};

  const handleReset = () => {
    navigate('/sign');
  };

  return (
    <PageLayout
      title="签名成功"
      onBack={() => navigate('/sign')}
      navBarProps={{ backIcon: <CloseOutline /> }}
    >
      <StandardCard>
        <Result
          status="success"
          title="签名成功"
          description="签名后的交易已生成，请使用热钱包扫描二维码广播交易"
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
                使用热钱包扫描此二维码
                <br />
                将签名后的交易广播到 {currentChain?.toUpperCase() || ''} 网络
              </>
            }
          />
        </StandardCard>
      ) : (
        <StandardCard style={{ marginTop: '16px' }}>
          <div style={{ padding: '20px', textAlign: 'center', color: '#ff4d4f' }}>
            <p>二维码生成失败，请检查控制台日志</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              签名数据: {signedTx?.substring(0, 100)}...
            </p>
          </div>
        </StandardCard>
      )}

      <StandardCard style={{ marginTop: '16px' }}>
        <Steps direction="vertical">
          <Steps.Step title="签名完成" description="交易已在冷钱包中完成签名" status="process" />
          <Steps.Step
            title="热钱包扫描广播交易"
            description="使用热钱包扫描上方二维码，将签名后的交易广播到区块链"
            status="wait"
          />
          <Steps.Step
            title="交易成功"
            description="交易被成功广播并确认后，将显示在区块链上"
            status="wait"
          />
        </Steps>
      </StandardCard>

      <StandardCard style={{ marginTop: '16px' }}>
        <Button color="default" block onClick={handleReset}>
          重新签名
        </Button>
      </StandardCard>
    </PageLayout>
  );
}

export default SignSuccessPage;
