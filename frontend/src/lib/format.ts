/** 金額格式化：帶正負號的 $，例：+$1,234 / -$56。 */
export function fmtMoney(n: number, digits = 0): string {
  const sign = n < 0 ? '-' : '+';
  return (
    sign +
    '$' +
    Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: digits })
  );
}

/** 百分比，1 位小數。 */
export function fmtPct(n: number, digits = 1): string {
  return n.toFixed(digits) + '%';
}
