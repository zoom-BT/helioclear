export type Call = "GO" | "CONDITIONAL" | "NO-GO";

export type ScenarioId =
  | "live"
  | "sample"
  | "quiet"
  | "equatorial"
  | "storm"
  | "xflare"
  | "radiation";

export type AlertHeadline = {
  productId: string;
  issuedAt: string;
  headline: string;
};

export type Observation = {
  kpNow: number;
  kp24h: number;
  kp72h: number;
  flareClass: string;
  solarWindSpeed: number;
  bzGsm: number;
  rScale: number;
  sScale: number;
  gScale: number;
  equatorialBias: boolean;
  timeTag: string;
  alerts: AlertHeadline[];
};

export type FlareInfo = {
  letter: "A" | "B" | "C" | "M" | "X" | "?";
  magnitude: number;
  raw: string;
};

export type Contribution = {
  id: string;
  label: string;
  points: number;
  detail: string;
};

export type MissionDecision = {
  call: Call;
  score: number;
  contributions: Contribution[];
  overrides: string[];
};

export type DeskDecision = {
  launch: MissionDecision;
  gnss: MissionDecision;
};

export type DataSource = "live" | "fallback" | "fixture";

export type DonkiItem = {
  messageType: string;
  messageID: string;
  messageURL?: string;
  messageBody: string;
};

export type Briefing = {
  en: string;
  fr: string;
};

export type OpsPayload = {
  scenario: ScenarioId;
  source: DataSource;
  usingFallback: boolean;
  fetchedAt: string;
  observation: Observation;
  decision: DeskDecision;
  briefing: Briefing;
  donki: DonkiItem[];
  donkiStatus: "ok" | "skipped" | "error";
};
