import axios from 'axios';

const isMock = false;

// 배포: Netlify proxy 사용
// 로컬: 백엔드 직접 접근
const baseURL = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_BASE || 'http://52.79.241.24:8000');

const client = axios.create({
  baseURL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 — JWT 자동 첨부
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('damda_token');

  if (token && token !== 'demo_access_token') {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 응답 인터셉터 — 401 시 자동 로그아웃
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem('damda_token');

    if (
      error.response?.status === 401 &&
      token !== 'demo_access_token'
    ) {
      localStorage.removeItem('damda_token');
      localStorage.removeItem('damda_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default client;
export { isMock };