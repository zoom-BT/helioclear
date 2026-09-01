"use client";

import type { Lang } from "@/lib/i18n";
import { copy } from "@/lib/i18n";
import type { Call, MissionDecision } from "@/lib/types";

const STAMP_CLASS: Record<Call, string> = {
  GO: "stamp-go",
  CONDITIONAL: "stamp-conditional",
  "NO-GO": "stamp-nogo",
};

function topWhy(decision: MissionDecision, lang: Lang): string {
  const t = copy[lang];
  if (decision.overrides[0]) return `${t.override}: ${decision.overrides[0]}`;
  const eia = decision.contributions.find((item) => item.id === "eia");
  if (eia) return eia.detail;
  const ranked = [...decision.contributions].sort((a, b) => b.points - a.points);
  if (ranked[0]) return `${ranked[0].label} — ${ranked[0].detail}`;
  return t.nominal;
}

export default function StatusBoard({
  lang,
  title,
  hint,
  decision,
}: {
  lang: Lang;
  title: string;
  hint?: string;
  decision: MissionDecision;
}) {
  const long = decision.call === "CONDITIONAL";
  return (
    <section className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--paper-dim)]">
        {title}
        {hint ? <span className="tracking-[0.18em]"> · {hint}</span> : null}
      </p>
      <p
        className={`mt-3 font-[family-name:var(--font-display)] italic leading-none tracking-[-0.03em] ${
          STAMP_CLASS[decision.call]
        } ${long ? "text-[clamp(2.5rem,6.6vw,6.6rem)]" : "text-[clamp(4.4rem,12vw,10.2rem)]"}`}
      >
        {decision.call}
      </p>
      <p className="mt-4 max-w-[36rem] truncate text-[11px] tracking-wide text-[color:var(--paper-dim)]">
        {topWhy(decision, lang)}
      </p>
    </section>
  );
}
