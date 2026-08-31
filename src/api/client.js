import axios from 'axios';

const isMock = false; // 백엔드 정식 통신 모드로 강제 고정

// BE 정식 주소 (기본값: http://52.79.241.24:8000)
const baseURL = isMock ? '' : (import.meta.env.VITE_API_BASE || 'http://52.79.241.24:8000');

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
