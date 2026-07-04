import { seededRand } from './seededTrades';

/** 錯誤檢討項目。 */
export interface MistakeItem {
  label: string;
  checked: boolean;
}

/** 一筆交易日記。 */
export interface JournalEntry {
  notes: string;
  emotions: string[];
  mistakes: MistakeItem[];
}

/** 日記的唯一鍵：帳戶-商品-日期。 */
export function journalKey(accountId: string, symbol: string, day: number): string {
  return `${accountId}-${symbol}-${day}`;
}

const EMOTION_POOL_EN = ['Confident', 'Patient', 'Anxious', 'FOMO', 'Greedy', 'Calm', 'Hesitant', 'Excited'];
const EMOTION_POOL_ZH = ['自信', '耐心', '焦慮', '錯失恐懼', '貪婪', '平靜', '猶豫', '興奮'];
const MISTAKE_POOL_EN = ['Moved stop loss', 'Oversized position', 'Chased entry', 'No clear plan', 'Ignored trend', 'Revenge trade'];
const MISTAKE_POOL_ZH = ['移動停損', '部位過大', '追高進場', '無明確計畫', '忽略趨勢', '報復性交易'];

function keySeed(key: string): number {
  return key.length + key.charCodeAt(0);
}

/** 依 key 確定性產生預設情緒（與原型一致）。 */
export function defaultEmotions(key: string, lang: 'en' | 'zh'): string[] {
  const pool = lang === 'en' ? EMOTION_POOL_EN : EMOTION_POOL_ZH;
  const seed = keySeed(key);
  const picked = pool.filter((_, i) => seededRand((seed + i) * 3.3) > 0.55).slice(0, 3);
  return picked.length ? picked : [pool[0]];
}

/** 依 key 確定性產生預設錯誤檢討清單（與原型一致）。 */
export function defaultMistakes(key: string, lang: 'en' | 'zh'): MistakeItem[] {
  const pool = lang === 'en' ? MISTAKE_POOL_EN : MISTAKE_POOL_ZH;
  const seed = keySeed(key);
  return pool.map((label, i) => ({ label, checked: seededRand((seed + i) * 6.1) > 0.6 }));
}

/** 筆記預設範本。 */
export function defaultTemplate(lang: 'en' | 'zh'): string {
  return lang === 'en'
    ? 'Market context:<br><br>Emotions:<br><br>Discipline:<br><br>Improvements:<br>'
    : '市場環境：<br><br>情緒：<br><br>紀律：<br><br>改進方向：<br>';
}

/** 建立一筆預設日記（無儲存資料時使用）。 */
export function defaultJournalEntry(key: string, lang: 'en' | 'zh'): JournalEntry {
  return {
    notes: '',
    emotions: defaultEmotions(key, lang),
    mistakes: defaultMistakes(key, lang),
  };
}
