import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon/Icon';
import { ChipEditor } from '@/components/ChipEditor/ChipEditor';
import { useUiStore, NAME_TRANSLATIONS } from '@/store/uiStore';
import { useSettingsController } from '@/features/settings/useSettingsController';
import { toMetricsLang } from '@/i18n';
import styles from './Settings.module.css';

export function Settings() {
  const { t, i18n } = useTranslation();
  const isZh = toMetricsLang(i18n.language) === 'zh';
  const initialCapital = useUiStore((s) => s.initialCapital);
  const platforms = useUiStore((s) => s.platforms);
  const symbolsList = useUiStore((s) => s.symbolsList);
  const tagsList = useUiStore((s) => s.tagsList);
  const controller = useSettingsController();

  const displayName = (name: string) => (isZh ? (NAME_TRANSLATIONS[name] ?? name) : name);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('settings.title')}</h1>
        <div className={styles.subtitle}>{t('settings.subtitle')}</div>
      </div>

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
      <Section title={t('settings.platformsTitle')} subtitle={t('settings.platformsSubtitle')}>
        <div className={styles.platforms}>
          {platforms.map((platform) => (
            <div key={platform.id} className={styles.platform}>
              <div className={styles.platformHeader}>
                <span className={styles.platformName}>{displayName(platform.name)}</span>
                <button
                  type="button"
                  className={styles.iconRemove}
                  onClick={() => controller.removePlatform(platform.id)}
                  aria-label="Remove platform"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
              <div className={styles.accountChips}>
                {platform.accounts.length === 0 && <span className={styles.empty}>{t('settings.noAccount')}</span>}
                {platform.accounts.map((account) => (
                  <span key={account.id} className={styles.accountChip}>
                    {displayName(account.name)}
                    <button
                      type="button"
                      className={styles.chipRemove}
                      onClick={() => controller.removeAccount(account.id)}
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
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{title}</div>
        <div className={styles.cardSubtitle}>{subtitle}</div>
      </div>
      {children}
    </div>
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
