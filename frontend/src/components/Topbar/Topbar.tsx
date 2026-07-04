import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon/Icon';
import { useOutsideClick } from '@/lib/useOutsideClick';
import { useUiStore, NAME_TRANSLATIONS } from '@/store/uiStore';
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

      {/* Right: lang, theme, user */}
      <div className={styles.right}>
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
          <button type="button" className={styles.menuLink}>
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
  const userName = 'Alex Chen';
  const userEmail = 'alex@chitradelog.com';
  const initials = userName.split(' ').map((w) => w[0]).join('').slice(0, 2);

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
          <button type="button" className={styles.menuItem}>{t('shell.accountSettings')}</button>
          <button type="button" className={styles.menuItem}>{t('shell.logOut')}</button>
        </div>
      )}
    </div>
  );
}
