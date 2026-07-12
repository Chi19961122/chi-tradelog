import { describe, expect, it } from 'vitest';
import { defaultTemplate, emptyJournalEntry, standardMistakes } from './journal';

describe('standardMistakes', () => {
  it('returns 6 standard items, all unchecked, per language', () => {
    const en = standardMistakes('en');
    expect(en).toHaveLength(6);
    for (const m of en) {
      expect(typeof m.label).toBe('string');
      expect(m.checked).toBe(false);
    }
    const zh = standardMistakes('zh');
    expect(zh).toHaveLength(6);
    expect(zh.map((m) => m.label)).toContain('報復性交易');
  });
});

describe('defaultTemplate', () => {
  it('differs by language', () => {
    expect(defaultTemplate('en')).toContain('Market context');
    expect(defaultTemplate('zh')).toContain('市場環境');
  });
});

describe('emptyJournalEntry', () => {
  it('starts blank: no notes, no emotions, no checked mistakes', () => {
    const entry = emptyJournalEntry('en');
    expect(entry.notes).toBe('');
    expect(entry.emotions).toEqual([]);
    expect(entry.mistakes).toHaveLength(6);
    expect(entry.mistakes.every((m) => m.checked === false)).toBe(true);
  });

  it('never produces content that behavior analytics would count', () => {
    // 不變量：新日記存檔後，情緒 × 績效與錯誤成本統計都必須為零貢獻。
    for (const lang of ['en', 'zh'] as const) {
      const entry = emptyJournalEntry(lang);
      expect(entry.emotions).toHaveLength(0);
      expect(entry.mistakes.filter((m) => m.checked)).toHaveLength(0);
    }
  });
});
