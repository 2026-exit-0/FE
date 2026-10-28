// toISOString()은 UTC로 바꿔서 오전 9시 전에는 하루 전 날짜가 나오므로 쓰지 않는다.
export function toDateText(value = new Date()) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}