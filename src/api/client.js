import axios from 'axios';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

// 개발 모드에서는 vite proxy 사용 (baseURL 없음), 직접 연결 시 API_BASE
const baseURL = isMock ? '' : (import.meta.env.VITE_API_BASE || '');

const client = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 — JWT 자동 첨부
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('damda_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 — 401 시 자동 로그아웃
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('damda_token');
      localStorage.removeItem('damda_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
export { isMock };
