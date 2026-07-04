import { useTranslation } from 'react-i18next';
import { Topbar } from '@/components/Topbar/Topbar';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { TradeLog } from '@/pages/tradeLog/TradeLog';
import { useUiStore } from '@/store/uiStore';

/**
 * 依 Topbar 選取的分頁切換畫面（client-side，無重新載入）。
 * Dashboard、Trade Log 已實作；其餘畫面為 placeholder。
 */
export function App() {
  const { t } = useTranslation();
  const tab = useUiStore((s) => s.tab);

  return (
    <div>
      <Topbar />
      <main className="page-container">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'tradelog' && <TradeLog />}
        {(tab === 'calendar' || tab === 'reports' || tab === 'settings') && (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--faint)' }}>
            {t(`nav.${tab}`)} · {t('common.comingSoon')}
          </div>
        )}
      </main>
    </div>
  );
}
