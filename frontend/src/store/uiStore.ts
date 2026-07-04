import { create } from 'zustand';
import type { Account, Platform } from '@/types/trade';
import type { Lang } from '@/i18n';
import i18n from '@/i18n';
import { SYMBOLS_LIST } from '@/lib/seededTrades';

export type Theme = 'dark' | 'light';

export type TabKey = 'dashboard' | 'tradelog' | 'calendar' | 'reports' | 'settings';

const DEFAULT_TAGS = ['breakout', 'earnings', 'reversal', 'trend', 'news', 'gap', 'manual'];

export interface KpiVisibility {
  netpnl: boolean;
  winrate: boolean;
  pf: boolean;
  avgwl: boolean;
  maxdd: boolean;
  balance: boolean;
}

const DEFAULT_PLATFORMS: Platform[] = [
  { id: 'p1', name: 'Interactive Brokers', accounts: [{ id: 'a1', name: 'Main' }, { id: 'a2', name: 'Paper' }] },
  { id: 'p2', name: 'TD Ameritrade', accounts: [{ id: 'a3', name: 'Individual' }] },
];

/** 平台 / 帳戶示範名稱的中文對照。 */
export const NAME_TRANSLATIONS: Record<string, string> = {
  'Interactive Brokers': '盈透證券',
  'TD Ameritrade': '德美利證券',
  Main: '主帳戶',
  Paper: '模擬帳戶',
  Individual: '個人帳戶',
};

interface UiState {
  tab: TabKey;
  theme: Theme;
  lang: Lang;
  platforms: Platform[];
  activeAccountIds: string[];
  initialCapital: number;
  kpiVisible: KpiVisibility;
  monthOffset: number;
  symbolsList: string[];
  tagsList: string[];

  setTab: (tab: TabKey) => void;
  toggleTheme: () => void;
  toggleLang: () => void;
  setActiveAccountIds: (ids: string[]) => void;
  toggleAccount: (id: string) => void;
  toggleKpi: (key: keyof KpiVisibility) => void;
  setMonthOffset: (offset: number) => void;

  // 設定維護（Settings 頁 + API 同步共用）
  setSettings: (data: {
    initialCapital: number;
    platforms: Platform[];
    symbols: string[];
    tags: string[];
  }) => void;
  setInitialCapital: (value: number) => void;
  addPlatform: (platform: Platform) => void;
  removePlatform: (id: string) => void;
  addAccount: (platformId: string, account: Account) => void;
  removeAccount: (id: string) => void;
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function applyLang(lang: Lang) {
  void i18n.changeLanguage(lang);
  document.documentElement.setAttribute('lang', lang);
}

export const useUiStore = create<UiState>((set, get) => ({
  tab: 'dashboard',
  theme: 'dark',
  lang: 'en',
  platforms: DEFAULT_PLATFORMS,
  activeAccountIds: ['a1'],
  initialCapital: 10000,
  kpiVisible: { netpnl: true, winrate: true, pf: true, avgwl: true, maxdd: true, balance: false },
  monthOffset: 0,
  symbolsList: [...SYMBOLS_LIST],
  tagsList: [...DEFAULT_TAGS],

  setTab: (tab) => set({ tab }),
  toggleTheme: () => {
    const theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    set({ theme });
  },
  toggleLang: () => {
    const lang: Lang = get().lang === 'en' ? 'zh-Hant' : 'en';
    applyLang(lang);
    set({ lang });
  },
  setActiveAccountIds: (ids) => set({ activeAccountIds: ids.length ? ids : get().activeAccountIds }),
  toggleAccount: (id) => {
    const current = get().activeAccountIds;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    // 至少保留一個選取
    set({ activeAccountIds: next.length ? next : current });
  },
  toggleKpi: (key) => set((s) => ({ kpiVisible: { ...s.kpiVisible, [key]: !s.kpiVisible[key] } })),
  setMonthOffset: (offset) => set({ monthOffset: offset }),

  setSettings: (data) => {
    const validAccountIds = new Set(data.platforms.flatMap((p) => p.accounts.map((a) => a.id)));
    const keptActive = get().activeAccountIds.filter((id) => validAccountIds.has(id));
    const fallback = data.platforms[0]?.accounts[0]?.id;
    set({
      initialCapital: data.initialCapital,
      platforms: data.platforms,
      symbolsList: data.symbols,
      tagsList: data.tags,
      activeAccountIds: keptActive.length ? keptActive : fallback ? [fallback] : [],
    });
  },
  setInitialCapital: (value) => set({ initialCapital: value }),
  addPlatform: (platform) => set((s) => ({ platforms: [...s.platforms, platform] })),
  removePlatform: (id) => {
    const platform = get().platforms.find((p) => p.id === id);
    const removedAccountIds = new Set(platform?.accounts.map((a) => a.id) ?? []);
    const platforms = get().platforms.filter((p) => p.id !== id);
    const active = get().activeAccountIds.filter((aid) => removedAccountIds.has(aid) === false);
    const fallback = platforms[0]?.accounts[0]?.id;
    set({ platforms, activeAccountIds: active.length ? active : fallback ? [fallback] : [] });
  },
  addAccount: (platformId, account) =>
    set((s) => ({
      platforms: s.platforms.map((p) =>
        p.id === platformId ? { ...p, accounts: [...p.accounts, account] } : p,
      ),
    })),
  removeAccount: (id) => {
    const platforms = get().platforms.map((p) => ({
      ...p,
      accounts: p.accounts.filter((a) => a.id !== id),
    }));
    const active = get().activeAccountIds.filter((aid) => aid !== id);
    const fallback = platforms[0]?.accounts[0]?.id;
    set({ platforms, activeAccountIds: active.length ? active : fallback ? [fallback] : [] });
  },
  addSymbol: (symbol) =>
    set((s) => (s.symbolsList.includes(symbol) ? s : { symbolsList: [...s.symbolsList, symbol] })),
  removeSymbol: (symbol) => set((s) => ({ symbolsList: s.symbolsList.filter((x) => x !== symbol) })),
  addTag: (tag) => set((s) => (s.tagsList.includes(tag) ? s : { tagsList: [...s.tagsList, tag] })),
  removeTag: (tag) => set((s) => ({ tagsList: s.tagsList.filter((x) => x !== tag) })),
}));
