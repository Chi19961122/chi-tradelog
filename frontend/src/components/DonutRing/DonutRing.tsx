interface Props {
  /** 綠色佔比 0–1 */
  fraction: number;
  size?: number;
}

/**
 * 綠/紅雙弧環（中間留小缺口），顯示勝率或賺賠比。
 * 對應原型 ringArcs 邏輯。
 */
export function DonutRing({ fraction, size = 44 }: Props) {
  const ringR = 16;
  const ringCirc = 2 * Math.PI * ringR;
  const ringGap = ringCirc * 0.035;
  const f = Math.max(0.02, Math.min(0.98, fraction));
  const greenLen = Math.max(0, ringCirc * f - ringGap / 2);
  const redLen = Math.max(0, ringCirc * (1 - f) - ringGap / 2);

  const cx = 22;
  const cy = 22;

  return (
    <svg width={size} height={size} viewBox="0 0 44 44">
      {/* 綠弧從頂端順時針 */}
      <circle
        cx={cx}
        cy={cy}
        r={ringR}
        fill="none"
        stroke="var(--green)"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${greenLen.toFixed(1)} ${(ringCirc - greenLen).toFixed(1)}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* 紅弧接續 */}
      <circle
        cx={cx}
        cy={cy}
        r={ringR}
        fill="none"
        stroke="var(--red)"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${redLen.toFixed(1)} ${(ringCirc - redLen).toFixed(1)}`}
        strokeDashoffset={(-(greenLen + ringGap)).toFixed(1)}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  );
}
