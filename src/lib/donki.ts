import type { DonkiItem } from "./types";

const DONKI_MS = 3000;

export async function fetchDonki(): Promise<{
  items: DonkiItem[];
  status: "ok" | "skipped" | "error";
}> {
  const key = process.env.NASA_API_KEY || "DEMO_KEY";
  const url = `https://api.nasa.gov/DONKI/notifications?type=all&api_key=${encodeURIComponent(key)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DONKI_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) return { items: [], status: "error" };
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return { items: [], status: "ok" };
    const items: DonkiItem[] = data.slice(0, 4).map((row) => {
      const rec = row as Record<string, unknown>;
      const body = typeof rec.messageBody === "string" ? rec.messageBody : "";
      return {
        messageType: String(rec.messageType ?? "DONKI"),
        messageID: String(rec.messageID ?? rec.messageId ?? ""),
        messageURL: typeof rec.messageURL === "string" ? rec.messageURL : undefined,
        messageBody: body.slice(0, 280).replace(/\s+/g, " ").trim(),
      };
    });
    return { items, status: "ok" };
  } catch {
    return { items: [], status: "error" };
  } finally {
    clearTimeout(timer);
  }
}
