export function productPrice(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

export function productPriceLabel(product) {
  const price = productPrice(product.price);
  if (price !== null) return `${price.toLocaleString('ko-KR')}원`;
  return typeof product.price_range === 'string' && product.price_range.trim()
    ? `가격대 ${product.price_range.trim()}` : '가격 정보 없음';
}

export function compareProductPrice(a, b, descending = false) {
  const first = productPrice(a.price);
  const second = productPrice(b.price);
  if (first === null) return second === null ? 0 : 1;
  if (second === null) return -1;
  return descending ? second - first : first - second;
}
