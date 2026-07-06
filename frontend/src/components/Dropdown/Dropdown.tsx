import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon/Icon';
import { useOutsideClick } from '@/lib/useOutsideClick';
import styles from './Dropdown.module.css';

interface Props {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * 自訂下拉選單。觸發鈕含 chevron，點外部關閉；
 * 支援鍵盤操作（↑↓ 移動、Enter 選取、Esc 關閉）。對應 DESIGN_GUIDELINES 第 5 節。
 */
export function Dropdown({ options, value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const ref = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));

  // 開啟時把 highlight 對齊目前選取值。
  useEffect(() => {
    if (open) setHighlight(Math.max(0, options.indexOf(value)));
  }, [open, options, value]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (open === false) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(options.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight >= 0 && highlight < options.length) {
        onChange(options[highlight]);
        setOpen(false);
      }
    }
  };

  return (
    <div className={styles.root} ref={ref} data-dropdown-root="true">
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? styles.value : styles.placeholder}>{value || placeholder}</span>
        <Icon name="chevronDown" size={12} />
      </button>
      {open && (
        <div className={styles.menu} role="listbox">
          {options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === value}
              className={`${styles.option} ${opt === value ? styles.optionActive : ''} ${i === highlight ? styles.optionHighlight : ''}`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
