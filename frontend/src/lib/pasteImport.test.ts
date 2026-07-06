import { describe, expect, it } from 'vitest';
import { parseMoney, parsePastedTrades, parseReportDateTime } from './pasteImport';
import { computeTradeFields } from './tradeForm';

// 使用者實際貼上的券商報表範例（5 筆期貨交易，第一段含表頭）。
const SAMPLE = `Trades
Broker
Account Name
Instrument
Open time
Close time
Side
Quantity
Entry Price
Exit Price
Net P&L
Charges
Tags
Lucid Trading
LFE025-U...-TEST014
YM
2026/7/3 下午3:24:25
2026/7/3 下午4:03:21
short
2
$53,287.00
$53,214.00
$723.00
$7.00

Details
Lucid Trading
LFE025-U...-TEST014
MNQ
2026/7/3 下午3:10:42
2026/7/3 下午3:20:12
short
5
$29,838.90
$29,855.15
$167.50
$5.00

Details
Lucid Trading
LFE025-U...-TEST014
MNQ
2026/7/3 下午2:40:30
2026/7/3 下午3:08:08
short
2
$29,852.25
$29,846.75
$20.00
$2.00

Details
Lucid Trading
LFE025-U...-TEST014
YM
2026/7/3 下午2:43:59
2026/7/3 下午2:59:04
short
1
$53,304.00
$53,307.00
$18.50
$3.50

Details
Lucid Trading
LFE025-U...-TEST014
YM
2026/7/3 下午2:18:42
2026/7/3 下午2:34:55
short
2
$53,285.00
$53,305.00
$207.00
$7.00

Details`;

describe('parsePastedTrades（黃金案例）', () => {
  const rows = parsePastedTrades(SAMPLE);

  it('parses all 5 records with symbol/side/qty/day', () => {
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.sym)).toEqual(['YM', 'MNQ', 'MNQ', 'YM', 'YM']);
    expect(rows.every((r) => r.side === 'Short')).toBe(true);
    expect(rows.every((r) => r.day === 3)).toBe(true);
    expect(rows.map((r) => r.qty)).toEqual([2, 5, 2, 1, 2]);
  });

  it('takes P&L magnitude from the report and sign from price direction (futures multiplier)', () => {
    // YM short 53287→53214：價跌 → 獲利 +723（若用價差×口數只會得到 146，故必須信任報表金額）
    expect(rows[0].pnl).toBe(723);
    // MNQ short 29838.90→29855.15：價漲 → 虧損 −167.50（報表顯示不帶負號）
    expect(rows[1].pnl).toBe(-167.5);
    expect(rows[2].pnl).toBe(20);
    expect(rows[3].pnl).toBe(-18.5);
    expect(rows[4].pnl).toBe(-207);
  });

  it('parses charges and 上午/下午 timestamps into ISO', () => {
    expect(rows[0].charges).toBe(7);
    const opened = new Date(rows[0].openedAt!);
    expect(opened.getHours()).toBe(15); // 下午3:24
    expect(opened.getMinutes()).toBe(24);
  });

  it('derives holdingMinutes from timestamps via computeTradeFields', () => {
    const c = computeTradeFields(rows[0]);
    expect(c.pnl).toBe(723); // 帶入值不被重算
    expect(c.holdingMinutes).toBe(39); // 15:24:25 → 16:03:21 ≈ 39 分鐘
  });

  it('defaults tags to [manual] when the report has none', () => {
    expect(rows[0].tags).toEqual(['manual']);
  });
});

describe('parsePastedTrades（容錯）', () => {
  it('returns [] for empty or garbage input', () => {
    expect(parsePastedTrades('')).toEqual([]);
    expect(parsePastedTrades('hello\nworld')).toEqual([]);
  });

  it('skips malformed chunks but keeps valid ones', () => {
    const text = `SomeBroker
Acc
YM
2026/7/3 下午3:24:25
2026/7/3 下午4:03:21
long
2
$100.00
$110.00
$20.00
$1.00

Details
broken
chunk`;
    const rows = parsePastedTrades(text);
    expect(rows).toHaveLength(1);
    expect(rows[0].side).toBe('Long');
    expect(rows[0].pnl).toBe(20); // Long 且價漲 → 正
  });
});

describe('parseMoney', () => {
  it('handles $, thousands separators, minus and parentheses', () => {
    expect(parseMoney('$53,287.00')).toBe(53287);
    expect(parseMoney('-$167.50')).toBe(-167.5);
    expect(parseMoney('($1,234.00)')).toBe(-1234);
    expect(parseMoney('not money')).toBeNull();
  });
});

describe('parseReportDateTime', () => {
  it('parses 上午/下午, AM/PM and 24h forms', () => {
    expect(parseReportDateTime('2026/7/3 下午3:24:25')!.getHours()).toBe(15);
    expect(parseReportDateTime('2026/7/3 上午12:05:00')!.getHours()).toBe(0);
    expect(parseReportDateTime('2026/7/3 3:24:25 PM')!.getHours()).toBe(15);
    expect(parseReportDateTime('2026/7/3 14:05:00')!.getHours()).toBe(14);
    expect(parseReportDateTime('nonsense')).toBeNull();
  });
});
