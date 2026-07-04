import { create } from 'zustand';
import type { Platform } from '@/types/trade';
import type { Lang } from '@/i18n';
import i18n from '@/i18n';

export type Theme = 'dark' | 'light';

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
  theme: Theme;
  lang: Lang;
  platforms: Platform[];
  activeAccountIds: string[];
  initialCapital: number;
  kpiVisible: KpiVisibility;
  monthOffset: number;

  toggleTheme: () => void;
  toggleLang: () => void;
  setActiveAccountIds: (ids: string[]) => void;
  toggleAccount: (id: string) => void;
  toggleKpi: (key: keyof KpiVisibility) => void;
  setMonthOffset: (offset: number) => void;
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function applyLang(lang: Lang) {
  void i18n.changeLanguage(lang);
  document.documentElement.setAttribute('lang', lang);
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: 'dark',
  lang: 'en',
  platforms: DEFAULT_PLATFORMS,
  activeAccountIds: ['a1'],
  initialCapital: 10000,
  kpiVisible: { netpnl: true, winrate: true, pf: true, avgwl: true, maxdd: true, balance: false },
  monthOffset: 0,

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
}));
