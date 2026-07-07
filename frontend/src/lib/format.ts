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

const MONTHS_EN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ISO 日期 → 簡短顯示（en: "Jul 3"；zh: "7/3"）。 */
export function fmtShortDate(iso: string, lang: 'en' | 'zh'): string {
  const [, m, d] = iso.split('-').map(Number);
  return lang === 'zh' ? `${m}/${d}` : `${MONTHS_EN_SHORT[(m || 1) - 1]} ${d}`;
}

/** ISO 日期 → 完整顯示（en: "Jul 3, 2026"；zh: "2026/7/3"）。 */
export function fmtFullDate(iso: string, lang: 'en' | 'zh'): string {
  const [y, m, d] = iso.split('-').map(Number);
  return lang === 'zh' ? `${y}/${m}/${d}` : `${MONTHS_EN_SHORT[(m || 1) - 1]} ${d}, ${y}`;
}
