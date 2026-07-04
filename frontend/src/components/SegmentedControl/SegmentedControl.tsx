import styles from './SegmentedControl.module.css';

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
  size?: 'sm' | 'md';
}

/** 分頁 / 切換膠囊（Segmented）。對應 DESIGN_GUIDELINES 第 5 節。 */
export function SegmentedControl<T extends string>({ options, value, onChange, size = 'md' }: Props<T>) {
  return (
    <div className={`${styles.group} ${size === 'sm' ? styles.sm : ''}`}>
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={`${styles.item} ${value === opt.key ? styles.active : ''}`}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
