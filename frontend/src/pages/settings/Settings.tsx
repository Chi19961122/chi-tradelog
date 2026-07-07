import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon/Icon';
import { ChipEditor } from '@/components/ChipEditor/ChipEditor';
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog';
import { useUiStore, NAME_TRANSLATIONS } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsController } from '@/features/settings/useSettingsController';
import { useDisciplineRules, useDisciplineRulesMutation } from '@/features/settings/useDisciplineRules';
import { useTrades } from '@/features/trades/useTrades';
import { API_BASE_URL } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';
import { downloadTextFile } from '@/lib/csv';
import { mockJournalStore } from '@/lib/mockJournalStore';
import { todayISO } from '@/lib/today';
import { toMetricsLang } from '@/i18n';
import { ChangePasswordSection, ProfileSection, UserManagementSection } from './AccountSecuritySections';
import styles from './Settings.module.css';

export function Settings() {
  const { t, i18n } = useTranslation();
  const isZh = toMetricsLang(i18n.language) === 'zh';
  const initialCapital = useUiStore((s) => s.initialCapital);
  const platforms = useUiStore((s) => s.platforms);
  const symbolsList = useUiStore((s) => s.symbolsList);
  const tagsList = useUiStore((s) => s.tagsList);
  const user = useAuthStore((s) => s.user);
  const controller = useSettingsController();
  // 待確認的刪除目標（平台或帳戶）。
  const [confirming, setConfirming] = useState<{ kind: 'platform' | 'account'; id: string; name: string } | null>(null);

  const displayName = (name: string) => (isZh ? (NAME_TRANSLATIONS[name] ?? name) : name);

  const runConfirmedDelete = () => {
    if (!confirming) return;
    if (confirming.kind === 'platform') controller.removePlatform(confirming.id);
    else controller.removeAccount(confirming.id);
    setConfirming(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('settings.title')}</h1>
        <div className={styles.subtitle}>{t('settings.subtitle')}</div>
      </div>

      {/* 個人檔案（mock/API 皆可用）＋ 密碼（僅 API） */}
      <ProfileSection />
      {API_BASE_URL && <ChangePasswordSection />}

      {/* Account */}
      <Section title={t('settings.accountTitle')} subtitle={t('settings.accountSubtitle')}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('settings.initialCapital')}</span>
          <div className={styles.capitalWrap}>
            <span className={styles.dollar}>$</span>
            <input
              className={styles.capitalInput}
              type="number"
              min={0}
              value={initialCapital}
              onChange={(e) => controller.setCapital(Number(e.target.value) || 0)}
            />
          </div>
        </label>
      </Section>

      {/* Platforms & Accounts */}
      <Section wide title={t('settings.platformsTitle')} subtitle={t('settings.platformsSubtitle')}>
        <div className={styles.platforms}>
          {platforms.map((platform) => (
            <div key={platform.id} className={styles.platform}>
              <div className={styles.platformHeader}>
                <EditableName
                  className={styles.platformName}
                  display={displayName(platform.name)}
                  value={platform.name}
                  onRename={(name) => controller.renamePlatform(platform.id, name)}
                />
                <button
                  type="button"
                  className={styles.iconRemove}
                  onClick={() => setConfirming({ kind: 'platform', id: platform.id, name: displayName(platform.name) })}
                  aria-label="Remove platform"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
              <div className={styles.accountChips}>
                {platform.accounts.length === 0 && <span className={styles.empty}>{t('settings.noAccount')}</span>}
                {platform.accounts.map((account) => (
                  <span key={account.id} className={styles.accountChip}>
                    <EditableName
                      display={displayName(account.name)}
                      value={account.name}
                      onRename={(name) => controller.renameAccount(account.id, name)}
                    />
                    <button
                      type="button"
                      className={styles.chipRemove}
                      onClick={() => setConfirming({ kind: 'account', id: account.id, name: displayName(account.name) })}
                      aria-label={`Remove ${account.name}`}
                    >
                      <Icon name="close" size={11} />
                    </button>
                  </span>
                ))}
                <AddInput
                  placeholder={t('settings.addAccount')}
                  onAdd={(name) => void controller.addAccount(platform.id, name)}
                  dashed
                />
              </div>
            </div>
          ))}
        </div>
        <AddInput placeholder={t('settings.addPlatform')} onAdd={(name) => void controller.addPlatform(name)} />
      </Section>

      {/* 紀律規則 */}
      <DisciplineSection />

      {/* 全資料匯出 */}
      <DataExportSection />

      {/* Symbols */}
      <Section title={t('settings.symbolsTitle')} subtitle={t('settings.symbolsSubtitle')}>
        <ChipEditor
          items={symbolsList}
          onAdd={(s) => controller.addSymbol(s)}
          onRemove={(s) => controller.removeSymbol(s)}
          placeholder={t('settings.addSymbol')}
        />
      </Section>

      {/* Tags */}
      <Section title={t('settings.tagsTitle')} subtitle={t('settings.tagsSubtitle')}>
        <ChipEditor
          items={tagsList}
          onAdd={(tag) => controller.addTag(tag)}
          onRemove={(tag) => controller.removeTag(tag)}
          placeholder={t('settings.addTag')}
        />
      </Section>

      {/* 使用者管理（僅 API 模式的管理員） */}
      {API_BASE_URL && user?.isAdmin && (
        <div className={styles.wide}>
          <UserManagementSection />
        </div>
      )}

      <ConfirmDialog
        open={confirming !== null}
        title={confirming?.kind === 'platform' ? t('settings.deletePlatformTitle') : t('settings.deleteAccountTitle')}
        message={t(
          confirming?.kind === 'platform' ? 'settings.deletePlatformConfirm' : 'settings.deleteAccountConfirm',
          { name: confirming?.name ?? '' },
        )}
        confirmLabel={t('common.delete')}
        onConfirm={runConfirmedDelete}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}

/** 紀律規則設定卡：單日最大筆數與報復性交易間隔（留空 = 停用）。 */
function DisciplineSection() {
  const { t } = useTranslation();
  const { data: rules } = useDisciplineRules();
  const mutation = useDisciplineRulesMutation();
  const [maxTrades, setMaxTrades] = useState('');
  const [revengeMin, setRevengeMin] = useState('');
  const [saved, setSaved] = useState(false);

  // 讀到已儲存規則時帶入表單。
  useEffect(() => {
    if (!rules) return;
    setMaxTrades(rules.maxTradesPerDay !== null ? String(rules.maxTradesPerDay) : '');
    setRevengeMin(rules.revengeMinutes !== null ? String(rules.revengeMinutes) : '');
  }, [rules]);

  const handleSave = () => {
    const maxTradesPerDay = maxTrades !== '' && Number(maxTrades) > 0 ? Math.floor(Number(maxTrades)) : null;
    const revengeMinutes = revengeMin !== '' && Number(revengeMin) > 0 ? Math.floor(Number(revengeMin)) : null;
    mutation.mutate(
      { maxTradesPerDay, revengeMinutes },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      },
    );
  };

  return (
    <Section title={t('settings.disciplineTitle')} subtitle={t('settings.disciplineSubtitle')}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t('settings.maxTradesPerDay')}</span>
        <input
          className={styles.ruleInput}
          type="number"
          min={1}
          value={maxTrades}
          placeholder={t('settings.ruleDisabled')}
          onChange={(e) => setMaxTrades(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t('settings.revengeMinutes')}</span>
        <input
          className={styles.ruleInput}
          type="number"
          min={1}
          value={revengeMin}
          placeholder={t('settings.ruleDisabled')}
          onChange={(e) => setRevengeMin(e.target.value)}
        />
      </label>
      <div className={styles.ruleActions}>
        <button type="button" className={styles.ruleSaveBtn} onClick={handleSave} disabled={mutation.isPending}>
          {t('settings.saveRules')}
        </button>
        {saved && <span className={styles.ruleSaved}>{t('settings.rulesSaved')}</span>}
      </div>
    </Section>
  );
}

/** 全資料匯出卡：下載本人全部資料 JSON（API 模式打 /api/export；mock 模式彙整本地狀態）。 */
function DataExportSection() {
  const { t } = useTranslation();
  const platforms = useUiStore((s) => s.platforms);
  const initialCapital = useUiStore((s) => s.initialCapital);
  const symbolsList = useUiStore((s) => s.symbolsList);
  const tagsList = useUiStore((s) => s.tagsList);
  const allAccountIds = platforms.flatMap((p) => p.accounts.map((a) => a.id));
  const { data: trades = [] } = useTrades(allAccountIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    setError(false);
    try {
      let payload: unknown;
      if (API_BASE_URL) {
        const res = await apiFetch('/api/export');
        if (res.ok === false) throw new Error(`匯出失敗：${res.status}`);
        payload = await res.json();
      } else {
        payload = {
          exportedAt: new Date().toISOString(),
          settings: { initialCapital, platforms, symbols: symbolsList, tags: tagsList },
          trades,
          journals: mockJournalStore.entries(),
        };
      }
      downloadTextFile(`chi-tradelog-export-${todayISO()}.json`, JSON.stringify(payload, null, 2));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title={t('settings.exportTitle')} subtitle={t('settings.exportSubtitle')}>
      <div className={styles.ruleActions}>
        <button type="button" className={styles.ruleSaveBtn} onClick={() => void handleExport()} disabled={busy}>
          {busy ? t('settings.exporting') : t('settings.exportBtn')}
        </button>
        {error && <span className={styles.exportError}>{t('settings.exportError')}</span>}
      </div>
    </Section>
  );
}

function Section({
  title,
  subtitle,
  wide,
  children,
}: {
  title: string;
  subtitle: string;
  /** 於雙欄網格中跨滿整列。 */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.card} ${wide ? styles.wide : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{title}</div>
        <div className={styles.cardSubtitle}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

/** 可雙擊改名的名稱：雙擊進入編輯，Enter/失焦提交，Esc 取消。 */
function EditableName({
  display,
  value,
  onRename,
  className,
}: {
  /** 顯示文字（可能是翻譯後名稱）。 */
  display: string;
  /** 實際名稱（編輯時帶入）。 */
  value: string;
  onRename: (name: string) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);

  if (!editing) {
    return (
      <span
        className={className}
        style={{ cursor: 'text' }}
        title={t('settings.renameHint')}
        onDoubleClick={() => {
          setText(value);
          setEditing(true);
        }}
      >
        {display}
      </span>
    );
  }

  const commit = () => {
    setEditing(false);
    const clean = text.trim();
    if (clean && clean !== value) onRename(clean);
  };

  return (
    <input
      className={styles.renameInput}
      value={text}
      autoFocus
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }}
    />
  );
}

function AddInput({
  placeholder,
  onAdd,
  dashed,
}: {
  placeholder: string;
  onAdd: (value: string) => void;
  dashed?: boolean;
}) {
  const [text, setText] = useState('');
  const submit = () => {
    const value = text.trim();
    if (value) {
      onAdd(value);
      setText('');
    }
  };
  return (
    <input
      className={dashed ? styles.addInputDashed : styles.addInput}
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') submit();
      }}
      onBlur={submit}
    />
  );
}
