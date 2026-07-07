import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Kpis } from '@/lib/metrics';
import { fmtMoney } from '@/lib/format';
import type { KpiCardVM } from '@/pages/dashboard/KpiCard';

/**
 * 由 KPI 數值組出六張 KPI 卡片的 view model。Dashboard 與 Reports 共用。
 */
export function useKpiCards(kpis: Kpis): KpiCardVM[] {
  const { t } = useTranslation();

  return useMemo<KpiCardVM[]>(() => {
    const { netPnl, winRate, profitFactor, avgWin, avgLoss, avgWL, maxDrawdown, balance, expectancy, currentStreak } = kpis;
    const wlTotal = Math.max(0.01, avgWin + avgLoss);
    // 連勝連敗：正 = 連勝 nW，負 = 連敗 nL（交易慣例縮寫，不翻譯）。
    const streakText = currentStreak === 0 ? '0' : `${Math.abs(currentStreak)}${currentStreak > 0 ? 'W' : 'L'}`;
    return [
      { key: 'netpnl', label: t('kpi.netpnl'), value: fmtMoney(netPnl), valueColor: netPnl >= 0 ? 'green' : 'red' },
      { key: 'winrate', label: t('kpi.winrate'), value: winRate.toFixed(1) + '%', valueColor: 'ink', ringFraction: Math.max(0, Math.min(100, winRate)) / 100 },
      { key: 'pf', label: t('kpi.pf'), value: profitFactor.toFixed(2), valueColor: 'ink' },
      { key: 'avgwl', label: t('kpi.avgwl'), value: avgWL.toFixed(1) + 'R', valueColor: 'ink', ringFraction: avgWin / wlTotal, avgWinText: '$' + avgWin.toFixed(1), avgLossText: '$' + avgLoss.toFixed(1) },
      { key: 'maxdd', label: t('kpi.maxdd'), value: fmtMoney(maxDrawdown), valueColor: 'red' },
      { key: 'balance', label: t('kpi.balance'), value: fmtMoney(balance), valueColor: 'ink' },
      { key: 'expectancy', label: t('kpi.expectancy'), value: fmtMoney(expectancy), valueColor: expectancy >= 0 ? 'green' : 'red' },
      { key: 'streak', label: t('kpi.streak'), value: streakText, valueColor: currentStreak >= 0 ? 'green' : 'red' },
    ];
  }, [kpis, t]);
}
