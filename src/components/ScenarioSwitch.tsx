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
    <div className="modes" role="group" aria-label={t.scenario}>
      {RANGE_MODES.map((scenario) => {
        const active = scenario.id === selectedScenario;
        return (
          <button
            key={scenario.id}
            type="button"
            disabled={loading && active}
            aria-pressed={active}
            className="mode-btn"
            onClick={() => onChange(scenario.id)}
          >
            {scenario.label}
          </button>
        );
      })}
    </div>
  );
}
