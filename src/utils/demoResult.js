// 기존 scan.js의 설문별 생성 규칙과 문구를 공유한다. 난수만 세션별로 고정한다.
function seededValue(id, index, min, max) {
  let hash = 2166136261;
  for (const char of `team-demo-v1:${id}:${index}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return min + hash % (max - min + 1);
}

export function buildDemoResult(region, { sessionId, survey = {}, actual } = {}) {
  const s = survey;
  let index = 0;
  const rand = (min, max) => seededValue(sessionId, index++, min, max);
  const skinType = s.skin_type || '복합성';
  const concerns = Array.isArray(s.concerns) ? s.concerns : [];

  let moisture = rand(58, 78), oil = rand(40, 58), elasticity = rand(58, 78),
      spots = rand(58, 78), pigmentation = rand(35, 50);

  if (skinType === '건성') { moisture = rand(30, 45); oil = rand(25, 40); }
  else if (skinType === '지성') { oil = rand(68, 85); }
  else if (skinType === '민감성') { moisture = rand(40, 55); }

  if (concerns.includes('건조')) moisture = rand(28, 42);
  if (concerns.includes('모공')) spots = rand(28, 45);
  if (concerns.includes('주름') || concerns.includes('탄력')) elasticity = rand(28, 45);
  if (concerns.includes('색소침착')) pigmentation = rand(60, 80);
  if (concerns.includes('여드름')) { oil = rand(68, 85); spots = rand(30, 48); }

  if (actual) {
    moisture = actual.moisture;
    oil = actual.oil;
  }
  const valid = value => typeof value === 'number' && Number.isFinite(value);
  const overall = valid(moisture) && valid(oil) ? Math.round((moisture + (100 - oil) + elasticity + spots + (100 - pigmentation)) / 5) : null;

  const result = {
    session_id: sessionId,
    narrative: {
      overall_score: overall,
      summary: overall == null ? '수분·유분 데이터가 없어 종합점수를 계산하지 못했습니다.' : `${region} 측정 기준 전반적으로 ${overall >= 70 ? '양호한' : '관리가 필요한'} 피부 상태입니다.`,
      per_metric: [
        { name: '수분도', value: `${moisture}%`, rating: moisture >= 60 ? 'good' : moisture >= 45 ? 'fair' : 'poor', rating_text: moisture >= 60 ? '정상' : moisture >= 45 ? '보통' : '주의', description: `측정 부위(${region}) 수분`, personalized_note: moisture < 50 ? '보습제 추가를 권장합니다.' : null },
        { name: '유분도', value: `${oil}%`, rating: oil <= 60 ? 'good' : 'fair', rating_text: oil <= 60 ? '보통' : '주의', description: `측정 부위(${region}) 유분`, personalized_note: null },
        { name: '탄력', value: `${elasticity}%`, rating: elasticity >= 60 ? 'good' : elasticity >= 45 ? 'fair' : 'poor', rating_text: elasticity >= 60 ? '정상' : elasticity >= 45 ? '보통' : '주의', description: `측정 부위(${region}) 탄력`, personalized_note: null },
        { name: '모공', value: `${spots}%`, rating: spots >= 60 ? 'good' : 'fair', rating_text: spots >= 60 ? '양호' : '관리 권장', description: `측정 부위(${region}) 모공`, personalized_note: null },
        { name: '색소침착', value: `${pigmentation}%`, rating: pigmentation <= 50 ? 'good' : 'fair', rating_text: pigmentation <= 50 ? '정상' : '주의', description: `측정 부위(${region}) 색소`, personalized_note: null },
      ],
      tips: [
        '하루 1.5L 이상 충분한 수분 섭취를 권장합니다.',
        'SPF 30 이상 자외선 차단제를 매일 사용하세요.',
        oil > 60 ? 'T존 유분 관리를 위해 클레이 마스크를 주 1-2회 활용하세요.' : '건조함을 막기 위해 세안 후 즉시 보습을 해주세요.',
      ].filter(Boolean),
      user_context: { applied: Boolean(s.skin_type) },
    },
    predictions: {
      regression: { moisture, oil, elasticity, spots, pigmentation },
      classification: { skin_type: skinType },
    },
    recommended_products: [],
    white_image_url: '/assets/demo_white_light.jpg',
    uv_image_url: '/assets/demo_uv_light.jpg',
    meta: {
      region,
      ckpt_epoch: 'mock',
      sensor_inputs_used: [],
    },
    moisture,
    oil,
    elasticity,
    spots,
    pigmentation,
    overallScore: overall,
    skinType: `${skinType} 피부`,
    date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    area: region,
    is_mock: true,
  };
  for (const [i, value] of [[0, moisture], [1, oil]]) {
    if (!valid(value)) result.narrative.per_metric[i] = { name: result.narrative.per_metric[i].name, value: null, rating_text: '데이터 없음', description: '이번 촬영에서 값을 확인하지 못했습니다.', personalized_note: null };
  }
  return result;
}

