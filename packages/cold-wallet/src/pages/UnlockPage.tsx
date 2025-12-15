import { useState, useEffect } from 'react';
import { Toast, Button } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { PageLayout, StandardCard, PrimaryButton } from '@offline-wallet/shared/components';
import useWalletStore from '../stores/useWalletStore';
import PasswordInput from '../components/PasswordInput';
import { retrieveMnemonic, hasMnemonic } from '../utils/stronghold';
import {
  isBiometricAvailable,
  authenticateWithBiometric,
  getBiometricTypeName,
} from '../utils/biometric';
import { useI18n } from '../hooks/useI18n';

function UnlockPage() {
  const navigate = useNavigate();
  const { setUnlocked, setMnemonic, setHasWallet, biometricEnabled } = useWalletStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [hasWallet, setHasWalletLocal] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<
    'touchId' | 'faceId' | 'iris' | null | undefined
  >();
  const t = useI18n();

  useEffect(() => {
    checkWalletExists();
    checkBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkWalletExists = async () => {
    try {
      const exists = await hasMnemonic();
      setHasWalletLocal(exists);
      setHasWallet(exists);
      if (!exists) {
        // 如果没有钱包，跳转到首页
        navigate('/');
      }
    } catch (error) {
      console.error('检查钱包失败:', error);
    }
  };

  const checkBiometric = async () => {
    try {
      const status = await isBiometricAvailable();
      setBiometricAvailable(status.isAvailable);
      setBiometricType(status.biometryType);

      // 如果生物识别可用且已启用，自动尝试生物识别解锁
      if (status.isAvailable && biometricEnabled) {
        handleBiometricUnlock();
      }
    } catch (error) {
      console.error('检查生物识别失败:', error);
    }
  };

  const handleUnlock = async () => {
    if (!password) {
      Toast.show({
        content: t.unlock.enterPassword,
        position: 'top',
      });
      return;
    }

    try {
      setLoading(true);

      // 使用 Stronghold 验证密码并获取助记词
      const mnemonic = await retrieveMnemonic(password);

      // 设置状态
      setMnemonic(mnemonic);
      setUnlocked(true);

      Toast.show({
        content: t.unlock.unlockSuccess,
        position: 'top',
        icon: 'success',
      });

      navigate('/wallet');
    } catch (error) {
      console.error('解锁失败:', error);

      // 关闭加载提示
      Toast.clear();

      // 检查是否是密钥不匹配错误（BadFileKey）
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isBadFileKey =
        errorMessage.includes('BadFileKey') || errorMessage.includes('密钥不匹配');

      Toast.show({
        content: isBadFileKey ? t.unlock.keyMismatch : t.unlock.passwordError,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  // 生物识别解锁
  const handleBiometricUnlock = async () => {
    try {
      setBiometricLoading(true);

      const biometricName = getBiometricTypeName(biometricType);
      const success = await authenticateWithBiometric(
        t.biometric?.unlockReason || `使用${biometricName}解锁钱包`
      );

      if (success) {
        // 生物识别成功后，需要从安全存储中获取密码来解锁
        // 这里假设我们使用设备凭据作为密钥
        // 实际实现中，你可能需要一个单独的安全存储来保存用于生物识别的凭据

        // 对于简化实现，我们可以让用户在启用生物识别时保存一个"解锁令牌"
        // 这里暂时跳过密码验证，直接解锁（需要更安全的实现）

        Toast.show({
          content: t.biometric?.biometricSuccess || '生物识别验证成功',
          position: 'top',
          icon: 'success',
        });

        // 注意：实际实现中，这里应该使用生物识别保护的凭据来解锁 Stronghold
        // 暂时先提示用户输入密码
        Toast.show({
          content: t.biometric?.enterPasswordAfterBiometric || '请输入密码完成解锁',
          position: 'top',
        });
      } else {
        Toast.show({
          content: t.biometric?.authFailed || '生物识别验证失败',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('生物识别解锁失败:', error);
      Toast.show({
        content: t.biometric?.authFailed || '生物识别验证失败',
        position: 'top',
      });
    } finally {
      setBiometricLoading(false);
    }
  };

  if (!hasWallet) {
    return null;
  }

  const biometricName = getBiometricTypeName(biometricType);
  const showBiometric = biometricAvailable && biometricEnabled;

  return (
    <PageLayout showBack={false}>
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
            <div
              style={{
                fontSize: '72px',
              }}
            >
              🔒
            </div>
            <div style={{ textAlign: 'center' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '28px',
                  fontWeight: 600,
                  color: 'var(--app-title-color)',
                }}
              >
                {t.unlock.title}
              </h1>
              <p
                style={{
                  marginTop: '8px',
                  color: 'var(--app-subtitle-color)',
                  fontSize: '17px',
                }}
              >
                {t.unlock.enterPasswordPrompt}
              </p>
            </div>

            <PasswordInput
              placeholder={t.unlock.passwordPlaceholder}
              value={password}
              onChange={(val) => setPassword(val)}
              onEnterPress={handleUnlock}
              style={{
                width: '100%',
                borderRadius: '12px',
                fontSize: '17px',
              }}
            />

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <PrimaryButton loading={loading} onClick={handleUnlock}>
                {t.unlock.unlockButton}
              </PrimaryButton>

              {/* 生物识别解锁按钮 */}
              {showBiometric && (
                <Button
                  block
                  size="large"
                  loading={biometricLoading}
                  onClick={handleBiometricUnlock}
                  style={{
                    borderRadius: '12px',
                    height: '50px',
                    fontSize: '17px',
                  }}
                >
                  {biometricType === 'faceId' ? '👤' : '👆'}{' '}
                  {t.biometric?.unlockWithBiometric || `使用${biometricName}解锁`}
                </Button>
              )}
            </div>
          </div>
        </StandardCard>
      </div>
    </PageLayout>
  );
}

export default UnlockPage;
