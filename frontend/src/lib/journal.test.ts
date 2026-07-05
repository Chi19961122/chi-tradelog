import { describe, expect, it } from 'vitest';
import { defaultEmotions, defaultJournalEntry, defaultMistakes, defaultTemplate } from './journal';

const EMOTION_POOL_EN = ['Confident', 'Patient', 'Anxious', 'FOMO', 'Greedy', 'Calm', 'Hesitant', 'Excited'];

describe('defaultEmotions', () => {
  it('is deterministic and returns 1–3 emotions from the pool', () => {
    const a = defaultEmotions('a1-AAPL-5', 'en');
    const b = defaultEmotions('a1-AAPL-5', 'en');
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(1);
    expect(a.length).toBeLessThanOrEqual(3);
    for (const emo of a) expect(EMOTION_POOL_EN).toContain(emo);
  });
});

describe('defaultMistakes', () => {
  it('is deterministic and returns 6 items with boolean checked', () => {
    const a = defaultMistakes('a1-TSLA-9', 'en');
    expect(a).toEqual(defaultMistakes('a1-TSLA-9', 'en'));
    expect(a).toHaveLength(6);
    for (const m of a) {
      expect(typeof m.label).toBe('string');
      expect(typeof m.checked).toBe('boolean');
    }
  });
});

describe('defaultTemplate', () => {
  it('differs by language', () => {
    expect(defaultTemplate('en')).toContain('Market context');
    expect(defaultTemplate('zh')).toContain('市場環境');
  });
});

describe('defaultJournalEntry', () => {
  it('bundles empty notes with default emotions and mistakes', () => {
    const entry = defaultJournalEntry('a1-AAPL-5', 'en');
    expect(entry.notes).toBe('');
    expect(entry.emotions).toEqual(defaultEmotions('a1-AAPL-5', 'en'));
    expect(entry.mistakes).toEqual(defaultMistakes('a1-AAPL-5', 'en'));
  });
});
