import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Dialog,
  Toast,
  List,
  Skeleton,
  Empty,
  Space,
  PullToRefresh,
  Collapse,
} from 'antd-mobile';
import { DeleteOutline, SendOutline, GlobalOutline } from 'antd-mobile-icons';
import { openUrl } from '@tauri-apps/plugin-opener';
import { PageLayout, StandardCard, AddressDisplay } from '@offline-wallet/shared/components';
import { CHAIN_DISPLAY_NAMES } from '@offline-wallet/shared/config';
import { useI18n } from '../hooks/useI18n';
import useAddressStore from '../stores/useAddressStore';
import { ErrorBlock } from '../components';
import { useBalance } from '../hooks/useBalance';
import { useTransactions } from '../hooks/useTransactions';
import { useTokens } from '../hooks/useTokens';
import { formatBalance, formatBalanceParts } from '../utils/format';

function AddressDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = useI18n();
  const { getAddressById, removeAddress, updateBalance } = useAddressStore();
  const address = id ? getAddressById(id) : null;

  const {
    balance,
    loading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useBalance(address?.chain || 'eth', address?.address || '');

  const {
    transactions,
    loading: txLoading,
    error: txError,
    refetch: refetchTransactions,
  } = useTransactions(address?.chain || 'eth', address?.address || '');

  const {
    tokens,
    loading: tokensLoading,
    error: tokensError,
    refetch: refetchTokens,
  } = useTokens(address?.chain || 'eth', address?.address || '');

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!address) {
      navigate('/');
      return;
    }
  }, [address, navigate]);

  useEffect(() => {
    if (balance && address?.id) {
      // 更新 store 中的余额
      updateBalance(address.id, balance);
    }
  }, [balance, address?.id, updateBalance]);

  if (!address) {
    return null;
  }

  const formatAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExplorerUrl = () => {
    const { chain, address: addr } = address;
    const explorers: Record<string, string> = {
      eth: `https://etherscan.io/address/${addr}`,
      btc: `https://blockchain.com/btc/address/${addr}`,
      sol: `https://solscan.io/account/${addr}`,
      bnb: `https://bscscan.com/address/${addr}`,
      tron: `https://tronscan.org/#/address/${addr}`,
      kaspa: `https://explorer.kaspa.org/addresses/${addr}`,
    };
    return explorers[chain];
  };

  const handleRemove = () => {
    Dialog.confirm({
      content: t.addressDetail.confirmRemove,
      onConfirm: () => {
        removeAddress(address.id);
        Toast.show({
          content: t.common.success,
          icon: 'success',
        });
        navigate('/');
      },
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBalance(), refetchTransactions(), refetchTokens()]);
    setRefreshing(false);
  };

  // 是否支持代币显示
  const supportsTokens = ['eth', 'bnb', 'tron'].includes(address?.chain || '');

  const handleViewOnExplorer = async () => {
    const url = getExplorerUrl();
    if (url) {
      try {
        await openUrl(url);
      } catch (error) {
        console.error('Failed to open URL:', error);
        // 降级使用 window.open
        window.open(url, '_blank');
      }
    }
  };

  const handleViewTransaction = async (txHash: string) => {
    const { chain } = address;
    const txUrls: Record<string, string> = {
      eth: `https://etherscan.io/tx/${txHash}`,
      btc: `https://blockchain.com/btc/tx/${txHash}`,
      sol: `https://solscan.io/tx/${txHash}`,
      bnb: `https://bscscan.com/tx/${txHash}`,
      tron: `https://tronscan.org/#/transaction/${txHash}`,
      kaspa: `https://explorer.kaspa.org/txs/${txHash}`,
    };
    const url = txUrls[chain];
    if (url) {
      try {
        await openUrl(url);
      } catch (error) {
        console.error('Failed to open URL:', error);
        window.open(url, '_blank');
      }
    }
  };

  return (
    <PageLayout title={address.label || t.addressDetail.title} onBack={() => navigate(-1)}>
      <PullToRefresh onRefresh={handleRefresh}>
        {/* Balance */}
        <StandardCard style={{ marginBottom: '16px' }}>
          <div
            style={{ fontSize: '13px', color: 'var(--app-subtitle-color)', marginBottom: '8px' }}
          >
            {t.addressDetail.balance}
          </div>
          {balanceLoading ? (
            <Skeleton.Paragraph lineCount={1} animated />
          ) : balanceError ? (
            <ErrorBlock
              error={balanceError}
              onRetry={refetchBalance}
              style={{ padding: '12px 0' }}
            />
          ) : (
            (() => {
              const parts = formatBalanceParts(balance);
              const isSmall = parseFloat(balance || '0') < 1;
              return (
                <div
                  style={{ fontSize: '32px', fontWeight: 600, color: 'var(--adm-color-primary)' }}
                >
                  {parts.int}
                  {parts.dec && (
                    <span style={isSmall ? undefined : { fontSize: '18px' }}>.{parts.dec}</span>
                  )}{' '}
                  <span style={{ fontSize: '18px' }}>{CHAIN_DISPLAY_NAMES[address.chain]}</span>
                </div>
              );
            })()
          )}
        </StandardCard>

        {/* Tokens - 只显示支持代币的链 */}
        {supportsTokens && (
          <StandardCard style={{ marginBottom: '16px' }}>
            <div
              style={{ fontSize: '13px', color: 'var(--app-subtitle-color)', marginBottom: '12px' }}
            >
              {t.addressDetail.tokens || '代币余额'}
            </div>
            {tokensLoading ? (
              <Skeleton.Paragraph lineCount={2} animated />
            ) : tokensError ? (
              <ErrorBlock
                error={tokensError}
                onRetry={refetchTokens}
                style={{ padding: '12px 0' }}
              />
            ) : tokens.length === 0 ? (
              <div style={{ fontSize: '14px', color: 'var(--app-subtitle-color)' }}>
                {t.common?.empty || '暂无数据'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tokens.map((token) => (
                  <div
                    key={token.symbol}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 500 }}>{token.symbol}</span>
                    <span style={{ fontSize: '15px', fontFamily: 'monospace' }}>
                      {formatBalance(token.balance)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </StandardCard>
        )}

        {/* Address */}
        <StandardCard style={{ marginBottom: '16px' }}>
          <div
            style={{ fontSize: '13px', color: 'var(--app-subtitle-color)', marginBottom: '8px' }}
          >
            {t.addressDetail.address || 'Address'}
          </div>
          <AddressDisplay
            address={address.address}
            full
            copyable
            copySuccessText={t.common?.copied || '已复制'}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <Button
              size="small"
              onClick={refetchBalance}
              loading={balanceLoading}
              style={{ borderRadius: '8px' }}
            >
              {t.addressDetail.refreshBalance}
            </Button>
            <Button size="small" onClick={handleViewOnExplorer} style={{ borderRadius: '8px' }}>
              <GlobalOutline fontSize={16} style={{ marginRight: '4px' }} />
              {t.addressDetail.viewOnExplorer}
            </Button>
          </div>
        </StandardCard>

        {/* 操作按钮 */}
        <Space direction="vertical" block style={{ '--gap': '12px', marginBottom: '16px' }}>
          <Button
            color="primary"
            block
            size="large"
            onClick={() => navigate(`/send/${address.id}`)}
            style={{ borderRadius: '12px', height: '50px', fontSize: '17px' }}
          >
            <SendOutline fontSize={20} style={{ marginRight: '8px' }} />
            {t.addressDetail.sendTransaction}
          </Button>
          <Button
            color="danger"
            block
            size="large"
            onClick={handleRemove}
            style={{ borderRadius: '12px', height: '50px', fontSize: '17px' }}
          >
            <DeleteOutline fontSize={20} style={{ marginRight: '8px' }} />
            {t.addressDetail.removeAddress}
          </Button>
        </Space>

        {/* 交易记录折叠卡片 */}
        <Collapse style={{ marginBottom: '16px' }}>
          <Collapse.Panel
            key="transactions"
            title={`${t.addressDetail.transactions}（${t.addressDetail.recent10}）`}
          >
            {txLoading ? (
              <Skeleton.Paragraph lineCount={3} animated />
            ) : txError ? (
              <ErrorBlock error={txError} onRetry={refetchTransactions} />
            ) : transactions.length === 0 ? (
              <Empty
                style={{ padding: '40px 0' }}
                imageStyle={{ width: 80 }}
                description={t.addressDetail.noTransactions}
              />
            ) : (
              <List style={{ '--border-top': 'none', '--border-bottom': 'none' }}>
                {transactions.slice(0, 10).map((tx) => {
                  const isOutgoing =
                    tx.from && tx.from.toLowerCase() === address.address.toLowerCase();
                  return (
                    <List.Item
                      key={tx.hash}
                      prefix={
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: isOutgoing
                              ? 'rgba(255, 77, 79, 0.1)'
                              : 'rgba(82, 196, 26, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                          }}
                        >
                          {isOutgoing ? '↗' : '↙'}
                        </div>
                      }
                      onClick={() => handleViewTransaction(tx.hash)}
                    >
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: isOutgoing ? '#ff4d4f' : '#52c41a',
                        }}
                      >
                        {isOutgoing ? '-' : '+'}
                        {formatBalance(tx.value)} {CHAIN_DISPLAY_NAMES[address.chain]}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--app-subtitle-color)',
                          marginTop: '4px',
                        }}
                      >
                        {formatTimestamp(tx.timestamp)} · {formatAddress(tx.hash)}
                      </div>
                    </List.Item>
                  );
                })}
              </List>
            )}
          </Collapse.Panel>
        </Collapse>
      </PullToRefresh>
    </PageLayout>
  );
}

export default AddressDetailPage;
