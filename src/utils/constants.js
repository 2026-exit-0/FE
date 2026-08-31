// 상수 정의

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  SCAN: '/scan',
  ANALYSIS: '/analysis',
  REPORT: '/report',
  PRODUCTS: '/products',
};

export const SKIN_TYPES = ['건성', '지성', '복합성', '민감성', '모름'];

export const SKIN_CONCERNS = ['여드름', '모공', '주름', '색소침착', '탄력', '건조'];

export const COSMETIC_INTERESTS = ['클렌저', '토너', '세럼/앰플', '크림', '선크림'];

export const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대 이상'];

export const SCAN_AREAS = ['이마', '코', '왼쪽 뺨', '오른쪽 뺨', '턱'];

export const LIGHTING_MODES = [
  { id: 'white', label: '백색 LED' },
  { id: 'uv', label: 'UV LED' },
  { id: 'dual', label: '듀얼' },
];

export const MEASUREMENT_ITEMS = [
  { id: 'moisture', label: '수분 / 유분', default: true },
  { id: 'pore', label: '모공 분석', default: true },
  { id: 'pigmentation', label: '색소침착 감지', default: true },
  { id: 'elasticity', label: '탄력 측정', default: false },
];

export const NAV_ITEMS = [
  { path: ROUTES.DASHBOARD, label: '대시보드', icon: 'LayoutDashboard' },
  { path: ROUTES.SCAN, label: '피부 스캔', icon: 'Scan' },
  { path: ROUTES.ANALYSIS, label: '분석 결과', icon: 'BarChart3' },
  { path: ROUTES.REPORT, label: '분석 리포트', icon: 'FileText' },
  { path: ROUTES.PRODUCTS, label: '제품 추천', icon: 'ShoppingBag' },
];

export const SIDEBAR_ITEMS = [
  { section: '메뉴', items: [
    { path: ROUTES.DASHBOARD, label: '대시보드', icon: 'LayoutDashboard' },
    { path: ROUTES.SCAN, label: '피부 스캔', icon: 'Scan' },
    { path: ROUTES.ANALYSIS, label: '분석 결과', icon: 'BarChart3' },
    { path: ROUTES.REPORT, label: '분석 리포트', icon: 'FileText' },
    { path: ROUTES.PRODUCTS, label: '제품 추천', icon: 'ShoppingBag' },
  ]},
  { section: '기타', items: [
    { path: '#', label: '케어 가이드', icon: 'BookOpen' },
    { path: '#', label: '마이페이지', icon: 'User' },
    { path: '#', label: '설정', icon: 'Settings' },
  ]},
];

export const UV_LEVELS = {
  low: { label: '낮음', color: 'text-green-600', bg: 'bg-green-50' },
  moderate: { label: '보통', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  high: { label: '높음', color: 'text-orange-600', bg: 'bg-orange-50' },
  veryHigh: { label: '매우 높음', color: 'text-red-600', bg: 'bg-red-50' },
};

export const DUST_LEVELS = {
  good: { label: '좋음', color: 'text-blue-600', bg: 'bg-blue-50' },
  moderate: { label: '보통', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  bad: { label: '나쁨', color: 'text-orange-600', bg: 'bg-orange-50' },
  veryBad: { label: '매우 나쁨', color: 'text-red-600', bg: 'bg-red-50' },
};
