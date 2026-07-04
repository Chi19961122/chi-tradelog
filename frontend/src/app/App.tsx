import { Topbar } from '@/components/Topbar/Topbar';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { TradeLog } from '@/pages/tradeLog/TradeLog';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { Reports } from '@/pages/reports/Reports';
import { Settings } from '@/pages/settings/Settings';
import { useUiStore } from '@/store/uiStore';

/**
 * 依 Topbar 選取的分頁切換畫面（client-side，無重新載入）。所有分頁皆已實作。
 */
export function App() {
  const tab = useUiStore((s) => s.tab);

  return (
    <div>
      <Topbar />
      <main className="page-container">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'tradelog' && <TradeLog />}
        {tab === 'calendar' && <CalendarPage />}
        {tab === 'reports' && <Reports />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  );
}
