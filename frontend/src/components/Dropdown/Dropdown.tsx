import { useState } from 'react';
import { Icon } from '@/components/Icon/Icon';
import { useOutsideClick } from '@/lib/useOutsideClick';
import styles from './Dropdown.module.css';

interface Props {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** 自訂下拉選單。觸發鈕含 chevron，點外部關閉。對應 DESIGN_GUIDELINES 第 5 節。 */
export function Dropdown({ options, value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className={styles.root} ref={ref} data-dropdown-root="true">
      <button type="button" className={styles.trigger} onClick={() => setOpen((o) => !o)}>
        <span className={value ? styles.value : styles.placeholder}>{value || placeholder}</span>
        <Icon name="chevronDown" size={12} />
      </button>
      {open && (
        <div className={styles.menu}>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`${styles.option} ${opt === value ? styles.optionActive : ''}`}
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
