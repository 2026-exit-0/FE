import client, { isMock } from './client';

// ── Mock 데이터 ─────────────────────────────────────────
const MOCK_USER = {
  user_id: '00000000-0000-0000-0000-000000000001',
  email: 'test@damda.com',
  nickname: '테스트유저',
  profile_image_url: null,
  notify_analysis: true,
  notify_recommend: true,
};

const MOCK_TOKEN = 'mock_access_token_dev';

// ── 로그인 ──────────────────────────────────────────────
export async function login(email, password) {
  if (isMock) {
    await delay(600);
    const users = JSON.parse(localStorage.getItem('skinlab_users') || '[]');
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
    // Mock 유저 정보를 damda_user에 미리 저장해두면 getMe()가 읽어감
    const { password: _, ...userData } = found;
    localStorage.setItem('damda_user', JSON.stringify({ ...MOCK_USER, ...userData }));
    return { access_token: MOCK_TOKEN };
  }

  // BE: POST /auth/login → { access_token, token_type }
  const res = await client.post('/auth/login', { email, password });
  return res.data; // { access_token, token_type }
}

// ── 회원가입 ────────────────────────────────────────────
export async function signup(data) {
  if (isMock) {
    await delay(800);
    const users = JSON.parse(localStorage.getItem('skinlab_users') || '[]');
    if (users.find((u) => u.email === data.email)) {
      throw new Error('이미 등록된 이메일입니다.');
    }
    const newUser = {
      ...MOCK_USER,
      email: data.email,
      nickname: data.nickname || data.email.split('@')[0],
      user_id: Date.now().toString(),
    };
    users.push({ ...newUser, password: data.password });
    localStorage.setItem('skinlab_users', JSON.stringify(users));
    // getMe()가 읽어갈 수 있도록 미리 저장
    localStorage.setItem('damda_user', JSON.stringify(newUser));
    return { access_token: MOCK_TOKEN };
  }

  // BE: POST /auth/signup → { access_token, token_type }
  const res = await client.post('/auth/signup', data);
  return res.data;
}

// ── 내 정보 조회 (JWT 토큰 검증 겸용) ──────────────────
// BE: GET /mypage → MypageOut { user_id, email, nickname, profile_image_url, notify_* }
export async function getMe() {
  if (isMock) {
    await delay(300);
    const stored = localStorage.getItem('damda_user');
    if (!stored) throw new Error('Not authenticated');
    return JSON.parse(stored);
  }

  const res = await client.get('/mypage');
  return res.data; // MypageOut
}

// ── 마이페이지 프로필 수정 ──────────────────────────────
// BE: PATCH /mypage (MypageUpdate) → MypageOut
// 수정 가능 필드: nickname, profile_image_url, notify_analysis, notify_recommend
export async function updateProfile(data) {
  if (isMock) {
    await delay(500);
    const stored = JSON.parse(localStorage.getItem('damda_user') || '{}');
    const updated = { ...stored, ...data };
    localStorage.setItem('damda_user', JSON.stringify(updated));
    return updated;
  }

  // BE가 받는 필드만 추려서 전송 (camelCase → snake_case)
  const payload = {};
  if (data.nickname !== undefined)           payload.nickname = data.nickname;
  if (data.profile_image_url !== undefined)  payload.profile_image_url = data.profile_image_url;
  if (data.notify_analysis !== undefined)    payload.notify_analysis = data.notify_analysis;
  if (data.notify_recommend !== undefined)   payload.notify_recommend = data.notify_recommend;
  // FE의 camelCase 필드도 허용
  if (data.profileImage !== undefined)       payload.profile_image_url = data.profileImage;

  const res = await client.patch('/mypage', payload);
  return res.data;
}

// ── 피부 설문 조회 ──────────────────────────────────────
// BE: GET /surveys/me → SurveyOut
export async function getSurvey() {
  if (isMock) {
    await delay(300);
    const stored = localStorage.getItem('damda_survey');
    if (!stored) return null; // 설문 미작성 → null
    return JSON.parse(stored);
  }

  try {
    const res = await client.get('/surveys/me');
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) return null; // 아직 설문 없음
    throw err;
  }
}

// ── 피부 설문 저장 ──────────────────────────────────────
// BE: PUT /surveys/me (SurveyIn) → SurveyOut
// SurveyIn: { skin_type, concerns[], allergies[], preferred_categories[], budget_min, budget_max }
export async function saveSurvey(data) {
  const budgetMin = data.budget_min ?? (data.budget ? Math.max(0, Number(data.budget) - 10000) : 0);
  const budgetMax = data.budget_max ?? (data.budget ? Number(data.budget) + 10000 : 100000);

  if (isMock) {
    await delay(400);
    const survey = {
      skin_type: data.skin_type,
      concerns: data.concerns || [],
      allergies: data.allergies || [],
      preferred_categories: data.preferred_categories || [],
      budget_min: budgetMin,
      budget_max: budgetMax,
      budget: data.budget || budgetMax,
    };
    localStorage.setItem('damda_survey', JSON.stringify(survey));
    return survey;
  }

  const payload = {
    skin_type: data.skin_type,
    concerns: data.concerns || [],
    allergies: data.allergies || [],
    preferred_categories: data.preferred_categories || [],
    budget_min: budgetMin,
    budget_max: budgetMax,
  };

  const res = await client.put('/surveys/me', payload);
  return res.data;
}

// ── 비밀번호 변경 ───────────────────────────────────────
export async function changePassword(currentPassword, newPassword) {
  if (isMock) {
    await delay(500);
    const users = JSON.parse(localStorage.getItem('skinlab_users') || '[]');
    const stored = JSON.parse(localStorage.getItem('damda_user') || '{}');
    const idx = users.findIndex((u) => u.user_id === stored.user_id || u.email === stored.email);
    if (idx === -1) throw new Error('사용자를 찾을 수 없습니다.');
    if (users[idx].password !== currentPassword) throw new Error('현재 비밀번호가 일치하지 않습니다.');
    users[idx].password = newPassword;
    localStorage.setItem('skinlab_users', JSON.stringify(users));
    return { success: true };
  }

  const res = await client.post('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return res.data;
}

// ── 유틸 ────────────────────────────────────────────────
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
