import { isCameroonPostSunset } from "./decision";
import type { AlertHeadline, Observation } from "./types";
import fallback from "@/data/fallback.json";

export const NOAA_ENDPOINTS = {
  kp1m: "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json",
  kp: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
  forecast:
    "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json",
  flares: "https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json",
  wind: "https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json",
  mag: "https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json",
  scales: "https://services.swpc.noaa.gov/products/noaa-scales.json",
  alerts: "https://services.swpc.noaa.gov/products/alerts.json",
} as const;

const FETCH_MS = 8000;

type Json = unknown;

function num(value: unknown, fallbackValue = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallbackValue;
}

function str(value: unknown, fallbackValue = ""): string {
  return typeof value === "string" ? value : fallbackValue;
}

function asRecords(data: Json): Record<string, unknown>[] {
  if (!Array.isArray(data) || data.length === 0) return [];
  const first = data[0];
  if (Array.isArray(first)) {
    const headers = (first as unknown[]).map((h) => String(h));
    return data.slice(1).map((row) => {
      const rec: Record<string, unknown> = {};
      if (!Array.isArray(row)) return rec;
      headers.forEach((header, i) => {
        rec[header] = row[i];
      });
      return rec;
    });
  }
  if (first && typeof first === "object") {
    return data as Record<string, unknown>[];
  }
  return [];
}

async function fetchJson(url: string): Promise<Json> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return (await res.json()) as Json;
  } finally {
    clearTimeout(timer);
  }
}

function latestKp(records: Record<string, unknown>[]): {
  kp: number;
  timeTag: string;
} {
  const last = records[records.length - 1] ?? {};
  const kp = num(last.estimated_kp ?? last.kp_index ?? last.Kp ?? last.kp);
  const timeTag = str(last.time_tag, new Date().toISOString());
  return { kp, timeTag };
}

function maxKpSince(
  records: Record<string, unknown>[],
  hours: number,
  now = Date.now(),
): number {
  const cutoff = now - hours * 3600_000;
  let max = 0;
  for (const row of records) {
    const t = Date.parse(str(row.time_tag));
    if (!Number.isFinite(t) || t < cutoff) continue;
    max = Math.max(max, num(row.estimated_kp ?? row.kp_index ?? row.Kp ?? row.kp));
  }
  return max;
}

function maxForecastKp(records: Record<string, unknown>[], hours: number): number {
  const now = Date.now();
  const until = now + hours * 3600_000;
  let max = 0;
  for (const row of records) {
    const t = Date.parse(str(row.time_tag));
    if (!Number.isFinite(t) || t < now || t > until) continue;
    max = Math.max(max, num(row.kp ?? row.Kp));
  }
  return max;
}

function parseFlare(data: Json): string {
  const records = asRecords(data);
  const last = records[records.length - 1] ?? {};
  return (
    str(last.current_class) ||
    str(last.max_class) ||
    str(last.end_class) ||
    "A0.0"
  );
}

function parseWind(data: Json): number {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const rec = data as Record<string, unknown>;
    return num(rec.proton_speed ?? rec.WindSpeed ?? rec.speed);
  }
  const records = asRecords(data);
  const last = records[records.length - 1] ?? {};
  return num(last.proton_speed ?? last.WindSpeed ?? last.speed);
}

function parseBz(data: Json): number {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const rec = data as Record<string, unknown>;
    return num(rec.bz_gsm ?? rec.Bz ?? rec.bz);
  }
  const records = asRecords(data);
  const last = records[records.length - 1] ?? {};
  return num(last.bz_gsm ?? last.Bz ?? last.bz);
}

function parseScale(entry: unknown, key: "R" | "S" | "G"): number {
  if (!entry || typeof entry !== "object") return 0;
  const scale = (entry as Record<string, unknown>)[key];
  if (!scale || typeof scale !== "object") return 0;
  return num((scale as Record<string, unknown>).Scale);
}

function parseAlerts(data: Json): AlertHeadline[] {
  const records = asRecords(data);
  return records.slice(0, 6).map((row) => {
    const message = str(row.message);
    const line =
      message
        .split(/\r?\n/)
        .map((part) => part.trim())
        .find((part) => /^(ALERT|WATCH|WARNING|SUMMARY):/i.test(part)) ??
      message.slice(0, 140);
    return {
      productId: str(row.product_id, "ALERT"),
      issuedAt: str(row.issue_datetime),
      headline: line.replace(/\s+/g, " ").trim(),
    };
  });
}

export const CACHED_FALLBACK: Observation = fallback as Observation;

export async function fetchLiveObservation(): Promise<{
  observation: Observation;
  usingFallback: boolean;
}> {
  const keys = Object.keys(NOAA_ENDPOINTS) as (keyof typeof NOAA_ENDPOINTS)[];
  const results = await Promise.allSettled(
    keys.map((key) => fetchJson(NOAA_ENDPOINTS[key])),
  );

  const bag: Partial<Record<keyof typeof NOAA_ENDPOINTS, Json>> = {};
  let failures = 0;
  results.forEach((result, i) => {
    const key = keys[i];
    if (result.status === "fulfilled") {
      bag[key] = result.value;
    } else {
      failures += 1;
    }
  });

  const essentialMissing = !bag.kp1m && !bag.kp;
  if (essentialMissing || failures >= 6) {
    return { observation: CACHED_FALLBACK, usingFallback: true };
  }

  try {
    const kp1m = asRecords(bag.kp1m);
    const kpHist = asRecords(bag.kp);
    const forecast = asRecords(bag.forecast);
    const nowKp = kp1m.length ? latestKp(kp1m) : latestKp(kpHist);
    const kp24h = Math.max(
      nowKp.kp,
      maxKpSince(kp1m, 24),
      maxKpSince(kpHist, 24),
    );
    const kp72h = Math.max(kp24h, maxForecastKp(forecast, 72));
    const scales = (bag.scales ?? {}) as Record<string, unknown>;
    const observation: Observation = {
      kpNow: nowKp.kp,
      kp24h,
      kp72h,
      flareClass: bag.flares ? parseFlare(bag.flares) : CACHED_FALLBACK.flareClass,
      solarWindSpeed: bag.wind ? parseWind(bag.wind) : CACHED_FALLBACK.solarWindSpeed,
      bzGsm: bag.mag ? parseBz(bag.mag) : CACHED_FALLBACK.bzGsm,
      rScale: parseScale(scales["0"], "R"),
      sScale: parseScale(scales["0"], "S"),
      gScale: parseScale(scales["0"], "G"),
      equatorialBias: isCameroonPostSunset(),
      timeTag: nowKp.timeTag,
      alerts: bag.alerts ? parseAlerts(bag.alerts) : [],
    };
    return { observation, usingFallback: failures > 0 };
  } catch {
    return { observation: CACHED_FALLBACK, usingFallback: true };
  }
}
