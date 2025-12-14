import { Button, Result } from 'antd-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import { openUrl } from '@tauri-apps/plugin-opener';
import { PageLayout, StandardCard, AddressDisplay } from '@offline-wallet/shared/components';
import { CHAIN_DISPLAY_NAMES, type ChainType } from '@offline-wallet/shared/config';
import { useI18n } from '../hooks/useI18n';

function BroadcastResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useI18n();

  const { success, txHash, error, chain, txInfo } = (location.state || {}) as {
    success?: boolean;
    txHash?: string;
    error?: string;
    chain?: ChainType;
    txInfo?: { amount?: string; to?: string };
  };

  // 获取区块浏览器 URL
  const getExplorerUrl = (txHash: string, chain: ChainType) => {
    const urls: Record<string, string> = {
      eth: `https://etherscan.io/tx/${txHash}`,
      btc: `https://blockchain.com/btc/tx/${txHash}`,
      sol: `https://solscan.io/tx/${txHash}`,
      bnb: `https://bscscan.com/tx/${txHash}`,
      tron: `https://tronscan.org/#/transaction/${txHash}`,
      kaspa: `https://explorer.kaspa.org/txs/${txHash}`,
    };
    return urls[chain] || '';
  };

  const handleViewOnExplorer = async () => {
    if (!txHash || !chain) return;
    const url = getExplorerUrl(txHash, chain);
    if (url) {
      try {
        await openUrl(url);
      } catch {
        window.open(url, '_blank');
      }
    }
  };

  const handleBackToHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <PageLayout title={t.broadcast.title} showBack={false}>
      <StandardCard style={{ marginBottom: '16px' }}>
        {success ? (
          <Result
            status="success"
            title={t.broadcast.success}
            description={
              <div style={{ marginTop: '16px' }}>
                {txInfo && (
                  <div
                    style={{
                      marginBottom: '16px',
                      textAlign: 'left',
                      background: 'var(--adm-color-fill-content)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '14px', color: 'var(--app-subtitle-color)' }}>
                        {t.send.amount}
                      </span>
                      <span
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: 'var(--adm-color-success)',
                        }}
                      >
                        {txInfo.amount} {chain ? CHAIN_DISPLAY_NAMES[chain] : ''}
                      </span>
                    </div>
                    {txInfo.to && (
                      <div style={{ fontSize: '12px', color: 'var(--app-subtitle-color)' }}>
                        {t.send.to}: {txInfo.to.slice(0, 10)}...{txInfo.to.slice(-8)}
                      </div>
                    )}
                  </div>
                )}
                {txHash && (
                  <div style={{ textAlign: 'left' }}>
                    <div
                      style={{
                        fontSize: '13px',
                        color: 'var(--app-subtitle-color)',
                        marginBottom: '4px',
                      }}
                    >
                      {t.broadcast.txHash}
                    </div>
                    <AddressDisplay
                      address={txHash}
                      full
                      copyable
                      copySuccessText={t.common?.copied || '已复制'}
                    />
                  </div>
                )}
              </div>
            }
          />
        ) : (
          <Result
            status="error"
            title={t.broadcast.failed}
            description={
              <div style={{ marginTop: '8px', color: 'var(--adm-color-danger)', fontSize: '14px' }}>
                {error || t.errors?.unknown || '未知错误'}
              </div>
            }
          />
        )}
      </StandardCard>

      <StandardCard>
        {success && txHash && (
          <Button
            color="primary"
            block
            size="large"
            onClick={handleViewOnExplorer}
            style={{ borderRadius: '12px', height: '50px', fontSize: '17px', marginBottom: '12px' }}
          >
            {t.broadcast.viewOnExplorer}
          </Button>
        )}

        <Button
          block
          size="large"
          color={success ? 'default' : 'primary'}
          onClick={handleBackToHome}
          style={{ borderRadius: '12px', height: '50px', fontSize: '17px' }}
        >
          {t.broadcast.backToHome}
        </Button>

        {!success && (
          <Button
            block
            size="large"
            onClick={() => navigate(-1)}
            style={{ borderRadius: '12px', height: '50px', fontSize: '17px', marginTop: '12px' }}
          >
            {t.broadcast.retry}
          </Button>
        )}
      </StandardCard>
    </PageLayout>
  );
}

export default BroadcastResultPage;
