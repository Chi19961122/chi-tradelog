import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon/Icon';
import { useJournal } from '@/features/journal/useJournal';
import { useJournalMutation } from '@/features/journal/useJournalMutation';
import {
  defaultJournalEntry,
  defaultTemplate,
  journalKey,
  type MistakeItem,
} from '@/lib/journal';
import { fmtMoney } from '@/lib/format';
import { currentMonthIdx, currentYear } from '@/lib/today';
import { toMetricsLang } from '@/i18n';
import type { Trade } from '@/types/trade';
import styles from './JournalEditor.module.css';

// 「Set Template」設定的範本，於 session 內跨日記共用。
let sessionTemplate: string | null = null;

interface Props {
  trade: Trade;
  /** 版面變體：modal（預設，緊湊）或 page（整頁，編輯區更高）。 */
  variant?: 'modal' | 'page';
}

/**
 * Journal 編輯器主體（交易摘要、tags、情緒、錯誤檢討、筆記）。
 * 由 JournalModal（彈窗）與 JournalPage（整頁）共用；
 * 只在編輯期間掛載，卸載時 flush 尚未寫入的變更。
 */
export function JournalEditor({ trade, variant = 'modal' }: Props) {
  const { t, i18n } = useTranslation();
  const lang = toMetricsLang(i18n.language);

  const accountId = trade.accountId;
  const symbol = trade.sym;
  const day = trade.day;
  const key = journalKey(accountId, symbol, day);

  const { data: stored, isFetched } = useJournal(accountId, symbol, day, true);
  const mutation = useJournalMutation();

  const [emotions, setEmotions] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [savedStatus, setSavedStatus] = useState<'saved' | 'editing'>('saved');
  const [fontSize, setFontSize] = useState(15);
  const [newEmotion, setNewEmotion] = useState('');
  const [newMistake, setNewMistake] = useState('');
  // contentEditable 為非受控，但把最新 HTML 鏡射到 state，儲存時一律讀 state。
  const [notes, setNotes] = useState('');

  const notesRef = useRef<HTMLDivElement>(null);
  const initedKeyRef = useRef<string | null>(null);
  const skipSaveRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false); // 有未寫入的變更

  const syncNotes = () => setNotes(notesRef.current?.innerHTML ?? '');

  // 資料就緒時，以儲存值或預設值初始化（同一次掛載內換 trade 也會重新初始化）。
  useEffect(() => {
    if (!isFetched) return;
    if (initedKeyRef.current === key) return;
    const base = stored ?? defaultJournalEntry(key, lang);
    setEmotions(base.emotions);
    setMistakes(base.mistakes);
    setNotes(base.notes);
    setSavedStatus('saved');
    skipSaveRef.current = true;
    dirtyRef.current = false;
    initedKeyRef.current = key;
    if (notesRef.current) notesRef.current.innerHTML = base.notes;
  }, [isFetched, stored, key, lang]);

  const saveEntry = () => {
    saveTimerRef.current = null;
    dirtyRef.current = false;
    mutation.mutate({ accountId, symbol, day, entry: { notes, emotions, mistakes } });
    setSavedStatus('saved');
  };

  // 讓卸載時的 flush 讀得到最新的儲存函式（含最新 state）。
  const saveRef = useRef(saveEntry);
  useEffect(() => {
    saveRef.current = saveEntry;
  });

  // 內容變更時標記 dirty 並 debounce 儲存。
  useEffect(() => {
    if (initedKeyRef.current !== key) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    dirtyRef.current = true;
    setSavedStatus('editing');
    const timer = setTimeout(saveEntry, 700);
    saveTimerRef.current = timer;
    return () => clearTimeout(timer);
    // 僅在使用者變更 emotions / mistakes / notes 時觸發。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, emotions, mistakes]);

  // 卸載（關閉彈窗／離開整頁）時：flush 尚未寫入的變更。
  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (dirtyRef.current) saveRef.current();
    },
    [],
  );

  const monthIdx = currentMonthIdx();
  const monthLabel = lang === 'zh'
    ? `${monthIdx + 1}月`
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIdx];
  const sideLabel = trade.side === 'Long' ? t('side.long') : t('side.short');

  const addEmotion = () => {
    const v = newEmotion.trim();
    if (v && emotions.includes(v) === false) {
      setEmotions([...emotions, v]);
      setNewEmotion('');
    }
  };
  const removeEmotion = (v: string) => setEmotions(emotions.filter((x) => x !== v));

  const addMistake = () => {
    const v = newMistake.trim();
    if (v) {
      setMistakes([...mistakes, { label: v, checked: false }]);
      setNewMistake('');
    }
  };
  const toggleMistake = (i: number) =>
    setMistakes(mistakes.map((m, idx) => (idx === i ? { ...m, checked: !m.checked } : m)));
  const removeMistake = (i: number) => setMistakes(mistakes.filter((_, idx) => idx !== i));

  const exec = (cmd: string) => {
    notesRef.current?.focus();
    document.execCommand(cmd);
    syncNotes();
  };

  const applyTemplate = () => {
    const tpl = sessionTemplate ?? defaultTemplate(lang);
    if (notesRef.current) notesRef.current.innerHTML = tpl;
    syncNotes();
  };
  const setTemplate = () => {
    sessionTemplate = notesRef.current?.innerHTML ?? '';
  };
  const clearNotes = () => {
    if (notesRef.current) notesRef.current.innerHTML = '';
    syncNotes();
  };

  const onNotesPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          document.execCommand('insertImage', false, String(reader.result));
          notesRef.current?.querySelectorAll('img').forEach((img) => {
            img.style.maxWidth = '100%';
            img.style.borderRadius = '8px';
            img.style.display = 'block';
            img.style.margin = '10px 0';
          });
          syncNotes();
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  return (
    <div className={variant === 'page' ? styles.pageVariant : undefined}>
      {/* Trade summary */}
      <div className={styles.summary}>
        <div>
          <div className={styles.summaryDate}>
            {monthLabel} {trade.day}, {currentYear()}
          </div>
          <div className={styles.summaryMeta}>
            {trade.sym} · {sideLabel}
          </div>
        </div>
        <div className={styles.summaryPnl} style={{ color: trade.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {fmtMoney(trade.pnl)}
        </div>
      </div>

      {/* Stat tiles */}
      <div className={styles.tiles}>
        <Tile label={t('tradelog.colEntry')} value={trade.entry.toFixed(2)} />
        <Tile label={t('tradelog.colExit')} value={trade.exit.toFixed(2)} />
        <Tile label={t('tradelog.colQty')} value={String(trade.qty)} />
        <Tile label={t('tradelog.colR')} value={`${trade.r.toFixed(1)}R`} />
      </div>

      {/* Tags (read-only) */}
      <Section label={t('journal.tags')}>
        <div className={styles.chips}>
          {trade.tags.map((tag) => (
            <span key={tag} className={styles.tagChip}>
              {tag}
            </span>
          ))}
        </div>
      </Section>

      {/* Emotions */}
      <Section label={t('journal.emotions')}>
        <div className={styles.chips}>
          {emotions.map((emo) => (
            <span key={emo} className={styles.emotionChip}>
              {emo}
              <button type="button" className={styles.chipRemove} onClick={() => removeEmotion(emo)} aria-label={`Remove ${emo}`}>
                <Icon name="close" size={11} />
              </button>
            </span>
          ))}
          <input
            className={styles.addChipInput}
            value={newEmotion}
            placeholder={t('journal.add')}
            onChange={(e) => setNewEmotion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addEmotion();
            }}
            onBlur={addEmotion}
          />
        </div>
      </Section>

      {/* Mistake Review */}
      <Section label={t('journal.mistakes')}>
        <div className={styles.mistakes}>
          {mistakes.map((m, i) => (
            <div key={i} className={styles.mistakeRow}>
              <button
                type="button"
                className={`${styles.checkbox} ${m.checked ? styles.checkboxOn : ''}`}
                onClick={() => toggleMistake(i)}
                aria-label="Toggle"
              >
                {m.checked && <Icon name="check" size={11} />}
              </button>
              <span className={styles.mistakeLabel} style={{ color: m.checked ? 'var(--ink)' : 'var(--faint)' }}>
                {m.label}
              </span>
              <button type="button" className={styles.chipRemove} onClick={() => removeMistake(i)} aria-label="Remove">
                <Icon name="close" size={11} />
              </button>
            </div>
          ))}
          <input
            className={styles.addMistakeInput}
            value={newMistake}
            placeholder={t('journal.add')}
            onChange={(e) => setNewMistake(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addMistake();
            }}
          />
        </div>
      </Section>

      {/* Notes */}
      <Section
        label={t('journal.notes')}
        right={
          <span className={styles.savedStatus} style={{ color: savedStatus === 'saved' ? 'var(--green)' : 'var(--faint)' }}>
            {savedStatus === 'saved' ? t('journal.saved') : t('journal.editing')}
          </span>
        }
      >
        <div className={styles.toolbar}>
          <button type="button" className={styles.toolBtn} onClick={applyTemplate}>{t('journal.applyTemplate')}</button>
          <button type="button" className={styles.toolBtn} onClick={setTemplate}>{t('journal.setTemplate')}</button>
          <button type="button" className={styles.toolBtn} onClick={clearNotes}>{t('journal.clear')}</button>
          <span className={styles.toolDivider} />
          <button type="button" className={styles.toolIcon} style={{ fontWeight: 800 }} onClick={() => exec('bold')}>B</button>
          <button type="button" className={styles.toolIcon} style={{ fontStyle: 'italic' }} onClick={() => exec('italic')}>I</button>
          <button type="button" className={styles.toolIcon} style={{ textDecoration: 'underline' }} onClick={() => exec('underline')}>U</button>
          <span className={styles.toolDivider} />
          <button type="button" className={styles.toolIcon} onClick={() => setFontSize((s) => Math.max(11, s - 1))}>−</button>
          <button type="button" className={styles.toolIcon} onClick={() => setFontSize((s) => Math.min(24, s + 1))}>+</button>
        </div>
        <div
          ref={notesRef}
          className={styles.editor}
          style={{ fontSize }}
          contentEditable
          suppressContentEditableWarning
          onInput={syncNotes}
          onPaste={onNotesPaste}
        />
      </Section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.tile}>
      <div className={styles.tileLabel}>{label}</div>
      <div className={styles.tileValue}>{value}</div>
    </div>
  );
}

function Section({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>{label}</span>
        {right}
      </div>
      {children}
    </div>
  );
}
