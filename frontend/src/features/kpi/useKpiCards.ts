import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { deltaFor, type Kpis } from '@/lib/metrics';
import { fmtMoney } from '@/lib/format';
import type { KpiCardVM } from '@/pages/dashboard/KpiCard';

/**
 * 由 KPI 數值組出六張 KPI 卡片的 view model。
 * Dashboard 與 Reports 共用；delta 為與原型一致的確定性「較上月」。
 */
export function useKpiCards(kpis: Kpis): KpiCardVM[] {
  const { t } = useTranslation();

  return useMemo<KpiCardVM[]>(() => {
    const { netPnl, winRate, profitFactor, avgWin, avgLoss, avgWL, maxDrawdown, balance } = kpis;
    const wlTotal = Math.max(0.01, avgWin + avgLoss);
    const d1 = deltaFor(1.1, true);
    return [
      { key: 'netpnl', label: t('kpi.netpnl'), value: fmtMoney(netPnl), valueColor: netPnl >= 0 ? 'green' : 'red', delta: d1 },
      { key: 'winrate', label: t('kpi.winrate'), value: winRate.toFixed(1) + '%', valueColor: 'ink', delta: deltaFor(2.2, true), ringFraction: Math.max(0, Math.min(100, winRate)) / 100 },
      { key: 'pf', label: t('kpi.pf'), value: profitFactor.toFixed(2), valueColor: 'ink', delta: deltaFor(3.3, true) },
      { key: 'avgwl', label: t('kpi.avgwl'), value: avgWL.toFixed(1) + 'R', valueColor: 'ink', delta: deltaFor(4.4, true), ringFraction: avgWin / wlTotal, avgWinText: '$' + avgWin.toFixed(1), avgLossText: '$' + avgLoss.toFixed(1) },
      { key: 'maxdd', label: t('kpi.maxdd'), value: fmtMoney(maxDrawdown), valueColor: 'red', delta: deltaFor(5.5, false) },
      { key: 'balance', label: t('kpi.balance'), value: fmtMoney(balance), valueColor: 'ink', delta: d1 },
    ];
  }, [kpis, t]);
}
