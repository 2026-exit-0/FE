import client, { isMock } from './client';
import { mockProducts, calculateCompatibility } from '../utils/mockData';

// ── 제품 추천 (POST /scans/{id}/recommend 또는 GET /products) ────────
export async function getRecommendations(body = {}, sessionId) {
  const isDemo = localStorage.getItem('damda_token') === 'demo_access_token';
  if (isMock) {
    await delay(500);
    return buildMockRecommendations(body);
  }

  try {
    // 1. BE 세션 기반 추천: POST /scans/{id}/recommend
    if (sessionId && !String(sessionId).startsWith('mock_')) {
      const res = await client.post(`/scans/${sessionId}/recommend`);
      const items = Array.isArray(res.data) ? res.data : (res.data?.recommended_products || res.data?.products || []);
      if (items.length > 0) return { recommended_products: items };
    }

    // 2. 세션 ID가 없거나 실패 시 신규 제품 목록 API 호출 (GET /products)
    const res = await client.get('/products');
    const items = Array.isArray(res.data) ? res.data : (res.data?.products || []);
    if (items.length > 0) return { recommended_products: items };
    if (isDemo) return buildMockRecommendations(body);
    return { recommended_products: [] };
  } catch {
    if (isDemo) return buildMockRecommendations(body);
    return { recommended_products: [] };
  }
}

// ── 제품 목록 조회 (GET /products) ──────────────────────
export async function getProducts() {
  const isDemo = localStorage.getItem('damda_token') === 'demo_access_token';
  if (isMock) {
    await delay(300);
    return { products: mockProducts };
  }

  try {
    const res = await client.get('/products');
    const items = Array.isArray(res.data) ? res.data : (res.data?.products || []);
    if (items.length > 0) return res.data;
    if (isDemo) return { products: mockProducts };
    return res.data;
  } catch (err) {
    if (isDemo) return { products: mockProducts };
    throw err;
  }
}

// ── 특정 제품 상세 (GET /products/{id}) ──────────────────
export async function getProductById(productId) {
  if (isMock) {
    await delay(200);
    const found = mockProducts.find((p) => String(p.id) === String(productId));
    return found || mockProducts[0];
  }

  const res = await client.get(`/products/${productId}`);
  return res.data;
}

// ── 찜하기 연동 (POST/DELETE /products/{id}/wishlist) ────
export async function toggleWishlistApi(productId, isAdd) {
  if (isMock) return { success: true };

  if (isAdd) {
    const res = await client.post(`/products/${productId}/wishlist`);
    return res.data;
  } else {
    const res = await client.delete(`/products/${productId}/wishlist`);
    return res.data;
  }
}

// ── 찜 목록 조회 (GET /wishlist) ──────────────────────────
export async function getWishlistApi() {
  if (isMock) return [];

  const res = await client.get('/wishlist');
  return res.data;
}

// ── 자가진단 질문지 조회 (설문(D) 대체용 기본 데이터) ───────
export async function getQuestionnaire() {
  return { questions: MOCK_QUESTIONS };
}

// ── 자가진단 채점 (SkinCheckPage 호환용) ────────────────────
export async function scoreQuestionnaire(answers) {
  return {
    skin_type: '복합성',
    sensitivity: 3,
    aging_score: 2,
    lifestyle_flags: { sleep: 1, sunscreen: 1 },
    incomplete: [],
  };
}

// ── Mock 추천 생성 헬퍼 ──────────────────────────────────
function buildMockRecommendations(body) {
  const userProfile = {
    skinType: body.user_inputs?.skin_type || '복합성',
    concerns: body.user_inputs?.concerns || [],
  };

  const filters = body.filter_categories || [];
  const excludeIds = new Set(body.exclude_ids || []);

  let products = mockProducts
    .filter((p) => !excludeIds.has(p.id))
    .map((p) => ({
      ...p,
      score: calculateCompatibility(p, userProfile),
      reason: getReason(p, userProfile),
      effect: getEffect(p),
      category: [p.badgeLabel],
      sub_labels: p.isLowStimulation ? ['저자극'] : [],
      warnings: [],
      main_ingredients: p.ingredients,
      purchase_url: null,
      image_url: null,
    }));

  if (filters.length > 0) {
    products = products.filter((p) =>
      filters.some((f) => p.category?.includes(f) || p.badgeLabel?.includes(f))
    );
  }

  products.sort((a, b) => b.score - a.score);

  return { recommended_products: products.slice(0, body.top_k || 5) };
}

function getReason(product, userProfile) {
  if (userProfile.concerns.includes('모공') && product.badgeLabel === '모공케어') {
    return '모공 케어에 효과적인 BHA 성분이 포함되어 있어요.';
  }
  if (userProfile.concerns.includes('건조') && product.ingredients.some((i) => i.includes('히알루론산'))) {
    return '히알루론산이 피부 수분을 오랫동안 잡아줍니다.';
  }
  return `${userProfile.skinType} 피부에 적합한 제품이에요.`;
}

function getEffect(product) {
  const effectMap = {
    '모공케어': '모공을 조여주고 피지를 조절해 피부결을 개선할 수 있어요.',
    '수분보습': '피부 깊은 곳까지 수분을 채워 촉촉한 피부를 유지해요.',
    '브라이트닝': '칙칙한 피부톤을 밝혀주고 색소침착을 개선해요.',
    '탄력강화': '피부 탄력을 높여 탱탱하고 건강한 피부로 가꿔줘요.',
    '진정케어': '예민하고 붉어진 피부를 빠르게 진정시켜 줍니다.',
  };
  return effectMap[product.badgeLabel] || '피부를 건강하게 가꿔줄 수 있어요.';
}

// ── Mock 질문지 ──────────────────────────────────────────
const MOCK_QUESTIONS = [
  {
    id: 'q1', section: 'skin_type', text: '세안 후 아무것도 바르지 않으면 피부가 어떤가요?',
    options: [{ label: '당기고 건조하다' }, { label: '약간 당긴다' }, { label: '별 느낌 없다' }, { label: '조금 번들거린다' }, { label: '매우 번들거린다' }],
  },
  {
    id: 'q2', section: 'skin_type', text: '오후가 되면 피부 유분이 어느 정도 보이나요?',
    options: [{ label: '없다' }, { label: '조금 있다' }, { label: '보통이다' }, { label: '꽤 번들거린다' }, { label: '심하게 번들거린다' }],
  },
  {
    id: 'q3', section: 'sensitivity', text: '새로운 화장품을 바르면 어떤 반응이 나타나나요?',
    options: [{ label: '아무 반응 없다' }, { label: '가끔 간지럽다' }, { label: '종종 붉어진다' }, { label: '자주 트러블이 난다' }, { label: '거의 항상 자극이 온다' }],
  },
  {
    id: 'q4', section: 'sensitivity', text: '자외선, 바람, 온도 변화에 피부가 어떻게 반응하나요?',
    options: [{ label: '전혀 민감하지 않다' }, { label: '약간 민감하다' }, { label: '보통이다' }, { label: '꽤 민감하다' }, { label: '매우 민감하다' }],
  },
  {
    id: 'q5', section: 'aging', text: '거울을 볼 때 잔주름이 얼마나 보이나요?',
    options: [{ label: '전혀 없다' }, { label: '약간 있다' }, { label: '보통이다' }, { label: '제법 있다' }, { label: '많이 있다' }],
  },
  {
    id: 'q6', section: 'lifestyle', text: '평균적으로 하루 수면 시간이 어떻게 되나요?',
    options: [{ label: '7시간 이상' }, { label: '6-7시간' }, { label: '5-6시간' }, { label: '5시간 미만' }],
  },
  {
    id: 'q7', section: 'lifestyle', text: '선크림을 얼마나 자주 사용하나요?',
    options: [{ label: '매일 꼭 바른다' }, { label: '대부분 바른다' }, { label: '가끔 바른다' }, { label: '거의 안 바른다' }],
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
