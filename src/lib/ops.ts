import { buildBriefing } from "./briefing";
import { evaluate, evaluateFixture, FIXTURES } from "./decision";
import { fetchDonki } from "./donki";
import { fetchLiveObservation } from "./noaa";
import type { OpsPayload, ScenarioId } from "./types";

const SCENARIO_IDS: ScenarioId[] = [
  "live",
  "sample",
  "quiet",
  "equatorial",
  "storm",
  "xflare",
  "radiation",
];

export function isScenarioId(value: string | null | undefined): value is ScenarioId {
  return !!value && (SCENARIO_IDS as string[]).includes(value);
}

export async function loadOps(scenario: ScenarioId = "live"): Promise<OpsPayload> {
  const fetchedAt = new Date().toISOString();

  if (scenario !== "live") {
    const observation = FIXTURES[scenario];
    const decision = evaluateFixture(scenario);
    return {
      scenario,
      source: "fixture",
      usingFallback: false,
      fetchedAt,
      observation,
      decision,
      briefing: buildBriefing(observation, decision),
      donki: [],
      donkiStatus: "skipped",
    };
  }

  const [{ observation, usingFallback }, donki] = await Promise.all([
    fetchLiveObservation(),
    fetchDonki(),
  ]);
  const decision = evaluate(observation);
  return {
    scenario: "live",
    source: usingFallback ? "fallback" : "live",
    usingFallback,
    fetchedAt,
    observation,
    decision,
    briefing: buildBriefing(observation, decision),
    donki: donki.items,
    donkiStatus: donki.status,
  };
}
