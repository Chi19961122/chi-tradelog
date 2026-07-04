import { Topbar } from '@/components/Topbar/Topbar';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { TradeLog } from '@/pages/tradeLog/TradeLog';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { Reports } from '@/pages/reports/Reports';
import { Settings } from '@/pages/settings/Settings';
import { LoginCard } from '@/pages/login/LoginCard';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

/**
 * 依 Topbar 選取的分頁切換畫面（client-side，無重新載入）。所有分頁皆已實作。
 * 未登入時顯示登入卡。
 */
export function App() {
  const tab = useUiStore((s) => s.tab);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <LoginCard />;
  }

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
