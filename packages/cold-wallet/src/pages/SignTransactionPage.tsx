import { useState } from 'react';
import { Button, Card, Input, Toast, Dialog, Grid } from 'antd-mobile';
import { NavBar, SafeArea } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import useWalletStore from '../stores/useWalletStore';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { QRCodeProtocol, QRCodeType, SignedTransactionQRCode } from '@shared/types/qrcode';

function SignTransactionPage() {
  const navigate = useNavigate();
  const { mnemonic, currentChain, isUnlocked } = useWalletStore();
  const [to, setTo] = useState('');
  const [value, setValue] = useState('');
  const [gasPrice, setGasPrice] = useState('20'); // 默认 20 Gwei
  const [gasLimit, setGasLimit] = useState('21000'); // 默认 Gas Limit
  const [nonce, setNonce] = useState('0');
  const [loading, setLoading] = useState(false);
  const [signedTx, setSignedTx] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  if (!isUnlocked || !mnemonic) {
    navigate('/unlock');
    return null;
  }

  const handleSign = async () => {
    if (!to || !value) {
      Toast.show({
        content: '请填写完整信息',
        position: 'top',
      });
      return;
    }

    try {
      setLoading(true);

      // 构建交易数据
      const txData = JSON.stringify({
        to,
        value: (parseFloat(value) * 1e18).toString(), // ETH 转 Wei
        gas_price: (parseFloat(gasPrice) * 1e9).toString(), // Gwei 转 Wei
        gas_limit: gasLimit,
        nonce,
      });

      // 签名交易
      const signed = await invoke<string>('sign_transaction', {
        chain: currentChain,
        mnemonic,
        txData,
      });

      setSignedTx(signed);
      Toast.show({
        content: '签名成功',
        position: 'top',
        icon: 'success',
      });
    } catch (error) {
      Toast.show({
        content: `签名失败: ${error}`,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const qrCodeData = signedTx
    ? (() => {
        try {
          const tx = JSON.parse(signedTx);
          const data: SignedTransactionQRCode = {
            type: QRCodeType.SIGNED_TRANSACTION,
            version: '1.0.0',
            timestamp: Date.now(),
            chain: currentChain,
            signedTx: signedTx,
            txHash: tx.transaction_hash || '',
          };
          return QRCodeProtocol.encode(data);
        } catch {
          return '';
        }
      })()
    : '';

  return (
    <div
      style={{
        height: '100vh',
        minHeight: '-webkit-fill-available',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SafeArea position="top" />
      <NavBar onBack={() => navigate(-1)}>签名交易</NavBar>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        {!signedTx ? (
          <Card>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h2>签名交易</h2>
              <p style={{ color: '#666' }}>
                当前链: <strong>{currentChain.toUpperCase()}</strong>
              </p>

              <Input placeholder="收款地址" value={to} onChange={(val) => setTo(val)} />

              <Input
                type="number"
                placeholder="金额（ETH）"
                value={value}
                onChange={(val) => setValue(val)}
              />

              <Input
                type="number"
                placeholder="Gas Price (Gwei)"
                value={gasPrice}
                onChange={(val) => setGasPrice(val)}
              />

              <Input
                type="number"
                placeholder="Gas Limit"
                value={gasLimit}
                onChange={(val) => setGasLimit(val)}
              />

              <Input
                type="number"
                placeholder="Nonce"
                value={nonce}
                onChange={(val) => setNonce(val)}
              />

              <Button color="primary" block loading={loading} onClick={handleSign}>
                签名交易
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              <h2>✅ 签名成功</h2>
              <p style={{ color: '#666', textAlign: 'center' }}>
                签名后的交易已生成，请使用热钱包扫描二维码广播交易
              </p>

              <QRCodeDisplay data={qrCodeData} size={256} />

              <Grid columns={2} gap={8} style={{ width: '100%' }}>
                <Grid.Item>
                  <Button color="primary" block onClick={() => setShowQRCode(true)}>
                    查看二维码
                  </Button>
                </Grid.Item>
                <Grid.Item>
                  <Button
                    color="default"
                    block
                    onClick={() => {
                      setSignedTx(null);
                      setTo('');
                      setValue('');
                    }}
                  >
                    重新签名
                  </Button>
                </Grid.Item>
              </Grid>
            </div>
          </Card>
        )}
      </div>

      {/* 二维码弹窗 */}
      {showQRCode && qrCodeData && (
        <Dialog
          visible={showQRCode}
          content={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
              }}
            >
              <h3>签名交易二维码</h3>
              <QRCodeDisplay data={qrCodeData} size={300} />
              <p style={{ fontSize: '12px', color: '#666' }}>使用热钱包扫描此二维码广播交易</p>
            </div>
          }
          closeOnAction
          onClose={() => setShowQRCode(false)}
          actions={[
            {
              key: 'close',
              text: '关闭',
            },
          ]}
        />
      )}

      <SafeArea position="bottom" />
    </div>
  );
}

export default SignTransactionPage;
