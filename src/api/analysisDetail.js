import client from './client';

export async function loadAnalysisDetail(sessionId, history = {}, signal) {
  const id = encodeURIComponent(sessionId);
  const [result, care] = await Promise.allSettled([
    client.get(`/result/${id}`, { signal }),
    client.get(`/care/${id}`, { signal }),
  ]);
  if (result.status === 'rejected') throw result.reason;
  const data = result.value.data;
  if (!data || (data.session_id && data.session_id !== sessionId)) throw new Error('촬영 결과를 확인할 수 없습니다.');
  const values = data.result || data;
  const number = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
  const advice = care.status === 'fulfilled' ? care.value.data || {} : {};
  const tips = Array.isArray(advice.tips) ? [...advice.tips] : advice.tips ? [advice.tips] : [];
  for (const key of ['morning_routine', 'night_routine', 'lifestyle_tips']) {
    if (advice[key]) tips.push(advice[key]);
  }
  return {
    ...history,
    sessionId,
    moisture: number(values.moisture ?? values.moisture_on),
    oil: number(values.sebum ?? values.oil),
    spots: number(values.pore ?? values.spots),
    elasticity: number(values.elasticity),
    pigmentation: number(values.pigmentation ?? values.melanin_on),
    overallScore: number(data.total_score ?? data.overallScore),
    white_image_url: data.white_image_url ?? values.white_image_url ?? history.white_image_url ?? null,
    uv_image_url: data.uv_image_url ?? values.uv_image_url ?? history.uv_image_url ?? null,
    date: history.date || (history.created_at ? new Date(history.created_at).toLocaleDateString('ko-KR') : ''),
    narrative: { summary: advice.summary || '', tips },
    advice,
    careMessage: care.status === 'rejected'
      ? (care.reason?.response?.status === 404 ? '이 촬영의 케어 가이드가 아직 없습니다.' : '케어 가이드를 불러오지 못했습니다.') : '',
  };
}
