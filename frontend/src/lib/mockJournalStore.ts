import type { JournalEntry } from './journal';

/**
 * 記憶體內的 mock 日記存放區（單一 session）。
 * 未設定 VITE_API_BASE_URL 時使用，讓日記編輯可在前端獨立運作。
 */
const store = new Map<string, JournalEntry>();

export const mockJournalStore = {
  get(key: string): JournalEntry | null {
    return store.get(key) ?? null;
  },
  save(key: string, entry: JournalEntry): void {
    store.set(key, entry);
  },
};
