import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '@/components/SegmentedControl/SegmentedControl';
import { Icon } from '@/components/Icon/Icon';
import { useTrades } from '@/features/trades/useTrades';
import { useUiStore } from '@/store/uiStore';
import { fmtMoney } from '@/lib/format';
import { toMetricsLang } from '@/i18n';
import type { Trade } from '@/types/trade';
import { AddEditTradeModal } from './AddEditTradeModal';
import { JournalModal } from '@/pages/journal/JournalModal';
import styles from './TradeLog.module.css';

type SideFilter = 'all' | 'long' | 'short';
const PAGE_SIZES = [10, 20, 50];

export function TradeLog() {
  const { t, i18n } = useTranslation();
  const isZh = toMetricsLang(i18n.language) === 'zh';
  const activeAccountIds = useUiStore((s) => s.activeAccountIds);
  const tagsList = useUiStore((s) => s.tagsList);
  const { data: trades = [] } = useTrades(activeAccountIds);

  const [sideFilter, setSideFilter] = useState<SideFilter>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalTrade, setJournalTrade] = useState<Trade | null>(null);

  const filtered = useMemo(() => {
    return trades.filter((tr) => {
      if (sideFilter === 'long' && tr.side !== 'Long') return false;
      if (sideFilter === 'short' && tr.side !== 'Short') return false;
      if (tagFilter && tr.tags.includes(tagFilter) === false) return false;
      return true;
    });
  }, [trades, sideFilter, tagFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  const monthLabel = isZh ? '7月' : 'Jul';

  const resetPage = () => setPage(0);
  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (trade: Trade) => {
    setEditing(trade);
    setModalOpen(true);
  };
  const openJournal = (trade: Trade) => {
    setJournalTrade(trade);
    setJournalOpen(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('tradelog.title')}</h1>
          <div className={styles.subtitle}>{t('tradelog.subtitle')}</div>
        </div>
        <button type="button" className={styles.addBtn} onClick={openAdd}>
          {t('tradelog.addTrade')}
        </button>
      </div>

      <div className={styles.filters}>
        <SegmentedControl
          size="sm"
          value={sideFilter}
          onChange={(v) => {
            setSideFilter(v);
            resetPage();
          }}
          options={[
            { key: 'all', label: t('tradelog.filterAll') },
            { key: 'long', label: t('tradelog.filterLong') },
            { key: 'short', label: t('tradelog.filterShort') },
          ]}
        />
        <div className={styles.tagPills}>
          <button
            type="button"
            className={`${styles.tagPill} ${tagFilter === '' ? styles.tagPillActive : ''}`}
            onClick={() => {
              setTagFilter('');
              resetPage();
            }}
          >
            {t('tradelog.allTags')}
          </button>
          {tagsList.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`${styles.tagPill} ${tagFilter === tag ? styles.tagPillActive : ''}`}
              onClick={() => {
                setTagFilter(tag);
                resetPage();
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('tradelog.colDate')}</th>
              <th>{t('tradelog.colSymbol')}</th>
              <th>{t('tradelog.colSide')}</th>
              <th className={styles.num}>{t('tradelog.colEntry')}</th>
              <th className={styles.num}>{t('tradelog.colExit')}</th>
              <th className={styles.num}>{t('tradelog.colQty')}</th>
              <th className={styles.num}>{t('tradelog.colPnl')}</th>
              <th className={styles.num}>{t('tradelog.colR')}</th>
              <th>{t('tradelog.colTags')}</th>
              <th aria-label="edit" />
            </tr>
          </thead>
          <tbody>
            {paged.map((tr) => (
              <tr key={tr.id} className={styles.row} onClick={() => openJournal(tr)}>
                <td className={styles.mono}>
                  {monthLabel} {tr.day}
                </td>
                <td className={styles.sym}>{tr.sym}</td>
                <td>
                  <span
                    className={styles.badge}
                    style={{
                      background: tr.side === 'Long' ? 'var(--long-badge-bg)' : 'var(--short-badge-bg)',
                      color: tr.side === 'Long' ? 'var(--blue)' : 'var(--purple)',
                    }}
                  >
                    {tr.side === 'Long' ? 'L' : 'S'}
                  </span>
                </td>
                <td className={styles.mono}>{tr.entry.toFixed(2)}</td>
                <td className={styles.mono}>{tr.exit.toFixed(2)}</td>
                <td className={styles.mono}>{tr.qty}</td>
                <td className={styles.mono} style={{ color: tr.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {fmtMoney(tr.pnl)}
                </td>
                <td className={styles.mono}>{tr.r.toFixed(1)}R</td>
                <td>
                  <div className={styles.tags}>
                    {tr.tags.map((tag) => (
                      <span key={tag} className={styles.tagChip}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(tr);
                    }}
                    aria-label="Edit trade"
                  >
                    <Icon name="gear" size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && <div className={styles.empty}>{t('tradelog.empty')}</div>}
      </div>

      <div className={styles.pagination}>
        <div className={styles.showing}>
          {t('tradelog.showing')} {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, filtered.length)}{' '}
          {t('tradelog.of')} {filtered.length}
        </div>
        <div className={styles.perPage}>
          <SegmentedControl
            size="sm"
            value={String(pageSize)}
            onChange={(v) => {
              setPageSize(Number(v));
              resetPage();
            }}
            options={PAGE_SIZES.map((n) => ({ key: String(n), label: String(n) }))}
          />
          <span className={styles.perPageLabel}>{t('tradelog.perPage')}</span>
        </div>
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pagerBtn}
            disabled={clampedPage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <Icon name="chevronLeft" size={14} />
          </button>
          <button
            type="button"
            className={styles.pagerBtn}
            disabled={clampedPage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            <Icon name="chevronRight" size={14} />
          </button>
        </div>
      </div>

      <AddEditTradeModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
      <JournalModal open={journalOpen} onClose={() => setJournalOpen(false)} trade={journalTrade} />
    </div>
  );
}
