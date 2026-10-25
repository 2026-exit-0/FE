// 종합점수에만 적용한다. 개별 측정 지표의 좋고 나쁨은 별도로 판단한다.
export function scoreColor(score) {
  if (score == null || score === '' || !Number.isFinite(Number(score))) return '#9CA3AF';
  return Number(score) >= 70 ? '#4CAF50' : Number(score) >= 50 ? '#EAB308' : '#F97316';
}
