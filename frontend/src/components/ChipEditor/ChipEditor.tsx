import { useState } from 'react';
import { Icon } from '@/components/Icon/Icon';
import styles from './ChipEditor.module.css';

interface Props {
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder: string;
}

/** 可增刪的膠囊標籤清單（含 dashed 新增輸入框，Enter 送出）。對應 DESIGN_GUIDELINES 第 5 節。 */
export function ChipEditor({ items, onAdd, onRemove, placeholder }: Props) {
  const [text, setText] = useState('');

  const submit = () => {
    const value = text.trim();
    if (value) {
      onAdd(value);
      setText('');
    }
  };

  return (
    <div className={styles.wrap}>
      {items.map((item) => (
        <span key={item} className={styles.chip}>
          {item}
          <button type="button" className={styles.remove} onClick={() => onRemove(item)} aria-label={`Remove ${item}`}>
            <Icon name="close" size={12} />
          </button>
        </span>
      ))}
      <input
        className={styles.input}
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        onBlur={submit}
      />
    </div>
  );
}
