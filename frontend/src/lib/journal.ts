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

/** 日記的唯一鍵：帳戶-商品-完整日期（ISO）。 */
export function journalKey(accountId: string, symbol: string, date: string): string {
  return `${accountId}-${symbol}-${date}`;
}

const MISTAKE_POOL_EN = ['Moved stop loss', 'Oversized position', 'Chased entry', 'No clear plan', 'Ignored trend', 'Revenge trade'];
const MISTAKE_POOL_ZH = ['移動停損', '部位過大', '追高進場', '無明確計畫', '忽略趨勢', '報復性交易'];

/** 標準錯誤檢討清單：六個常見項目、全部未勾選，供使用者自行勾選。 */
export function standardMistakes(lang: 'en' | 'zh'): MistakeItem[] {
  const pool = lang === 'en' ? MISTAKE_POOL_EN : MISTAKE_POOL_ZH;
  return pool.map((label) => ({ label, checked: false }));
}

/** 筆記預設範本。 */
export function defaultTemplate(lang: 'en' | 'zh'): string {
  return lang === 'en'
    ? 'Market context:<br><br>Emotions:<br><br>Discipline:<br><br>Improvements:<br>'
    : '市場環境：<br><br>情緒：<br><br>紀律：<br><br>改進方向：<br>';
}

/**
 * 空白日記（無儲存資料時使用）：不預選情緒、不預勾錯誤。
 * 不變量：新日記不得含任何會被行為分析統計的內容——
 * 情緒 × 績效與錯誤成本報表只能反映使用者的真實輸入。
 */
export function emptyJournalEntry(lang: 'en' | 'zh'): JournalEntry {
  return {
    notes: '',
    emotions: [],
    mistakes: standardMistakes(lang),
  };
}
