import { describe, expect, it } from "vitest";
import { detectWebGL, GULF_OF_GUINEA, latLonToVector3 } from "./globe";

describe("globe mapping", () => {
  it("places Greenwich on +X at the equator", () => {
    const p = latLonToVector3(0, 0, 1);
    expect(p.x).toBeCloseTo(1, 5);
    expect(p.y).toBeCloseTo(0, 5);
    expect(p.z).toBeCloseTo(0, 5);
  });

  it("places the Gulf of Guinea on the Africa-facing hemisphere", () => {
    const p = latLonToVector3(GULF_OF_GUINEA.lat, GULF_OF_GUINEA.lon, 1);
    expect(p.x).toBeGreaterThan(0.85);
    expect(p.y).toBeGreaterThan(0);
    expect(p.y).toBeLessThan(0.15);
    expect(p.z).toBeLessThan(0);
  });

  it("scales with radius", () => {
    const p = latLonToVector3(0, 0, 2);
    expect(p.x).toBeCloseTo(2, 5);
  });

  it("reports no WebGL in this Node test environment", () => {
    expect(detectWebGL()).toBe(false);
  });
});
