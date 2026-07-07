import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon/Icon';
import { useOutsideClick } from '@/lib/useOutsideClick';
import { useUiStore, NAME_TRANSLATIONS } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useTrades } from '@/features/trades/useTrades';
import { useJournalReminder } from '@/features/journal/useJournalReminder';
import { toMetricsLang } from '@/i18n';
import styles from './Topbar.module.css';

const NAV_KEYS = ['dashboard', 'tradelog', 'calendar', 'reports', 'settings'] as const;

export function Topbar() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const tab = useUiStore((s) => s.tab);
  const setTab = useUiStore((s) => s.setTab);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const toggleLang = useUiStore((s) => s.toggleLang);
  const platforms = useUiStore((s) => s.platforms);
  const activeAccountIds = useUiStore((s) => s.activeAccountIds);
  const toggleAccount = useUiStore((s) => s.toggleAccount);

  const displayName = (name: string) =>
    toMetricsLang(lang) === 'zh' ? (NAME_TRANSLATIONS[name] ?? name) : name;

  const accountLabel = (() => {
    const all = platforms.flatMap((p) => p.accounts.map((a) => ({ ...a, platform: p.name })));
    const selected = all.filter((a) => activeAccountIds.includes(a.id));
    if (selected.length === 0) return '—';
    if (selected.length === 1) {
      const s = selected[0];
      return `${displayName(s.platform)} · ${displayName(s.name)}`;
    }
    return `${selected.length} ${t('shell.accountsSelected')}`;
  })();

  return (
    <header className={styles.topbar}>
      {/* Left: wordmark + account switcher */}
      <div className={styles.left}>
        <div className={styles.wordmark}>Chi.TradeLog</div>
        <AccountSwitcher label={accountLabel} displayName={displayName} onToggleAccount={toggleAccount} />
      </div>

      {/* Center: nav pills */}
      <nav className={styles.nav}>
        {NAV_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`${styles.navItem} ${key === tab ? styles.navActive : ''}`}
            onClick={() => setTab(key)}
          >
            {t(`nav.${key}`)}
          </button>
        ))}
      </nav>

      {/* Right: reminder, lang, theme, user */}
      <div className={styles.right}>
        <JournalReminder />
        <button type="button" className={styles.langBtn} onClick={toggleLang}>
          {t('shell.langToggle')}
        </button>
        <button type="button" className={styles.iconBtn} onClick={toggleTheme} aria-label="Toggle theme">
          <Icon name={theme === 'light' ? 'sun' : 'moon'} size={theme === 'light' ? 16 : 15} />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}

/** 日記提醒：今天有交易但還沒寫日記時顯示鈴鐺與數量，點擊直接開啟第一筆缺日記的交易。 */
function JournalReminder() {
  const { t } = useTranslation();
  const activeAccountIds = useUiStore((s) => s.activeAccountIds);
  const openJournalPage = useUiStore((s) => s.openJournalPage);
  const { data: trades = [] } = useTrades(activeAccountIds);
  const { data } = useJournalReminder(trades);
  const missing = data?.missingCount ?? 0;

  if (missing === 0) return null;

  return (
    <button
      type="button"
      className={styles.reminderBtn}
      title={t('journal.reminder', { count: missing })}
      aria-label={t('journal.reminder', { count: missing })}
      onClick={() => {
        const first = data?.missingTrades[0];
        if (first) openJournalPage(first);
      }}
    >
      <Icon name="bell" size={15} />
      <span className={styles.reminderDot}>{missing}</span>
    </button>
  );
}

function AccountSwitcher({
  label,
  displayName,
  onToggleAccount,
}: {
  label: string;
  displayName: (name: string) => string;
  onToggleAccount: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const platforms = useUiStore((s) => s.platforms);
  const activeAccountIds = useUiStore((s) => s.activeAccountIds);
  const setTab = useUiStore((s) => s.setTab);
  const ref = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className={styles.dropdownRoot} ref={ref} data-dropdown-root="true">
      <button type="button" className={styles.switcher} onClick={() => setOpen((o) => !o)}>
        <span className={styles.switcherLabel}>{label}</span>
        <Icon name="chevronDown" size={11} />
      </button>
      {open && (
        <div className={`${styles.menu} ${styles.switcherMenu}`}>
          {platforms.map((p) => (
            <div key={p.id}>
              <div className={styles.menuGroupLabel}>{displayName(p.name)}</div>
              {p.accounts.map((a) => {
                const checked = activeAccountIds.includes(a.id);
                return (
                  <button key={a.id} type="button" className={styles.menuRow} onClick={() => onToggleAccount(a.id)}>
                    <span className={`${styles.checkbox} ${checked ? styles.checkboxOn : ''}`}>
                      {checked && <Icon name="check" size={11} />}
                    </span>
                    {displayName(a.name)}
                  </button>
                );
              })}
            </div>
          ))}
          <button
            type="button"
            className={styles.menuLink}
            onClick={() => {
              setTab('settings');
              setOpen(false);
            }}
          >
            {t('shell.managePlatforms')}
          </button>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));
  const setTab = useUiStore((s) => s.setTab);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const userName = user?.name ?? 'Trader';
  const userEmail = user?.email ?? '';
  const initials = userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={styles.dropdownRoot} ref={ref} data-dropdown-root="true">
      <button type="button" className={styles.avatar} onClick={() => setOpen((o) => !o)}>
        {initials}
      </button>
      {open && (
        <div className={`${styles.menu} ${styles.userMenu}`}>
          <div className={styles.userHeader}>
            <div className={styles.avatarLg}>{initials}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{userName}</div>
              <div className={styles.userEmail}>{userEmail}</div>
            </div>
          </div>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              setTab('settings');
              setOpen(false);
            }}
          >
            {t('shell.accountSettings')}
          </button>
          <button type="button" className={styles.menuItem} onClick={logout}>{t('shell.logOut')}</button>
        </div>
      )}
    </div>
  );
}
