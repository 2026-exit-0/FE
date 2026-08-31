import { create } from 'zustand';
import * as authApi from '../api/auth';
import useScanStore from './scanStore';

const TOKEN_KEY = 'damda_token';
const USER_KEY = 'damda_user';

const useAuthStore = create((set, get) => ({
  isLoggedIn: false,
  user: null,       // MypageOut: { user_id, email, nickname, profile_image_url, notify_* }
  survey: null,     // SurveyOut: { skin_type, concerns, allergies, ... }
  wishlist: [],     // 찜한 화장품 목록
  loading: false,
  error: null,

  // ── 앱 시작 시 토큰 및 찜 목록 검증 ───────────────────
  checkAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    // 찜 목록 로컬스토리지 로드
    const localWishlist = JSON.parse(localStorage.getItem('damda_wishlist') || '[]');
    set({ wishlist: localWishlist });

    if (!token || token === 'mock_access_token_dev') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      useScanStore.getState().clearAll();
      set({ isLoggedIn: false, user: null });
      return false;
    }

    try {
      // GET /mypage 로 로그인 상태 확인
      const user = await authApi.getMe();
      
      // 유저가 변경되었거나 신규 회원인 경우 이전 스캔 기록 초기화
      const prevUser = get().user;
      if (!prevUser || (user?.user_id && prevUser?.user_id !== user.user_id)) {
        useScanStore.getState().clearAll();
      }

      set({ isLoggedIn: true, user });
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return true;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      useScanStore.getState().clearAll();
      set({ isLoggedIn: false, user: null });
      return false;
    }
  },

  // ── 로그인 ────────────────────────────────────────────
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { access_token } = await authApi.login(email, password);
      localStorage.setItem(TOKEN_KEY, access_token);

      // 이전 스캔 기록 초기화
      useScanStore.getState().clearAll();

      // 토큰 저장 후 내 정보 조회 (GET /mypage)
      const user = await authApi.getMe();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      const localWishlist = JSON.parse(localStorage.getItem('damda_wishlist') || '[]');
      set({ isLoggedIn: true, user, wishlist: localWishlist, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message || '로그인에 실패했습니다.';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  // ── 카카오 로그인 ──────────────────────────────────────
  kakaoLogin: async (code, redirectUri) => {
    set({ loading: true, error: null });
    try {
      const { access_token } = await authApi.kakaoLogin(code, redirectUri);
      localStorage.setItem(TOKEN_KEY, access_token);
      useScanStore.getState().clearAll();
      const user = await authApi.getMe();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      const localWishlist = JSON.parse(localStorage.getItem('damda_wishlist') || '[]');
      set({ isLoggedIn: true, user, wishlist: localWishlist, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message || '카카오 로그인에 실패했습니다.';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  // ── 구글 로그인 ────────────────────────────────────────
  googleLogin: async (code, redirectUri) => {
    set({ loading: true, error: null });
    try {
      const { access_token } = await authApi.googleLogin(code, redirectUri);
      localStorage.setItem(TOKEN_KEY, access_token);
      useScanStore.getState().clearAll();
      const user = await authApi.getMe();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      const localWishlist = JSON.parse(localStorage.getItem('damda_wishlist') || '[]');
      set({ isLoggedIn: true, user, wishlist: localWishlist, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message || '구글 로그인에 실패했습니다.';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  // ── 회원가입 ──────────────────────────────────────────
  signup: async (data) => {
    set({ loading: true, error: null });
    try {
      const { access_token } = await authApi.signup(data);
      localStorage.setItem(TOKEN_KEY, access_token);
      useScanStore.getState().clearAll();

      // 가입 후 내 정보 조회
      const user = await authApi.getMe();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ isLoggedIn: true, user, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message || '회원가입에 실패했습니다.';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  // ── 로그아웃 ──────────────────────────────────────────
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('damda_survey');
    useScanStore.getState().clearAll();
    set({ isLoggedIn: false, user: null, survey: null, wishlist: [], error: null });
  },

  // ── 마이페이지 프로필 수정 (PATCH /mypage) ────────────
  updateUser: async (newData) => {
    set({ loading: true });
    try {
      const updated = await authApi.updateProfile(newData);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      set({ user: updated, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      set({ loading: false });
      return { success: false, message };
    }
  },

  // ── 비밀번호 변경 ─────────────────────────────────────
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

  // ── 피부 설문 조회 (GET /surveys/me) ─────────────────
  fetchSurvey: async () => {
    try {
      const survey = await authApi.getSurvey();
      set({ survey });
      return survey;
    } catch {
      return null;
    }
  },

  // ── 피부 설문 저장 (PUT /surveys/me) ─────────────────
  saveSurvey: async (data) => {
    set({ loading: true });
    try {
      const survey = await authApi.saveSurvey(data);
      set({ survey, loading: false });
      return { success: true, survey };
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      set({ loading: false });
      return { success: false, message };
    }
  },

  // ── 찜 목록 토글 액션 (localStorage + State 동기화) ───
  toggleWish: (product) => {
    const list = get().wishlist;
    const isExisted = list.some((p) => p.id === product.id);
    let nextList;
    if (isExisted) {
      nextList = list.filter((p) => p.id !== product.id);
    } else {
      nextList = [...list, product];
    }
    set({ wishlist: nextList });
    localStorage.setItem('damda_wishlist', JSON.stringify(nextList));
    return !isExisted; // 추가됐으면 true, 제거됐으면 false 반환
  },

  // 찜 목록 직접 저장 (되돌리기 복원용)
  setWishlist: (list) => {
    set({ wishlist: list });
    localStorage.setItem('damda_wishlist', JSON.stringify(list));
  },

  // ── 프로필 이미지 (profile_image_url) ────────────────
  updateProfileImage: async (base64Image) => {
    return get().updateUser({ profile_image_url: base64Image });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
