import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// 실제 인증 훅 (authStore의 얇은 래퍼)
const useAuth = (requireAuth = false) => {
  const navigate = useNavigate();
  const { isLoggedIn, user, loading, error, login, signup, logout, checkAuth, clearError } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('damda_token');
    if (requireAuth && !isLoggedIn && !token) {
      navigate('/login', { replace: true });
    }
  }, [requireAuth, isLoggedIn, navigate]);

  return { isLoggedIn, user, loading, error, login, signup, logout, checkAuth, clearError };
};

export default useAuth;
