import client from './client';

export async function loadAnalysisDetail(sessionId, history = {}, signal) {
  const id = encodeURIComponent(sessionId);
  const { data } = await client.get(`/result/${id}`, { signal });
  if (!data || (data.session_id && data.session_id !== sessionId)) throw new Error('촬영 결과를 확인할 수 없습니다.');
  const values = data.result || data;
  const number = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
  // 변환 과정에서 붙인 기본 점수 대신 같은 세션의 원본 응답만 보존한다.
  const original = history._raw || history;
  const originalId = original.session_id || original.sessionId || history.sessionId || history.session_id;
  const storedScore = originalId === sessionId && !history.is_mock && !original.is_mock
    ? number(original.total_score ?? original.overallScore ?? original.narrative?.overall_score) : null;
  return {
    ...history,
    sessionId,
    moisture: number(values.moisture ?? values.moisture_on),
    oil: number(values.sebum ?? values.oil),
    spots: number(values.pore ?? values.spots),
    elasticity: number(values.elasticity),
    pigmentation: number(values.pigmentation ?? values.melanin_on),
    overallScore: number(data.total_score ?? data.overallScore) ?? storedScore,
    white_image_url: data.white_image_url ?? values.white_image_url ?? history.white_image_url ?? null,
    uv_image_url: data.uv_image_url ?? values.uv_image_url ?? history.uv_image_url ?? null,
    date: history.date || (history.created_at ? new Date(history.created_at).toLocaleDateString('ko-KR') : ''),
    narrative: { summary: '', tips: [] },
    advice: {},
    careMessage: '케어 가이드를 불러오는 중입니다.',
  };
}

export async function loadAnalysisCare(sessionId, signal) {
  try {
    const { data: advice = {} } = await client.get(`/care/${encodeURIComponent(sessionId)}`, { signal });
    const tips = Array.isArray(advice.tips) ? [...advice.tips] : advice.tips ? [advice.tips] : [];
    for (const key of ['morning_routine', 'night_routine', 'lifestyle_tips']) {
      if (advice[key]) tips.push(advice[key]);
    }
    return { narrative: { summary: advice.summary || '', tips }, advice, careMessage: '' };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { narrative: { summary: '', tips: [] }, advice: {}, careMessage: error.response?.status === 404
      ? '이 촬영의 케어 가이드가 아직 없습니다.' : '케어 가이드를 불러오지 못했습니다.' };
  }
}
