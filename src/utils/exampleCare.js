import { withExampleMetrics } from './exampleMetrics.js';
import { ROUTINE_TEMPLATES } from './careTemplates.js';

// 서버 결과를 변경하지 않고, 조회가 끝난 같은 촬영에만 표시용 리포트를 구성한다.
export function buildExampleCare(input) {
  const scan = withExampleMetrics(input);
  if (!scan?.sessionId) return null;
  const skinType = scan.skinType?.replace(' 피부', '').replace(' 경향', '') || null;
  const routine = skinType ? ROUTINE_TEMPLATES[skinType] : null;
  const definitions = [
    ['moisture', '수분도', '세안 후 피부 상태를 살피며 보습제를 사용해 주세요.'],
    ['oil', '유분도', '강하게 문지르지 말고 부드럽게 세안해 주세요.'],
    ['spots', '모공', '피부에 자극을 주는 과도한 세안이나 압출은 피해주세요.'],
    ['elasticity', '탄력', '보습과 자외선 차단을 꾸준히 유지해 주세요.'],
    ['pigmentation', '색소침착', '외출 시 자외선 차단에 신경 써 주세요.'],
  ];
  const metrics = definitions.map(([key, label, care]) => {
    const value = scan[key];
    const valid = typeof value === 'number' && Number.isFinite(value);
    return { key, label, sensor: valid ? `${value}%` : '데이터 없음',
      band: valid ? (scan.narrative?.per_metric?.find(item => item.name === label)?.rating === 'good' ? '좋음' : scan.narrative?.per_metric?.find(item => item.name === label)?.rating === 'poor' ? '주의' : '보통') : '데이터 없음',
      meaning: scan.narrative?.per_metric?.find(item => item.name === label)?.description || (valid ? `${label} 표시값은 ${value}%입니다.` : '이번 촬영에서 값을 확인하지 못했습니다.'),
      cause: '이 값만으로 원인을 판단하지 않습니다.', care,
    };
  });
  const summary = scan.narrative?.summary || (skinType ? `${skinType} 피부의 기본 관리 루틴을 확인해 주세요.` : '촬영 결과와 기본 관리 방법을 함께 확인해 주세요.');
  const tips = scan.narrative?.tips?.length ? scan.narrative.tips : routine
    ? [routine.morning?.[0]?.usage, routine.night?.[0]?.usage].filter(Boolean)
    : ['부드럽게 세안하고 피부 상태에 맞게 보습해 주세요.', '외출 시 자외선 차단을 챙겨 주세요.'];
  const report = {
    scan_area: scan.area || '촬영 부위', skin_type: skinType || '미확인',
    overall_score: scan.overallScore ?? null, summary, metrics,
    region_note: '부위별 사진과 수분·유분 기록을 함께 확인해 주세요.',
    recommend_basis: '제품 추천 화면에서 추천 이유와 성분 정보를 확인해 주세요.',
    lifestyle: tips,
  };
  return { report, narrative: { summary, tips }, advice: { summary, tips, report },
    recommendedProducts: [], careMessage: '', careSource: 'local-template', sessionId: scan.sessionId };
}
