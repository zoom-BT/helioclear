import type { Lang } from "@/lib/i18n";
import { copy } from "@/lib/i18n";
import type { Observation } from "@/lib/types";

function KpSpark({ now, h24, h72 }: { now: number; h24: number; h72: number }) {
  const pts = [now, h24, h72];
  const max = 9;
  const w = 72;
  const h = 18;
  const d = pts
    .map((value, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - 2 - (Math.min(Math.max(value, 0), max) / max) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="kp-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline
        points={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TickScale({ value, max = 9 }: { value: number; max?: number }) {
  const n = 16;
  const filled = Math.round((Math.min(Math.max(value, 0), max) / max) * n);
  return (
    <span className="ticks" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={i < filled ? "on" : undefined} />
      ))}
    </span>
  );
}

export default function InstrumentStrip({
  lang,
  observation,
}: {
  lang: Lang;
  observation: Observation;
}) {
  const t = copy[lang];
  const bz = observation.bzGsm;
  const bzLabel = `${bz >= 0 ? "+" : ""}${bz.toFixed(1)} nT`;
  return (
    <section className="rail rail-inst" aria-label="Range instruments">
      <div className="instrument">
        <span className="instrument-k">{t.kpNow}</span>
        <span className="instrument-v">{observation.kpNow.toFixed(2)}</span>
        <TickScale value={observation.kpNow} />
        <KpSpark now={observation.kpNow} h24={observation.kp24h} h72={observation.kp72h} />
      </div>
      <div className="instrument">
        <span className="instrument-k">{t.flare}</span>
        <span className="instrument-v">{observation.flareClass}</span>
      </div>
      <div className="instrument">
        <span className="instrument-k">{t.bz}</span>
        <span className="instrument-v">{bzLabel}</span>
      </div>
    </section>
  );
}
