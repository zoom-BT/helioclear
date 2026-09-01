"use client";

import DecisionStamp from "@/components/DecisionStamp";
import InstrumentStrip from "@/components/InstrumentStrip";
import LanguageToggle from "@/components/LanguageToggle";
import ScenarioSwitch from "@/components/ScenarioSwitch";
import SolarDisc from "@/components/SolarDisc";
import UtcClock from "@/components/UtcClock";
import { SUVI_LATEST } from "@/lib/imagery";
import type { Lang } from "@/lib/i18n";
import { copy } from "@/lib/i18n";
import type { MissionDecision, OpsPayload, ScenarioId } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

function sourceLabel(payload: OpsPayload, lang: Lang): string {
  const t = copy[lang];
  if (payload.source === "live") return t.live;
  if (payload.source === "fallback") return t.cached;
  return t.fixture;
}

function topWhy(decision: MissionDecision, lang: Lang): string {
  const t = copy[lang];
  if (decision.overrides[0]) return `${t.override}: ${decision.overrides[0]}`;
  const ranked = [...decision.contributions].sort((a, b) => b.points - a.points);
  const top = ranked[0];
  if (!top) return t.noDriver;
  return `${top.label} — ${top.detail}`;
}

export default function OperationsDesk({ initial }: { initial: OpsPayload }) {
  const [lang, setLang] = useState<Lang>("en");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>(initial.scenario);
  const [payload, setPayload] = useState<OpsPayload>(initial);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [sunSrc, setSunSrc] = useState(SUVI_LATEST);
  const requestId = useRef(0);
  const t = copy[lang];

  const onFrame = useCallback((src: string) => {
    setSunSrc(src);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  async function loadScenario(next: ScenarioId) {
    setSelectedScenario(next);
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/ops?scenario=${next}`, { cache: "no-store" });
      if (!res.ok) throw new Error("ops failed");
      const json = (await res.json()) as OpsPayload;
      if (id === requestId.current) setPayload(json);
    } catch {
      if (id === requestId.current) {
        setPayload((prev) => ({ ...prev, usingFallback: true, source: "fallback" }));
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(payload.briefing[lang]);
    utterance.lang = lang === "fr" ? "fr-FR" : "en-US";
    utterance.rate = 1.02;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="cockpit">
      {/* Native img: current NOAA SUVI frame, darkened wash. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="cockpit-wash" src={sunSrc} alt="" aria-hidden />
      <div className="cockpit-veil" aria-hidden />

      <header className="rail rail-top">
        <span className="mark">HELIOCLEAR</span>
        <UtcClock />
        <LanguageToggle lang={lang} onChange={setLang} />
        <p className="badge" data-source={payload.source}>
          <span
            className={`badge-dot ${payload.source === "live" ? "live-dot" : ""}`}
            aria-hidden
          />
          <span>
            {sourceLabel(payload, lang)}
            {loading ? " · · ·" : ""}
          </span>
        </p>
      </header>

      <section className="viewport">
        <DecisionStamp
          align="launch"
          channel={t.launch}
          decision={payload.decision.launch}
        />
        <SolarDisc
          credit={t.credit}
          lasco={selectedScenario === "storm"}
          onFrame={onFrame}
        />
        <DecisionStamp
          align="gnss"
          channel={t.gnss}
          hint={t.gnssHint}
          decision={payload.decision.gnss}
        />
      </section>

      <section className="brief">
        <div className="whys">
          <p>
            <span className="why-k">{t.launch}</span>
            {topWhy(payload.decision.launch, lang)}
          </p>
          <p>
            <span className="why-k">{t.gnss}</span>
            {topWhy(payload.decision.gnss, lang)}
          </p>
        </div>
        <div className="briefing-row">
          <p className="briefing">{payload.briefing[lang]}</p>
          <button type="button" className="speak" onClick={speak}>
            {speaking ? t.stop : t.speak}
          </button>
        </div>
      </section>

      <InstrumentStrip lang={lang} observation={payload.observation} />

      <ScenarioSwitch
        lang={lang}
        selectedScenario={selectedScenario}
        loading={loading}
        onChange={loadScenario}
      />

      <footer className="rail rail-foot">
        <p>{t.disclaimer}</p>
      </footer>
    </main>
  );
}
