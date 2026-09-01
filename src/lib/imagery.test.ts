import { describe, expect, it } from "vitest";
import { prefixNoaa, urlsFromManifest } from "./imagery";

describe("NOAA animation manifest adapter", () => {
  it("prefixes relative SWPC paths", () => {
    expect(prefixNoaa("/images/animations/suvi/primary/171/latest.png")).toBe(
      "https://services.swpc.noaa.gov/images/animations/suvi/primary/171/latest.png",
    );
    expect(prefixNoaa("https://services.swpc.noaa.gov/x.png")).toBe(
      "https://services.swpc.noaa.gov/x.png",
    );
  });

  it("takes the last N frames from a NOAA animation JSON", () => {
    const urls = urlsFromManifest(
      [{ url: "/a.png" }, { url: "/b.png" }, { url: "/c.png" }, {}],
      2,
    );
    expect(urls).toEqual([
      "https://services.swpc.noaa.gov/b.png",
      "https://services.swpc.noaa.gov/c.png",
    ]);
  });
});
