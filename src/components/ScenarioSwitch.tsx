"use client";

import { SCENARIOS } from "@/lib/decision";
import type { Lang } from "@/lib/i18n";
import { copy } from "@/lib/i18n";
import type { ScenarioId } from "@/lib/types";

export default function ScenarioSwitch({
  lang,
  selectedScenario,
  loading,
  onChange,
}: {
  lang: Lang;
  selectedScenario: ScenarioId;
  loading: boolean;
  onChange: (next: ScenarioId) => void;
}) {
  const t = copy[lang];
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
        {t.scenario}
      </legend>
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((scenario) => {
          const active = scenario.id === selectedScenario;
          return (
            <button
              key={scenario.id}
              type="button"
              disabled={loading && active}
              aria-pressed={active}
              onClick={() => onChange(scenario.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-amber-300 bg-amber-300 text-slate-950"
                  : "border-white/15 bg-white/5 text-slate-100 hover:border-amber-200/50"
              }`}
            >
              {scenario.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
