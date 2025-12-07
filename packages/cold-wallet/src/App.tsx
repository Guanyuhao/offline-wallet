import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SplashScreen, AppLayout } from '@offline-wallet/shared/components';

// 路由懒加载
const HomePage = lazy(() => import('./pages/HomePage'));
const CreateWalletPage = lazy(() => import('./pages/CreateWalletPage'));
const ImportWalletPage = lazy(() => import('./pages/ImportWalletPage'));
const UnlockPage = lazy(() => import('./pages/UnlockPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const SignTransactionPage = lazy(() => import('./pages/SignTransactionPage'));
const SignSuccessPage = lazy(() => import('./pages/SignSuccessPage'));
const ReceivePage = lazy(() => import('./pages/ReceivePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ScanQRPage = lazy(() => import('./pages/ScanQRPage'));

// 加载中组件
const LoadingFallback = () => (
  <div
    style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f7',
    }}
  >
    <div style={{ fontSize: '16px', color: '#86868b' }}>加载中...</div>
  </div>
);

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // 确保开屏动画至少显示一段时间
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showSplash && (
        <SplashScreen
          duration={2000}
          onComplete={() => setShowSplash(false)}
          autoComplete={false}
          appName="冷钱包"
          subtitle="COLD WALLET"
          iconPath="/icon.png"
        />
      )}
      <AppLayout>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreateWalletPage />} />
              <Route path="/import" element={<ImportWalletPage />} />
              <Route path="/unlock" element={<UnlockPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/sign" element={<SignTransactionPage />} />
              <Route path="/sign-success" element={<SignSuccessPage />} />
              <Route path="/receive" element={<ReceivePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/scan-qr" element={<ScanQRPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppLayout>
    </>
  );
}

export default App;
