import axios from 'axios';

const isMock = false;

// 배포(PROD) 환경: Netlify SSL 프록시 경유 (HTTPS->HTTP Mixed Content 차단 방지)
// 로컬 개발 환경: BE 주소 또는 VITE_API_BASE
const baseURL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE || 'http://52.79.241.24:8000');

const client = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 — JWT 자동 첨부 (데모 토큰 제외)
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('damda_token');
  if (token && token !== 'demo_access_token') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 — 401 시 자동 로그아웃 (데모 토큰 사용 시 제외)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem('damda_token');
    if (error.response?.status === 401 && token !== 'demo_access_token') {
      localStorage.removeItem('damda_token');
      localStorage.removeItem('damda_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
export { isMock };
