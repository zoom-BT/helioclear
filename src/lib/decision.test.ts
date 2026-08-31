import { describe, expect, it } from "vitest";
import { buildBriefing } from "./briefing";
import {
  evaluate,
  evaluateFixture,
  FIXTURES,
  isX5OrGreater,
  parseFlareClass,
} from "./decision";
import type { Observation } from "./types";

function quietBase(over: Partial<Observation> = {}): Observation {
  return { ...FIXTURES.quiet, ...over };
}

describe("HelioClear decision engine", () => {
  it("quiet fixture is GO for launch and GNSS", () => {
    const desk = evaluateFixture("quiet");
    expect(desk.launch.call).toBe("GO");
    expect(desk.gnss.call).toBe("GO");
    expect(desk.launch.overrides).toEqual([]);
    expect(desk.gnss.overrides).toEqual([]);
  });

  it("equatorial fixture is Launch GO and GNSS CONDITIONAL", () => {
    const desk = evaluateFixture("equatorial");
    expect(desk.launch.call).toBe("GO");
    expect(desk.gnss.call).toBe("CONDITIONAL");
    expect(desk.gnss.contributions.some((c) => c.id === "eia")).toBe(true);
    expect(desk.launch.contributions.some((c) => c.id === "eia")).toBe(false);
  });

  it("storm fixture is NO-GO for launch and GNSS", () => {
    const desk = evaluateFixture("storm");
    expect(desk.launch.call).toBe("NO-GO");
    expect(desk.gnss.call).toBe("NO-GO");
    expect(desk.launch.overrides).toContain("G4+ geomagnetic storm");
  });

  it("xflare fixture hard-overrides both missions on X5+", () => {
    const desk = evaluateFixture("xflare");
    expect(desk.launch.call).toBe("NO-GO");
    expect(desk.gnss.call).toBe("NO-GO");
    expect(desk.launch.overrides).toContain("X5+ solar flare");
    expect(isX5OrGreater(parseFlareClass(FIXTURES.xflare.flareClass))).toBe(true);
  });

  it("radiation fixture hard-overrides both missions on S3+", () => {
    const desk = evaluateFixture("radiation");
    expect(desk.launch.call).toBe("NO-GO");
    expect(desk.gnss.call).toBe("NO-GO");
    expect(desk.launch.overrides).toContain("S3+ radiation storm");
  });

  it("sample fixture stays in-range and remains interpretable", () => {
    const desk = evaluateFixture("sample");
    expect(["GO", "CONDITIONAL", "NO-GO"]).toContain(desk.launch.call);
    expect(["GO", "CONDITIONAL", "NO-GO"]).toContain(desk.gnss.call);
    expect(desk.launch.contributions.length).toBeGreaterThan(0);
    expect(desk.gnss.contributions.some((c) => c.id === "eia")).toBe(true);
  });

  it("G4+ is a hard NO-GO even on an otherwise quiet sun", () => {
    const desk = evaluate(quietBase({ gScale: 4 }));
    expect(desk.launch.call).toBe("NO-GO");
    expect(desk.gnss.call).toBe("NO-GO");
    expect(desk.launch.overrides).toContain("G4+ geomagnetic storm");
  });

  it("GNSS uses a lower Kp trigger than launch", () => {
    const desk = evaluate(
      quietBase({
        kpNow: 4.1,
        kp24h: 4.1,
        kp72h: 2.0,
        equatorialBias: false,
      }),
    );
    expect(desk.launch.call).toBe("GO");
    expect(desk.gnss.call).toBe("CONDITIONAL");
  });

  it("X4.9 is not an X5+ hard override", () => {
    const flare = parseFlareClass("X4.9");
    expect(isX5OrGreater(flare)).toBe(false);
    const desk = evaluate(quietBase({ flareClass: "X4.9" }));
    expect(desk.launch.overrides).toEqual([]);
    expect(desk.launch.call).not.toBe("NO-GO");
  });

  it("S2 radiation is not a hard override", () => {
    const desk = evaluate(quietBase({ sScale: 2 }));
    expect(desk.launch.overrides).toEqual([]);
    expect(desk.launch.call).not.toBe("NO-GO");
  });

  it("mission score equals the sum of additive contribution points", () => {
    const desk = evaluateFixture("sample");
    const launchSum = desk.launch.contributions.reduce((s, c) => s + c.points, 0);
    const gnssSum = desk.gnss.contributions.reduce((s, c) => s + c.points, 0);
    expect(desk.launch.score).toBe(launchSum);
    expect(desk.gnss.score).toBe(gnssSum);
  });

  it("builds a bilingual ~20s briefing that names both calls", () => {
    const observation = FIXTURES.equatorial;
    const decision = evaluate(observation);
    const briefing = buildBriefing(observation, decision);
    expect(briefing.en).toMatch(/Launch is GO/);
    expect(briefing.en).toMatch(/GNSS\/HF is CONDITIONAL/);
    expect(briefing.fr).toMatch(/Lancement : GO/);
    expect(briefing.fr).toMatch(/GNSS\/HF équatorial : CONDITIONAL/);
    expect(briefing.en.toLowerCase()).toContain("not certified");
    expect(briefing.fr.toLowerCase()).toContain("non certifié");
    expect(briefing.en.split(/\s+/).length).toBeGreaterThan(40);
    expect(briefing.en.split(/\s+/).length).toBeLessThan(120);
  });
});
