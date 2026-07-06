import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Icon } from '@/components/Icon/Icon';
import styles from './Modal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

/**
 * 彈窗（Modal）。遮罩點擊 / Esc 關閉；開啟時將焦點鎖在面板內（focus trap），
 * 關閉後把焦點還給開啟前的元素。對應 DESIGN_GUIDELINES 第 5 節。
 */
export function Modal({ open, onClose, title, subtitle, children, footer, width = 460 }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const focusables = () =>
      [...(panel?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
      ) ?? [])];

    // 開啟時聚焦面板內第一個可聚焦元素（找不到則聚焦面板本身）。
    (focusables()[0] ?? panel)?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      // Tab 循環：把焦點鎖在面板內。
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (e.shiftKey === false && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        style={{ width }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{title}</div>
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
