import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ScanPage from './pages/ScanPage';
import AnalysisPage from './pages/AnalysisPage';
import ReportPage from './pages/ReportPage';
import ProductsPage from './pages/ProductsPage';
import MyPage from './pages/MyPage';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuthStore();
  const hasToken = localStorage.getItem('damda_token') || localStorage.getItem('skinlab_current_user');

  if (!isLoggedIn && !hasToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const { checkAuth } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    checkAuth().finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/scan" element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />
      <Route path="/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
      <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
