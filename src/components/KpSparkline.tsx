export default function KpSparkline({
  now,
  h24,
  h72,
}: {
  now: number;
  h24: number;
  h72: number;
}) {
  const values = [h72, h24, now];
  const w = 128;
  const h = 28;
  const padX = 4;
  const padY = 3;
  const max = 9;
  const points = values.map((value, index) => {
    const x = padX + (index * (w - padX * 2)) / (values.length - 1);
    const y = h - padY - (Math.min(max, Math.max(0, value)) / max) * (h - padY * 2);
    return { x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-7 w-32 text-[color:var(--paper-dim)]"
      role="img"
      aria-label={`Kp 72h ${h72.toFixed(1)}, 24h ${h24.toFixed(1)}, now ${now.toFixed(1)}`}
    >
      <line
        x1={padX}
        x2={w - padX}
        y1={h - padY - (5 / max) * (h - padY * 2)}
        y2={h - padY - (5 / max) * (h - padY * 2)}
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1"
      />
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        points={polyline}
      />
      {points.map((point) => (
        <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="1.7" fill="currentColor" />
      ))}
    </svg>
  );
}
