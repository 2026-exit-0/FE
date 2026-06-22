import { create } from 'zustand';
import * as authApi from '../api/auth';

const TOKEN_KEY = 'damda_token';
const USER_KEY = 'damda_user';

const useAuthStore = create((set, get) => ({
  isLoggedIn: false,
  user: null,
  loading: false,
  error: null,

  // 앱 시작 시 토큰 검증
  checkAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    try {
      const user = await authApi.getMe();
      set({ isLoggedIn: true, user });
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return true;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ isLoggedIn: false, user: null });
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { access_token, user } = await authApi.login(email, password);
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      // 기존 코드 호환용 키도 유지
      localStorage.setItem('skinlab_current_user', JSON.stringify(user));
      set({ isLoggedIn: true, user, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message || '로그인에 실패했습니다.';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  signup: async (data) => {
    set({ loading: true, error: null });
    try {
      const { access_token, user } = await authApi.signup(data);
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem('skinlab_current_user', JSON.stringify(user));
      set({ isLoggedIn: true, user, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message || '회원가입에 실패했습니다.';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('skinlab_current_user');
    set({ isLoggedIn: false, user: null, error: null });
  },

  updateUser: async (newData) => {
    set({ loading: true });
    try {
      const updated = await authApi.updateProfile(newData);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      localStorage.setItem('skinlab_current_user', JSON.stringify(updated));
      set({ user: updated, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      set({ loading: false });
      return { success: false, message };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ loading: true });
    try {
      await authApi.changePassword(currentPassword, newPassword);
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      set({ loading: false });
      return { success: false, message };
    }
  },

  // 프로필 이미지 (base64) — 별도 API 없이 로컬 처리
  updateProfileImage: async (base64Image) => {
    return get().updateUser({ profileImage: base64Image });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
