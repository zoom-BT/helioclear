export const NOAA_ORIGIN = "https://services.swpc.noaa.gov";

export const SUVI_MANIFEST = `${NOAA_ORIGIN}/products/animations/suvi-primary-171.json`;
export const SUVI_LATEST = `${NOAA_ORIGIN}/images/animations/suvi/primary/171/latest.png`;
export const SUVI_STATIC = "/imagery/suvi171.png";
export const SUVI_GIF = "/imagery/suvi171.gif";
export const LASCO_MANIFEST = `${NOAA_ORIGIN}/products/animations/lasco-c3.json`;

export const LIVE_FRAME_COUNT = 24;
export const LOCAL_LOOP_COUNT = 12;
export const LOOP_MS = 250;

export const LOCAL_SUVI_LOOP: string[] = Array.from(
  { length: LOCAL_LOOP_COUNT },
  (_, i) => `/imagery/loop/${String(i).padStart(2, "0")}.jpg`,
);

type ManifestItem = { url?: unknown };

export function prefixNoaa(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${NOAA_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function urlsFromManifest(data: unknown, take: number): string[] {
  if (!Array.isArray(data)) return [];
  const urls = data
    .map((item) => {
      const url = (item as ManifestItem)?.url;
      return typeof url === "string" && url.length > 0 ? prefixNoaa(url) : "";
    })
    .filter(Boolean);
  return urls.slice(-take);
}
