import { useEffect, useRef } from 'react';

/**
 * 點擊元素外部時觸發 callback（用於關閉 dropdown / popover）。
 * 回傳的 ref 掛到彈出層的根節點。
 */
export function useOutsideClick<T extends HTMLElement>(
  active: boolean,
  onOutside: () => void,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutside();
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [active, onOutside]);

  return ref;
}
