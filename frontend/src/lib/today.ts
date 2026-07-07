/**
 * 執行期「今天」的單一來源。
 * 所有需要目前日期的模組一律由此取得，避免散落硬寫日期；
 * 測試可用 setTodayForTesting 注入固定日期以維持確定性。
 */

let overrideToday: Date | null = null;

/** 測試用：注入固定的「今天」（傳 null 還原為系統時間）。 */
export function setTodayForTesting(date: Date | null): void {
  overrideToday = date;
}

/** 取得「今天」（回傳複本，避免呼叫端誤改）。 */
export function today(): Date {
  return overrideToday ? new Date(overrideToday) : new Date();
}

/** 今年（西元年）。 */
export function currentYear(): number {
  return today().getFullYear();
}

/** 本月（0-based，0 = 一月）。 */
export function currentMonthIdx(): number {
  return today().getMonth();
}

/** Date → ISO 日期字串（yyyy-MM-dd，本地時區）。 */
export function toISODate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** 今天的 ISO 日期字串。 */
export function todayISO(): string {
  return toISODate(today());
}

/** ISO 日期字串 → 本地 Date（避免 new Date('yyyy-MM-dd') 的 UTC 解讀時區偏移）。 */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
