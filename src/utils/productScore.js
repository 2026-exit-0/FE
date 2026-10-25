export function productScore(product) {
  const value = product.score ?? product.match_score ?? product.compatibility;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

export function productScoreLabel(product) {
  const score = productScore(product);
  return score === null ? '적합도 정보 없음' : `${score.toFixed(1)}점`;
}

export function compareProductScore(a, b) {
  const first = productScore(a);
  const second = productScore(b);
  if (first === null) return second === null ? 0 : 1;
  if (second === null) return -1;
  return second - first;
}
