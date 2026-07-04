import type { CSSProperties, ReactNode } from 'react';
import styles from './Card.module.css';

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** 卡片：card 底 + 1px line + 圓角。對應 DESIGN_GUIDELINES 第 4/5 節。 */
export function Card({ children, className, style }: Props) {
  return (
    <div className={`${styles.card} ${className ?? ''}`} style={style}>
      {children}
    </div>
  );
}
