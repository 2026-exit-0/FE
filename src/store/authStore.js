import { create } from 'zustand';
import { readWishlist, writeWishlist } from '../utils/accountStorage';
import * as authApi from '../api/auth';
import { scannerSession } from '../api/scan';
import { isScanRunning, scanErrorMessage } from '../api/scannerSession';
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
    set({ wishlist: [], survey: null });

    if (token === 'demo_access_token') {
      const storedUser = JSON.parse(localStorage.getItem(USER_KEY) || 'null') || {
        user_id: '00000000-0000-0000-0000-000000000001',
        email: 'demo@damda.com',
        nickname: '체험용 게스트',
        profile_image_url: null,
        notify_analysis: true,
        notify_recommend: true,
      };
      set({ isLoggedIn: true, user: storedUser, wishlist: readWishlist(storedUser.user_id), survey: null });
      return true;
    }

    if (!token || token === 'mock_access_token_dev') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      useScanStore.getState().clearAll();
      set({ isLoggedIn: false, user: null, wishlist: [], survey: null });
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

      set({ isLoggedIn: true, user, wishlist: readWishlist(user.user_id), survey: null });
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return true;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      useScanStore.getState().clearAll();
      set({ isLoggedIn: false, user: null, wishlist: [], survey: null });
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
      const localWishlist = readWishlist(user.user_id);
      set({ isLoggedIn: true, user, wishlist: localWishlist, survey: null, loading: false });
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
      const localWishlist = readWishlist(user.user_id);
      set({ isLoggedIn: true, user, wishlist: localWishlist, survey: null, loading: false });
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
      const localWishlist = readWishlist(user.user_id);
      set({ isLoggedIn: true, user, wishlist: localWishlist, survey: null, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message || '구글 로그인에 실패했습니다.';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  // ── 테스트/체험용 가상 로그인 ───────────────────────────
  demoLogin: () => {
    const demoUser = {
      user_id: '00000000-0000-0000-0000-000000000001',
      email: 'demo@damda.com',
      nickname: '체험용 게스트',
      profile_image_url: null,
      notify_analysis: true,
      notify_recommend: true,
    };
    localStorage.setItem(TOKEN_KEY, 'demo_access_token');
    localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
    useScanStore.getState().clearAll();
    const localWishlist = readWishlist(demoUser.user_id);
    set({ isLoggedIn: true, user: demoUser, wishlist: localWishlist, survey: null, loading: false, error: null });
    return { success: true };
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
      set({ isLoggedIn: true, user, wishlist: readWishlist(user.user_id), survey: null, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || err.message || '회원가입에 실패했습니다.';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  // ── 로그아웃 ──────────────────────────────────────────
  logout: async () => {
    if (get().loggingOut) return;
    set({ loggingOut: true });
    try {
      if (useScanStore.getState().scannerStatus === 'scanning') {
        throw new Error('촬영과 저장이 끝난 뒤 로그아웃해 주세요.');
      }
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && token !== 'demo_access_token') {
        const link = await scannerSession.getLink();
        if (link.user_id && link.user_id === get().user?.user_id) {
          const current = await scannerSession.status();
          if (current?.device_id === scannerSession.deviceId && isScanRunning(current.status)) {
            throw new Error('촬영과 저장이 끝난 뒤 로그아웃해 주세요.');
          }
          await scannerSession.unlink();
        }
      }
    } catch (error) {
      const message = scanErrorMessage(error);
      set({ loggingOut: false, error: message });
      window.alert(message);
      return { success: false };
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('damda_survey');
    useScanStore.getState().clearAll();
    set({ isLoggedIn: false, user: null, survey: null, wishlist: [], error: null, loading: false, loggingOut: false });
    return { success: true };
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
    const token = localStorage.getItem(TOKEN_KEY);
    const userId = get().user?.user_id;
    try {
      const survey = await authApi.getSurvey();
      if (token !== localStorage.getItem(TOKEN_KEY) || userId !== get().user?.user_id) return null;
      set({ survey });
      return survey;
    } catch {
      return null;
    }
  },

  // ── 피부 설문 저장 (PUT /surveys/me) ─────────────────
  saveSurvey: async (data) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userId = get().user?.user_id;
    set({ loading: true });
    try {
      const survey = await authApi.saveSurvey(data);
      if (token !== localStorage.getItem(TOKEN_KEY) || userId !== get().user?.user_id) return { success: false };
      set({ survey, loading: false });
      return { success: true, survey };
    } catch (err) {
      if (token !== localStorage.getItem(TOKEN_KEY) || userId !== get().user?.user_id) return { success: false };
      const message = err.response?.data?.detail || err.message;
      set({ loading: false });
      return { success: false, message };
    }
  },

  // ── 찜 목록 토글 액션 (localStorage + State 동기화) ───
  toggleWish: (product) => {
    if (!get().user?.user_id) return false;
    const list = get().wishlist;
    const isExisted = list.some((p) => p.id === product.id);
    let nextList;
    if (isExisted) {
      nextList = list.filter((p) => p.id !== product.id);
    } else {
      nextList = [...list, product];
    }
    set({ wishlist: nextList });
    writeWishlist(get().user?.user_id, nextList);
    return !isExisted; // 추가됐으면 true, 제거됐으면 false 반환
  },

  // 찜 목록 직접 저장 (되돌리기 복원용)
  setWishlist: (list) => {
    set({ wishlist: list });
    writeWishlist(get().user?.user_id, list);
  },

  // ── 프로필 이미지 (profile_image_url) ────────────────
  updateProfileImage: async (base64Image) => {
    return get().updateUser({ profile_image_url: base64Image });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
