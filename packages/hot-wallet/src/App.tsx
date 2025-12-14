import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout, SplashScreen, useThemeStore } from '@offline-wallet/shared';
import { useI18n } from './hooks/useI18n';

// 路由懒加载
const HomePage = lazy(() => import('./pages/HomePage'));
const WatchAddressPage = lazy(() => import('./pages/WatchAddressPage'));
const AddressDetailPage = lazy(() => import('./pages/AddressDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SendPage = lazy(() => import('./pages/SendPage'));
const ScanSignedPage = lazy(() => import('./pages/ScanSignedPage'));
const BroadcastResultPage = lazy(() => import('./pages/BroadcastResultPage'));
const ScanQRPage = lazy(() => import('./pages/ScanQRPage'));

// 加载中组件
const LoadingFallback = () => {
  const t = useI18n();
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--adm-color-fill-content)',
      }}
    >
      <div style={{ fontSize: '16px', color: 'var(--app-subtitle-color)' }}>{t.common.loading}</div>
    </div>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { theme, getEffectiveTheme } = useThemeStore();
  const t = useI18n();

  // 应用主题
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme();
    document.documentElement.setAttribute('data-prefers-color-scheme', effectiveTheme);
  }, [theme, getEffectiveTheme]);

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
          appName={t.home.title}
          subtitle={t.home.subtitle}
          iconPath="/icon.png"
        />
      )}
      <AppLayout>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/watch-address" element={<WatchAddressPage />} />
              <Route path="/address/:id" element={<AddressDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/send/:id" element={<SendPage />} />
              <Route path="/scan-signed/:id" element={<ScanSignedPage />} />
              <Route path="/broadcast-result" element={<BroadcastResultPage />} />
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
