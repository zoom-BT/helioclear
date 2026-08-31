"use client";

import type { Lang } from "@/lib/i18n";
import { copy } from "@/lib/i18n";
import type { Call, MissionDecision } from "@/lib/types";

const CALL_STYLES: Record<Call, string> = {
  GO: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  CONDITIONAL: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  "NO-GO": "border-rose-400/40 bg-rose-400/10 text-rose-300",
};

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
  const t = copy[lang];
  return (
    <section className={`rounded-2xl border p-5 shadow-[0_0_40px_rgba(0,0,0,0.25)] ${CALL_STYLES[decision.call]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{title}</p>
      {hint ? <p className="mt-1 text-xs opacity-70">{hint}</p> : null}
      <p className="mt-4 font-[family-name:var(--font-mono)] text-5xl font-semibold tracking-tight">
        {decision.call}
      </p>
      <p className="mt-3 text-sm opacity-80">
        {t.score} {decision.score}
      </p>
      {decision.overrides.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm">
          {decision.overrides.map((item) => (
            <li key={item}>
              {t.override}: {item}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
