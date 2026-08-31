import axios from 'axios';

const isMock = import.meta.env.VITE_USE_MOCK === 'true';

// 개발/배포 환경 무관하게 Mixed Content (HTTPS -> HTTP) 방지를 위해 Netlify Proxy 활용
const getBaseURL = () => {
  if (isMock) return '';
  const envBase = import.meta.env.VITE_API_BASE;
  // HTTPS 프로토콜 웹에서 HTTP 백엔드로 직접 전송 시 차단 방지를 위해 프록시 주소 사용
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && envBase?.startsWith('http:')) {
    return ''; // Netlify _redirects 프록시 경유
  }
  return envBase || '';
};

const client = axios.create({
  baseURL: getBaseURL(),
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
