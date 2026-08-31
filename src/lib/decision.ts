import type {
  Call,
  Contribution,
  DeskDecision,
  FlareInfo,
  MissionDecision,
  Observation,
  ScenarioId,
} from "./types";

export const GO_MAX = 34;
export const CONDITIONAL_MAX = 69;

export const CAMEROON = {
  name: "Yaoundé / Gulf of Guinea",
  lat: 3.87,
  lon: 11.52,
  tzOffsetHours: 1,
};

const LAUNCH_KP_TRIGGER = 4.2;
const GNSS_KP_TRIGGER = 2.2;
const EIA_BIAS_POINTS = 18;
const POST_SUNSET_START = 18;
const POST_SUNSET_END = 2;

export function parseFlareClass(raw: string | null | undefined): FlareInfo {
  const text = (raw ?? "A0.0").toUpperCase().trim();
  const match = text.match(/([ABCMX])\s*([0-9]+(?:\.[0-9]+)?)/);
  if (!match) {
    return { letter: "?", magnitude: 0, raw: text || "unknown" };
  }
  return {
    letter: match[1] as FlareInfo["letter"],
    magnitude: Number(match[2]),
    raw: `${match[1]}${match[2]}`,
  };
}

export function isX5OrGreater(flare: FlareInfo): boolean {
  return flare.letter === "X" && flare.magnitude >= 5;
}

export function isCameroonPostSunset(now: Date = new Date()): boolean {
  const watHour = (now.getUTCHours() + CAMEROON.tzOffsetHours) % 24;
  return watHour >= POST_SUNSET_START || watHour < POST_SUNSET_END;
}

function clampScale(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value)));
}

function kpPoints(kp: number, trigger: number, slope: number): number {
  return Math.max(0, Math.round((kp - trigger) * slope));
}

function flarePoints(flare: FlareInfo): number {
  switch (flare.letter) {
    case "A":
      return 0;
    case "B":
      return 2;
    case "C":
      return Math.round(6 + flare.magnitude * 0.5);
    case "M":
      return Math.round(16 + flare.magnitude * 2);
    case "X":
      return Math.round(36 + flare.magnitude * 4);
    default:
      return 0;
  }
}

function windPoints(speed: number): number {
  return Math.max(0, Math.round((speed - 500) / 15));
}

function bzPoints(bz: number): number {
  if (bz >= -3) return 0;
  return Math.round((-bz - 3) * 2.5);
}

function band(score: number, overrides: string[]): Call {
  if (overrides.length > 0) return "NO-GO";
  if (score >= 70) return "NO-GO";
  if (score >= 35) return "CONDITIONAL";
  return "GO";
}

function hardOverrides(obs: Observation, flare: FlareInfo): string[] {
  const hits: string[] = [];
  if (obs.sScale >= 3) hits.push("S3+ radiation storm");
  if (obs.gScale >= 4) hits.push("G4+ geomagnetic storm");
  if (isX5OrGreater(flare)) hits.push("X5+ solar flare");
  return hits;
}

function push(
  list: Contribution[],
  id: string,
  label: string,
  points: number,
  detail: string,
) {
  const rounded = Math.round(points);
  if (rounded === 0) return;
  list.push({ id, label, points: rounded, detail });
}

function scoreMission(
  obs: Observation,
  kind: "launch" | "gnss",
): MissionDecision {
  const flare = parseFlareClass(obs.flareClass);
  const overrides = hardOverrides(obs, flare);
  const contributions: Contribution[] = [];
  const kpTrigger = kind === "launch" ? LAUNCH_KP_TRIGGER : GNSS_KP_TRIGGER;
  const kpSlope = kind === "launch" ? 12 : 10;

  push(
    contributions,
    "kp-now",
    "Kp now",
    kpPoints(obs.kpNow, kpTrigger, kpSlope),
    `Kp ${obs.kpNow.toFixed(2)} (trigger ${kpTrigger})`,
  );
  push(
    contributions,
    "kp-24h",
    "Kp 24h max",
    kpPoints(obs.kp24h, kpTrigger, kpSlope) * 0.85,
    `Kp 24h ${obs.kp24h.toFixed(2)}`,
  );
  push(
    contributions,
    "kp-72h",
    "Kp 72h forecast",
    kpPoints(obs.kp72h, kpTrigger, kpSlope) * 0.45,
    `Kp 72h ${obs.kp72h.toFixed(2)}`,
  );
  push(
    contributions,
    "flare",
    "GOES flare rank",
    flarePoints(flare),
    `Latest ${flare.raw}`,
  );
  push(
    contributions,
    "wind",
    "Solar wind speed",
    windPoints(obs.solarWindSpeed),
    `${Math.round(obs.solarWindSpeed)} km/s`,
  );
  push(
    contributions,
    "bz",
    "IMF Bz (GSM)",
    bzPoints(obs.bzGsm),
    `Bz ${obs.bzGsm.toFixed(1)} nT`,
  );
  push(
    contributions,
    "scale-r",
    "NOAA R (radio blackout)",
    obs.rScale * 6,
    `R${clampScale(obs.rScale)}`,
  );
  push(
    contributions,
    "scale-s",
    "NOAA S (radiation)",
    obs.sScale * 10,
    `S${clampScale(obs.sScale)}`,
  );
  push(
    contributions,
    "scale-g",
    "NOAA G (geomagnetic)",
    obs.gScale * 8,
    `G${clampScale(obs.gScale)}`,
  );

  if (kind === "gnss" && obs.equatorialBias) {
    push(
      contributions,
      "eia",
      "Equatorial EIA / post-sunset bias (Cameroon)",
      EIA_BIAS_POINTS,
      "Magnetic-equator scintillation window over the Gulf of Guinea",
    );
  }

  const score = contributions.reduce((sum, item) => sum + item.points, 0);
  return {
    call: band(score, overrides),
    score,
    contributions,
    overrides,
  };
}

export function evaluate(obs: Observation): DeskDecision {
  return {
    launch: scoreMission(obs, "launch"),
    gnss: scoreMission(obs, "gnss"),
  };
}

function fixture(
  partial: Omit<Observation, "alerts"> & { alerts?: Observation["alerts"] },
): Observation {
  return {
    alerts: partial.alerts ?? [],
    ...partial,
  };
}

export const FIXTURES: Record<Exclude<ScenarioId, "live">, Observation> = {
  sample: fixture({
    kpNow: 5.33,
    kp24h: 5.67,
    kp72h: 4.33,
    flareClass: "M1.8",
    solarWindSpeed: 560,
    bzGsm: -8.2,
    rScale: 2,
    sScale: 0,
    gScale: 2,
    equatorialBias: true,
    timeTag: "2026-08-31T19:30:00Z",
  }),
  quiet: fixture({
    kpNow: 1.0,
    kp24h: 1.33,
    kp72h: 2.0,
    flareClass: "B3.2",
    solarWindSpeed: 340,
    bzGsm: 1.5,
    rScale: 0,
    sScale: 0,
    gScale: 0,
    equatorialBias: false,
    timeTag: "2026-08-31T10:00:00Z",
  }),
  equatorial: fixture({
    kpNow: 4.0,
    kp24h: 4.33,
    kp72h: 3.67,
    flareClass: "C4.1",
    solarWindSpeed: 410,
    bzGsm: -2.5,
    rScale: 0,
    sScale: 0,
    gScale: 0,
    equatorialBias: true,
    timeTag: "2026-08-31T19:10:00Z",
  }),
  storm: fixture({
    kpNow: 8.3,
    kp24h: 8.7,
    kp72h: 7.0,
    flareClass: "M8.4",
    solarWindSpeed: 820,
    bzGsm: -22,
    rScale: 3,
    sScale: 2,
    gScale: 4,
    equatorialBias: true,
    timeTag: "2026-08-31T21:00:00Z",
    alerts: [
      {
        productId: "WATA",
        issuedAt: "2026-08-31T20:40:00Z",
        headline: "WATCH: Geomagnetic K-index of 8 or greater predicted",
      },
    ],
  }),
  xflare: fixture({
    kpNow: 2.0,
    kp24h: 2.3,
    kp72h: 2.0,
    flareClass: "X6.2",
    solarWindSpeed: 400,
    bzGsm: -1,
    rScale: 3,
    sScale: 0,
    gScale: 0,
    equatorialBias: false,
    timeTag: "2026-08-31T14:12:00Z",
    alerts: [
      {
        productId: "ALTXMF",
        issuedAt: "2026-08-31T14:10:00Z",
        headline: "ALERT: X-ray Flux exceeded M5 / X-class event in progress",
      },
    ],
  }),
  radiation: fixture({
    kpNow: 3.0,
    kp24h: 3.3,
    kp72h: 3.0,
    flareClass: "M1.0",
    solarWindSpeed: 500,
    bzGsm: -4,
    rScale: 1,
    sScale: 3,
    gScale: 1,
    equatorialBias: false,
    timeTag: "2026-08-31T16:45:00Z",
    alerts: [
      {
        productId: "ALTPX2",
        issuedAt: "2026-08-31T16:40:00Z",
        headline: "ALERT: Proton 10 MeV Integral Flux exceeded 10 pfu (S3)",
      },
    ],
  }),
};

export const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: "live", label: "Live NOAA" },
  { id: "sample", label: "Sample" },
  { id: "quiet", label: "Quiet" },
  { id: "equatorial", label: "Equatorial" },
  { id: "storm", label: "Storm" },
  { id: "xflare", label: "X-flare" },
  { id: "radiation", label: "Radiation" },
];

export function evaluateFixture(
  id: Exclude<ScenarioId, "live">,
): DeskDecision {
  return evaluate(FIXTURES[id]);
}

export function callRank(call: Call): number {
  if (call === "GO") return 0;
  if (call === "CONDITIONAL") return 1;
  return 2;
}
