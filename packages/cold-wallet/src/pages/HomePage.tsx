import { useEffect, useState } from 'react';
import { Button, Grid } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import useWalletStore from '../stores/useWalletStore';
import PageLayout from '../components/PageLayout';
import StandardCard from '../components/StandardCard';
import { hasMnemonic } from '../utils/stronghold';
import { useI18n } from '../hooks/useI18n';

function HomePage() {
  const navigate = useNavigate();
  const { setHasWallet } = useWalletStore();
  const [checking, setChecking] = useState(true);
  const t = useI18n();

  useEffect(() => {
    checkWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkWallet = async () => {
    try {
      const exists = await hasMnemonic();
      setHasWallet(exists);
      if (exists) {
        // 使用 setTimeout 延迟导航，避免闪动
        setTimeout(() => {
          navigate('/unlock');
        }, 0);
      }
    } catch (error) {
      console.error('检查钱包失败:', error);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {t.home.checking}
      </div>
    );
  }

  return (
    <PageLayout>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <StandardCard
          style={{
            width: '100%',
            maxWidth: '400px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
              alignItems: 'center',
              padding: '8px',
            }}
          >
            <div style={{ fontSize: '72px' }}>🔒</div>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600, color: '#1d1d1f' }}>
                {t.home.title}
              </h1>
              <p
                style={{
                  marginTop: '8px',
                  color: '#86868b',
                  fontSize: '17px',
                  lineHeight: '1.5',
                }}
              >
                {t.home.description.split('\n').map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < t.home.description.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>

            <Grid columns={2} gap={12} style={{ width: '100%' }}>
              <Grid.Item>
                <Button
                  color="primary"
                  block
                  size="large"
                  onClick={() => navigate('/create')}
                  style={{
                    borderRadius: '12px',
                    height: '50px',
                    fontSize: '17px',
                    fontWeight: 500,
                  }}
                >
                  {t.home.createWallet}
                </Button>
              </Grid.Item>
              <Grid.Item>
                <Button
                  color="default"
                  block
                  size="large"
                  onClick={() => navigate('/import')}
                  style={{
                    borderRadius: '12px',
                    height: '50px',
                    fontSize: '17px',
                    fontWeight: 500,
                  }}
                >
                  {t.home.importWallet}
                </Button>
              </Grid.Item>
            </Grid>

            <div
              style={{
                width: '100%',
                padding: '16px',
                background: '#f5f5f7',
                borderRadius: '12px',
                fontSize: '15px',
                color: '#86868b',
                lineHeight: '1.6',
              }}
            >
              <p style={{ margin: 0, fontWeight: 600, color: '#1d1d1f', marginBottom: '8px' }}>
                {t.home.securityTitle}
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>{t.home.securityTip1}</li>
                <li>{t.home.securityTip2}</li>
                <li>{t.home.securityTip3}</li>
              </ul>
            </div>
          </div>
        </StandardCard>
      </div>
    </PageLayout>
  );
}

export default HomePage;
