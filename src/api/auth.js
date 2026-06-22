import client, { isMock } from './client';

// ── Mock 데이터 ─────────────────────────────────────────
const MOCK_USER = {
  id: 1,
  email: 'test@damda.com',
  nickname: '테스트',
  skinType: '복합성',
  concerns: ['모공', '건조'],
  scanCount: 2,
};

const MOCK_TOKEN = 'mock_access_token_dev';

// ── 로그인 ──────────────────────────────────────────────
export async function login(email, password) {
  if (isMock) {
    await delay(600);
    const users = JSON.parse(localStorage.getItem('skinlab_users') || '[]');
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
    const { password: _, ...userData } = found;
    return { access_token: MOCK_TOKEN, user: userData };
  }

  const res = await client.post('/auth/login', { email, password });
  return res.data; // { access_token, user }
}

// ── 회원가입 ────────────────────────────────────────────
export async function signup(data) {
  if (isMock) {
    await delay(800);
    const users = JSON.parse(localStorage.getItem('skinlab_users') || '[]');
    if (users.find((u) => u.email === data.email)) {
      throw new Error('이미 등록된 이메일입니다.');
    }
    const newUser = { ...data, id: Date.now(), scanCount: 0, createdAt: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem('skinlab_users', JSON.stringify(users));
    const { password: _, ...userData } = newUser;
    return { access_token: MOCK_TOKEN, user: userData };
  }

  const res = await client.post('/auth/signup', data);
  return res.data;
}

// ── 내 정보 조회 (토큰 검증 겸용) ──────────────────────
export async function getMe() {
  if (isMock) {
    await delay(300);
    const stored = localStorage.getItem('damda_user');
    if (!stored) throw new Error('Not authenticated');
    return JSON.parse(stored);
  }

  const res = await client.get('/auth/me');
  return res.data;
}

// ── 프로필 수정 ─────────────────────────────────────────
export async function updateProfile(data) {
  if (isMock) {
    await delay(500);
    const stored = JSON.parse(localStorage.getItem('damda_user') || '{}');
    const updated = { ...stored, ...data };
    localStorage.setItem('damda_user', JSON.stringify(updated));
    return updated;
  }

  const res = await client.patch('/auth/me', data);
  return res.data;
}

// ── 비밀번호 변경 ───────────────────────────────────────
export async function changePassword(currentPassword, newPassword) {
  if (isMock) {
    await delay(500);
    const users = JSON.parse(localStorage.getItem('skinlab_users') || '[]');
    const stored = JSON.parse(localStorage.getItem('damda_user') || '{}');
    const idx = users.findIndex((u) => u.id === stored.id);
    if (idx === -1) throw new Error('사용자를 찾을 수 없습니다.');
    if (users[idx].password !== currentPassword) throw new Error('현재 비밀번호가 일치하지 않습니다.');
    users[idx].password = newPassword;
    localStorage.setItem('skinlab_users', JSON.stringify(users));
    return { success: true };
  }

  const res = await client.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
  return res.data;
}

// ── 유틸 ────────────────────────────────────────────────
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
