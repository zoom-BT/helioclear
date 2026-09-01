"use client";

import type { Lang } from "@/lib/i18n";
import { copy } from "@/lib/i18n";
import type { ScenarioId } from "@/lib/types";

const RANGE_MODES: { id: ScenarioId; label: string }[] = [
  { id: "quiet", label: "quiet" },
  { id: "equatorial", label: "equatorial" },
  { id: "storm", label: "storm" },
  { id: "xflare", label: "xflare" },
  { id: "live", label: "live" },
];

export default function ScenarioSwitch({
  lang,
  selectedScenario,
  onChange,
}: {
  lang: Lang;
  selectedScenario: ScenarioId;
  loading?: boolean;
  onChange: (next: ScenarioId) => void;
}) {
  const t = copy[lang];
  return (
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2" role="group" aria-label={t.scenario}>
      {RANGE_MODES.map((scenario) => (
        <button
          key={scenario.id}
          type="button"
          aria-pressed={scenario.id === selectedScenario}
          onClick={() => onChange(scenario.id)}
          className="text-btn text-[11px] text-[color:var(--paper-faint)]"
        >
          {scenario.label}
        </button>
      ))}
    </div>
  );
}
