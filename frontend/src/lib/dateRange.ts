/** 篩選用的日期區間（ISO 字串，空字串代表未設）。 */
export interface DateRange {
  from: string;
  to: string;
}

import { today } from './today';

export const EMPTY_RANGE: DateRange = { from: '', to: '' };

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export interface MonthCell {
  dayNum: number | null;
  iso: string | null;
}

/** 建立某月的日格（週日開頭，去除全空的尾列）。 */
export function buildMonthGrid(year: number, monthIdx: number): MonthCell[] {
  const firstDow = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  const cells: MonthCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDow + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    cells.push(
      inMonth
        ? { dayNum, iso: `${year}-${pad2(monthIdx + 1)}-${pad2(dayNum)}` }
        : { dayNum: null, iso: null },
    );
  }
  return cells;
}

export interface QuickRange {
  key: 'today' | 'week' | 'month' | 'quarter';
  from: string;
  to: string;
}

/** 快速區間：今日 / 本週 / 本月 / 本季（以執行期的「今天」為基準）。 */
export function quickRanges(): QuickRange[] {
  const now = today();
  const dow = (now.getDay() + 6) % 7; // Mon = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const qStart = new Date(now.getFullYear(), qStartMonth, 1);
  const qEnd = new Date(now.getFullYear(), qStartMonth + 3, 0);
  return [
    { key: 'today', from: iso(now), to: iso(now) },
    { key: 'week', from: iso(monday), to: iso(sunday) },
    { key: 'month', from: iso(monthStart), to: iso(monthEnd) },
    { key: 'quarter', from: iso(qStart), to: iso(qEnd) },
  ];
}

/** 判斷 ISO 日期是否落在區間內（含端點）。 */
export function isoInRange(day: string, range: DateRange): boolean {
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;
  return true;
}
