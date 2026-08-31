import { CAMEROON, parseFlareClass } from "./decision";
import type { Briefing, DeskDecision, Observation } from "./types";

function joinOverrides(decision: DeskDecision): string {
  const all = [...decision.launch.overrides, ...decision.gnss.overrides];
  return Array.from(new Set(all)).join(", ");
}

export function buildBriefing(
  observation: Observation,
  decision: DeskDecision,
): Briefing {
  const flare = parseFlareClass(observation.flareClass);
  const overrides = joinOverrides(decision);
  const bias = observation.equatorialBias
    ? "post-sunset EIA bias over the Gulf of Guinea"
    : "no equatorial post-sunset scintillation bias";
  const biasFr = observation.equatorialBias
    ? "biais EIA post-coucher sur le golfe de Guinée"
    : "pas de biais de scintillation post-coucher";

  const en = [
    `HelioClear ops desk, ${CAMEROON.name}.`,
    `Launch is ${decision.launch.call} (score ${decision.launch.score}).`,
    `Equatorial GNSS/HF is ${decision.gnss.call} (score ${decision.gnss.score}).`,
    `Kp now ${observation.kpNow.toFixed(1)}, 24h ${observation.kp24h.toFixed(1)}, 72h ${observation.kp72h.toFixed(1)}.`,
    `GOES ${flare.raw}, solar wind ${Math.round(observation.solarWindSpeed)} km/s, Bz ${observation.bzGsm.toFixed(1)} nT.`,
    `NOAA scales R${observation.rScale} S${observation.sScale} G${observation.gScale}; ${bias}.`,
    overrides ? `Hard override: ${overrides}.` : "No hard radiation, G4, or X5 override.",
    "Educational prototype — not certified for flight or navigation.",
  ].join(" ");

  const fr = [
    `Pupitre HelioClear, ${CAMEROON.name}.`,
    `Lancement : ${decision.launch.call} (score ${decision.launch.score}).`,
    `GNSS/HF équatorial : ${decision.gnss.call} (score ${decision.gnss.score}).`,
    `Kp actuel ${observation.kpNow.toFixed(1)}, 24 h ${observation.kp24h.toFixed(1)}, 72 h ${observation.kp72h.toFixed(1)}.`,
    `GOES ${flare.raw}, vent solaire ${Math.round(observation.solarWindSpeed)} km/s, Bz ${observation.bzGsm.toFixed(1)} nT.`,
    `Échelles NOAA R${observation.rScale} S${observation.sScale} G${observation.gScale} ; ${biasFr}.`,
    overrides
      ? `Override dur : ${overrides}.`
      : "Pas d'override radiation, G4 ou X5.",
    "Prototype éducatif — non certifié pour le vol ou la navigation.",
  ].join(" ");

  return { en, fr };
}
