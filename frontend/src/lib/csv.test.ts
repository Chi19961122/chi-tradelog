import { describe, expect, it } from 'vitest';
import { makeTrade } from '@/test/factories';
import { parseTradesCsv, sampleCsv, tradesToCsv } from './csv';

describe('tradesToCsv', () => {
  it('emits the expected header and a row per trade', () => {
    const csv = tradesToCsv([makeTrade({ day: 5, sym: 'AAPL', entry: 100.5, exit: 110.25, qty: 10, pnl: 97.5, r: 0.98, tags: ['breakout', 'news'] })]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Date,Symbol,Side,Entry,Exit,Qty,PnL,R,Tags');
    expect(lines[1]).toBe('2026-07-05,AAPL,Long,100.50,110.25,10,97.50,0.98,breakout; news');
  });
});

describe('parseTradesCsv', () => {
  it('parses rows into trade inputs (day from date, tags split by ;)', () => {
    const csv = 'Date,Symbol,Side,Entry,Exit,Qty,PnL,R,Tags\n2026-07-08,tsla,Short,260.00,252.30,30,231,1.5,reversal; swing';
    const [input] = parseTradesCsv(csv);
    expect(input.sym).toBe('TSLA');
    expect(input.side).toBe('Short');
    expect(input.entry).toBe(260);
    expect(input.exit).toBe(252.3);
    expect(input.qty).toBe(30);
    expect(input.day).toBe(8);
    expect(input.tags).toEqual(['reversal', 'swing']);
  });

  it('defaults tags to [manual] when empty', () => {
    const csv = 'Date,Symbol,Side,Entry,Exit,Qty,PnL,R,Tags\n2026-07-01,AAPL,Long,1,2,1,1,1,';
    expect(parseTradesCsv(csv)[0].tags).toEqual(['manual']);
  });

  it('returns empty for header-only or blank input', () => {
    expect(parseTradesCsv('')).toEqual([]);
    expect(parseTradesCsv('Date,Symbol,Side,Entry,Exit,Qty,PnL,R,Tags')).toEqual([]);
  });
});

describe('CSV round-trip', () => {
  it('export → import preserves sym/side/qty/day/entry/exit/tags', () => {
    const trade = makeTrade({ day: 12, sym: 'NVDA', side: 'Short', entry: 420.1, exit: 405.6, qty: 25, tags: ['trend'] });
    const [input] = parseTradesCsv(tradesToCsv([trade]));
    expect(input.sym).toBe('NVDA');
    expect(input.side).toBe('Short');
    expect(input.qty).toBe(25);
    expect(input.day).toBe(12);
    expect(input.entry).toBe(420.1);
    expect(input.exit).toBe(405.6);
    expect(input.tags).toEqual(['trend']);
  });
});

describe('sampleCsv', () => {
  it('has the header plus two example rows', () => {
    const lines = sampleCsv().split('\n');
    expect(lines[0]).toContain('Date,Symbol,Side');
    expect(lines).toHaveLength(3);
  });
});
