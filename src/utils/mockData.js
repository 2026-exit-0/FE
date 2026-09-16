// Mock 데이터 - 백엔드 연동 전 테스트용

export const mockWeather = {
  temp: 22,
  humidity: 58,
  uv: 'high',
  dust: 'moderate',
};

export const mockUser = {
  nickname: '테스트',
  scanCount: 0,
  lastScan: null,
};

export const mockAnalysis = {
  moisture: 72,
  oil: 45,
  elasticity: 38,
  spots: 63,
  pigmentation: 55,
  overallScore: 74,
  skinType: '복합성 피부',
  date: '2026.04.05',
};

export const mockDemoScanHistory = [
  {
    id: 101,
    sessionId: 'demo_session_1',
    date: '2026.04.10',
    area: '얼굴 전체',
    skinType: '복합성 피부',
    overallScore: 78,
    score: 78,
    moisture: 72,
    oil: 46,
    elasticity: 70,
    spots: 68,
    pigmentation: 60,
    narrative: {
      overall_score: 78,
      summary: '유수분 밸런스가 크게 개선되어 건강하고 탄력 있는 피부 장벽을 유지하고 있습니다.',
      per_metric: [
        { name: '수분도', value: '72%', rating_text: '정상', description: '정상 범위(60-90%)' },
        { name: '유분도', value: '46%', rating_text: '보통', description: 'T존 유분 안정' },
        { name: '탄력', value: '70%', rating_text: '정상', description: '볼 부위 탄력 우수' },
        { name: '모공', value: '68%', rating_text: '양호', description: '모공 밀도 개선' },
        { name: '색소침착', value: '60%', rating_text: '정상', description: '색소 침착 양호' },
      ],
      tips: [
        '현재의 세라마이드 보습 루틴을 꾸준히 유지해 주세요.',
        '자외선 차단제를 하루 2회 이상 꼼꼼히 덧발라주세요.',
      ],
    },
    white_image_url: '/assets/demo_white_light.jpg',
    uv_image_url: '/assets/demo_uv_light.jpg',
    is_mock: true,
  },
  {
    id: 102,
    sessionId: 'demo_session_2',
    date: '2026.04.03',
    area: '얼굴 전체',
    skinType: '복합성 피부',
    overallScore: 74,
    score: 74,
    moisture: 68,
    oil: 49,
    elasticity: 66,
    spots: 65,
    pigmentation: 58,
    narrative: {
      overall_score: 74,
      summary: '수분도가 지난주 대비 소폭 상승하였으며 T존 유분 관리가 안정적입니다.',
      per_metric: [
        { name: '수분도', value: '68%', rating_text: '정상', description: '정상 범위' },
        { name: '유분도', value: '49%', rating_text: '보통', description: 'T존 유분 정상' },
        { name: '탄력', value: '66%', rating_text: '정상', description: '탄력 양호' },
        { name: '모공', value: '65%', rating_text: '양호', description: '모공 개선세' },
        { name: '색소침착', value: '58%', rating_text: '주의', description: '국소 색소 관리 필요' },
      ],
      tips: [
        '주 1회 순한 각질 케어를 추천합니다.',
        '비타민 C 앰플을 저녁에 사용해 보세요.',
      ],
    },
    white_image_url: '/assets/demo_white_light.jpg',
    uv_image_url: '/assets/demo_uv_light.jpg',
    is_mock: true,
  },
  {
    id: 103,
    sessionId: 'demo_session_3',
    date: '2026.03.27',
    area: '이마/볼',
    skinType: '복합성 피부',
    overallScore: 71,
    score: 71,
    moisture: 64,
    oil: 52,
    elasticity: 63,
    spots: 62,
    pigmentation: 55,
    narrative: {
      overall_score: 71,
      summary: '보습제 사용 이후 수분도가 유지되고 있으며 전반적으로 양호한 상태입니다.',
      per_metric: [
        { name: '수분도', value: '64%', rating_text: '정상', description: '보통' },
        { name: '유분도', value: '52%', rating_text: '보통', description: '보통' },
        { name: '탄력', value: '63%', rating_text: '정상', description: '양호' },
        { name: '모공', value: '62%', rating_text: '양호', description: '보통' },
        { name: '색소침착', value: '55%', rating_text: '정상', description: '주의' },
      ],
      tips: ['충분한 수분 섭취와 규칙적인 수면을 권장합니다.'],
    },
    white_image_url: '/assets/demo_white_light.jpg',
    uv_image_url: '/assets/demo_uv_light.jpg',
    is_mock: true,
  },
  {
    id: 104,
    sessionId: 'demo_session_4',
    date: '2026.03.19',
    area: '얼굴 전체',
    skinType: '수부지(수분부족형 지성)',
    overallScore: 67,
    score: 67,
    moisture: 58,
    oil: 56,
    elasticity: 61,
    spots: 60,
    pigmentation: 53,
    narrative: {
      overall_score: 67,
      summary: '유분 대비 수분량이 다소 부족하여 속건조 관리가 필요한 단계입니다.',
      per_metric: [
        { name: '수분도', value: '58%', rating_text: '주의', description: '수분 보충 필요' },
        { name: '유분도', value: '56%', rating_text: '주의', description: '유분 다소 많음' },
        { name: '탄력', value: '61%', rating_text: '정상', description: '보통' },
        { name: '모공', value: '60%', rating_text: '양호', description: '보통' },
        { name: '색소침착', value: '53%', rating_text: '주의', description: '주의' },
      ],
      tips: ['히알루론산 세럼으로 속수분을 먼저 채워주세요.'],
    },
    white_image_url: '/assets/demo_white_light.jpg',
    uv_image_url: '/assets/demo_uv_light.jpg',
    is_mock: true,
  },
  {
    id: 105,
    sessionId: 'demo_session_5',
    date: '2026.03.10',
    area: 'T존/나비존',
    skinType: '수부지(수분부족형 지성)',
    overallScore: 65,
    score: 65,
    moisture: 54,
    oil: 58,
    elasticity: 59,
    spots: 58,
    pigmentation: 52,
    narrative: {
      overall_score: 65,
      summary: 'T존 피지 분비가 왕성하고 볼 부위 수분이 부족한 상태입니다.',
      per_metric: [
        { name: '수분도', value: '54%', rating_text: '주의', description: '부족' },
        { name: '유분도', value: '58%', rating_text: '주의', description: '과다' },
        { name: '탄력', value: '59%', rating_text: '주의', description: '관리 권장' },
        { name: '모공', value: '58%', rating_text: '관리 권장', description: '관리 권장' },
        { name: '색소침착', value: '52%', rating_text: '주의', description: '주의' },
      ],
      tips: ['약산성 클렌저로 자극 없이 세안해 주세요.'],
    },
    white_image_url: '/assets/demo_white_light.jpg',
    uv_image_url: '/assets/demo_uv_light.jpg',
    is_mock: true,
  },
  {
    id: 106,
    sessionId: 'demo_session_6',
    date: '2026.03.02',
    area: '얼굴 전체',
    skinType: '건성 경향',
    overallScore: 62,
    score: 62,
    moisture: 50,
    oil: 61,
    elasticity: 57,
    spots: 56,
    pigmentation: 50,
    narrative: {
      overall_score: 62,
      summary: '초기 측정 결과, 전반적인 피부 장벽 강화와 보습 집중 관리가 필요합니다.',
      per_metric: [
        { name: '수분도', value: '50%', rating_text: '주의', description: '건조' },
        { name: '유분도', value: '61%', rating_text: '주의', description: '유분 과다' },
        { name: '탄력', value: '57%', rating_text: '주의', description: '탄력 저하' },
        { name: '모공', value: '56%', rating_text: '관리 권장', description: '모공 관리 권장' },
        { name: '색소침착', value: '50%', rating_text: '주의', description: '주의' },
      ],
      tips: ['세안 후 3분 이내에 첫 보습제를 발라주세요.'],
    },
    white_image_url: '/assets/demo_white_light.jpg',
    uv_image_url: '/assets/demo_uv_light.jpg',
    is_mock: true,
  },
];

export const mockScanHistory = mockDemoScanHistory;


// ─── 제품 Mock 데이터 (20개) ───────────────────────────
export const mockProducts = [
  {
    id: 1,
    name: '그린티 히알루론산 세럼',
    brand: '아니스토리',
    category: '세럼/앰플',
    badgeLabel: '피부수분',
    ingredients: ['히알루론산 2%', '그린티 추출물'],
    compatibility: 97,
    isLowStimulation: true,
    isVegan: true,
    bgColor: '#E8F5E9',
    accentColor: '#81C784',
  },
  {
    id: 2,
    name: '에팩트 모공 클렌징 토너',
    brand: '리본수포리',
    category: '토너',
    badgeLabel: '모공케어',
    ingredients: ['BHA 0.5%', '모공 케어'],
    compatibility: 94,
    isLowStimulation: true,
    isVegan: false,
    bgColor: '#E3F2FD',
    accentColor: '#90CAF9',
  },
  {
    id: 3,
    name: '세라마이드 리페어 크림',
    brand: '닥터자르콘트',
    category: '크림',
    badgeLabel: '피부장벽',
    ingredients: ['세라마이드', '피부 장벽 강화'],
    compatibility: 91,
    isLowStimulation: true,
    isVegan: false,
    bgColor: '#FFF3E0',
    accentColor: '#FFCC80',
  },
  {
    id: 4,
    name: '저자극 약산성 클렌저',
    brand: '라운드어라운드',
    category: '클렌저',
    badgeLabel: '저자극',
    ingredients: ['pH 5.5', '코코넛 유래 계면활성제'],
    compatibility: 89,
    isLowStimulation: true,
    isVegan: true,
    bgColor: '#E8F5E9',
    accentColor: '#A5D6A7',
  },
  {
    id: 5,
    name: 'UV 프로텍션 선크림 SPF50+',
    brand: '아이소이',
    category: '선크림',
    badgeLabel: '자외선차단',
    ingredients: ['SPF50+ PA++++', '나이아신아마이드'],
    compatibility: 93,
    isLowStimulation: false,
    isVegan: false,
    bgColor: '#FFFDE7',
    accentColor: '#FFF59D',
  },
  {
    id: 6,
    name: 'BHA 블랙헤드 파워 리퀴드',
    brand: '코스알엑스',
    category: '토너',
    badgeLabel: '모공케어',
    ingredients: ['BHA 4%', '버드나무 껍질 추출물'],
    compatibility: 90,
    isLowStimulation: false,
    isVegan: true,
    bgColor: '#E3F2FD',
    accentColor: '#90CAF9',
  },
  {
    id: 7,
    name: '수딩 알로에 젤 크림',
    brand: '네이처리퍼블릭',
    category: '크림',
    badgeLabel: '수분보습',
    ingredients: ['알로에 92%', '판테놀'],
    compatibility: 85,
    isLowStimulation: true,
    isVegan: true,
    bgColor: '#E8F5E9',
    accentColor: '#81C784',
  },
  {
    id: 8,
    name: '비타민C 브라이트닝 세럼',
    brand: '클레어스',
    category: '세럼/앰플',
    badgeLabel: '브라이트닝',
    ingredients: ['비타민C 5%', '아스코르빈산'],
    compatibility: 88,
    isLowStimulation: true,
    isVegan: true,
    bgColor: '#FFF8E1',
    accentColor: '#FFE082',
  },
  {
    id: 9,
    name: '센텔라 시카 클렌징 폼',
    brand: '스킨1004',
    category: '클렌저',
    badgeLabel: '진정케어',
    ingredients: ['센텔라 아시아티카', '마데카소사이드'],
    compatibility: 86,
    isLowStimulation: true,
    isVegan: false,
    bgColor: '#E8F5E9',
    accentColor: '#A5D6A7',
  },
  {
    id: 10,
    name: '무기자차 톤업 선크림',
    brand: '라로슈포제',
    category: '선크림',
    badgeLabel: '자외선차단',
    ingredients: ['SPF50+ PA++++', '징크옥사이드'],
    compatibility: 92,
    isLowStimulation: true,
    isVegan: false,
    bgColor: '#FFFDE7',
    accentColor: '#FFF59D',
  },
  {
    id: 11,
    name: '나이아신아마이드 토너',
    brand: '투쿨포스쿨',
    category: '토너',
    badgeLabel: '브라이트닝',
    ingredients: ['나이아신아마이드 5%', '판테놀'],
    compatibility: 87,
    isLowStimulation: true,
    isVegan: true,
    bgColor: '#F3E5F5',
    accentColor: '#CE93D8',
  },
  {
    id: 12,
    name: '레티놀 인텐시브 앰플',
    brand: '이니스프리',
    category: '세럼/앰플',
    badgeLabel: '안티에이징',
    ingredients: ['레티놀 0.1%', '스쿠알란'],
    compatibility: 82,
    isLowStimulation: false,
    isVegan: false,
    bgColor: '#FCE4EC',
    accentColor: '#F48FB1',
  },
  {
    id: 13,
    name: '오일 컨트롤 클렌저',
    brand: '비오템',
    category: '클렌저',
    badgeLabel: '유분관리',
    ingredients: ['살리실산 1%', '티트리 오일'],
    compatibility: 83,
    isLowStimulation: false,
    isVegan: false,
    bgColor: '#E0F7FA',
    accentColor: '#80DEEA',
  },
  {
    id: 14,
    name: '콜라겐 탄력 크림',
    brand: '에뛰드',
    category: '크림',
    badgeLabel: '탄력강화',
    ingredients: ['콜라겐 펩타이드', '아데노신'],
    compatibility: 84,
    isLowStimulation: true,
    isVegan: false,
    bgColor: '#FFF3E0',
    accentColor: '#FFCC80',
  },
  {
    id: 15,
    name: '아쿠아 베리어 선플루이드',
    brand: '미샤',
    category: '선크림',
    badgeLabel: '자외선차단',
    ingredients: ['SPF50+ PA++++', '히알루론산'],
    compatibility: 88,
    isLowStimulation: true,
    isVegan: true,
    bgColor: '#FFFDE7',
    accentColor: '#FFF59D',
  },
  {
    id: 16,
    name: '프로폴리스 영양 앰플',
    brand: '코스알엑스',
    category: '세럼/앰플',
    badgeLabel: '영양공급',
    ingredients: ['프로폴리스 83.25%', '꿀 추출물'],
    compatibility: 86,
    isLowStimulation: true,
    isVegan: false,
    bgColor: '#FFF8E1',
    accentColor: '#FFE082',
  },
  {
    id: 17,
    name: '녹차 씨드 토너',
    brand: '이니스프리',
    category: '토너',
    badgeLabel: '수분보습',
    ingredients: ['녹차 씨드 오일', '히알루론산'],
    compatibility: 85,
    isLowStimulation: true,
    isVegan: true,
    bgColor: '#E8F5E9',
    accentColor: '#81C784',
  },
  {
    id: 18,
    name: '딥 클렌징 오일',
    brand: '바닐라코',
    category: '클렌저',
    badgeLabel: '딥클렌징',
    ingredients: ['호호바 오일', '올리브 오일'],
    compatibility: 81,
    isLowStimulation: true,
    isVegan: true,
    bgColor: '#FFF3E0',
    accentColor: '#FFCC80',
  },
  {
    id: 19,
    name: '페이셜 진정 크림',
    brand: '아벤느',
    category: '크림',
    badgeLabel: '진정케어',
    ingredients: ['온천수', '시어버터'],
    compatibility: 87,
    isLowStimulation: true,
    isVegan: false,
    bgColor: '#E0F2F1',
    accentColor: '#80CBC4',
  },
  {
    id: 20,
    name: '비건 선세럼 SPF45',
    brand: '아르뗀',
    category: '선크림',
    badgeLabel: '자외선차단',
    ingredients: ['SPF45 PA+++', '스쿠알란'],
    compatibility: 84,
    isLowStimulation: true,
    isVegan: true,
    bgColor: '#FFFDE7',
    accentColor: '#FFF59D',
  },
];

// ─── 궁합도 계산 로직 (간단 버전) ───────────────────────
// TODO: 백엔드 연동 시 교체
// const response = await axios.post('/api/compatibility', { productId, userProfile });
export function calculateCompatibility(product, userProfile) {
  let score = 70; // 기본 점수

  // 피부 타입 매칭
  if (userProfile?.skinType === '건성' && product.category === '크림') {
    score += 10;
  }
  if (userProfile?.skinType === '지성' && product.category === '토너') {
    score += 8;
  }
  if (userProfile?.skinType === '복합성' && product.category === '세럼/앰플') {
    score += 12;
  }

  // 피부 고민 매칭
  if (
    userProfile?.concerns?.includes('여드름') &&
    product.ingredients.some((i) => i.includes('BHA'))
  ) {
    score += 15;
  }
  if (
    userProfile?.concerns?.includes('건조') &&
    product.ingredients.some((i) => i.includes('히알루론산'))
  ) {
    score += 12;
  }
  if (
    userProfile?.concerns?.includes('모공') &&
    product.badgeLabel === '모공케어'
  ) {
    score += 10;
  }

  return Math.min(score, 100);
}

// ─── 주간 리포트 데이터 ───────────────────────────────
export const weeklyData = [
  { week: '1주차', score: 68 },
  { week: '2주차', score: 71 },
  { week: '3주차', score: 74 },
  { week: '4주차', score: 76 },
];

export const measurementHistory = [
  {
    id: 1,
    date: '4/4',
    skinType: '복합성 피부',
    score: 74,
    change: '+3',
    trend: 'up',
  },
  {
    id: 2,
    date: '4/1',
    skinType: '복합성 피부',
    score: 71,
    change: '+5',
    trend: 'up',
  },
  {
    id: 3,
    date: '3/26',
    skinType: '건성 경향',
    score: 66,
    change: '-',
    trend: 'neutral',
  },
];

export const mockRadarData = [
  { subject: '수분도', value: 72, fullMark: 100 },
  { subject: '유분도', value: 45, fullMark: 100 },
  { subject: '탄력', value: 38, fullMark: 100 },
  { subject: '반점', value: 63, fullMark: 100 },
  { subject: '색소침착', value: 55, fullMark: 100 },
];

export const mockBarData = [
  { name: '수분도', value: 72, color: '#4CAF50' },
  { name: '유분도', value: 45, color: '#66BB6A' },
  { name: '모공', value: 38, color: '#E8A838' },
  { name: '탄력', value: 63, color: '#81C784' },
  { name: '색소침착', value: 55, color: '#A5D6A7' },
];

export const mockCareAdvice = {
  primary: '현재 모공 관리를 위해 BHA 성분 토너 사용을 권장합니다.',
  secondary: '오늘 자외선이 강하니 SPF 50+ 선크림을 꼭 발라주세요.',
};
