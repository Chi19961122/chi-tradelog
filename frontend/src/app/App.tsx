import { Topbar } from '@/components/Topbar/Topbar';
import { Dashboard } from '@/pages/dashboard/Dashboard';

/**
 * 目前僅實作 Dashboard。之後接上 router 後，Topbar 的 nav pills 會切換頁面；
 * 現階段其他分頁為 placeholder。
 */
export function App() {
  return (
    <div>
      <Topbar />
      <main className="page-container">
        <Dashboard />
      </main>
    </div>
  );
}
