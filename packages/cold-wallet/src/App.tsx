import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateWalletPage from './pages/CreateWalletPage';
import ImportWalletPage from './pages/ImportWalletPage';
import UnlockPage from './pages/UnlockPage';
import WalletPage from './pages/WalletPage';
import SignTransactionPage from './pages/SignTransactionPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateWalletPage />} />
        <Route path="/import" element={<ImportWalletPage />} />
        <Route path="/unlock" element={<UnlockPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/sign" element={<SignTransactionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
