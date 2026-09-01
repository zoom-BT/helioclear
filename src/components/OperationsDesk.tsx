"use client";

import KpSparkline from "@/components/KpSparkline";
import LanguageToggle from "@/components/LanguageToggle";
import ScenarioSwitch from "@/components/ScenarioSwitch";
import StatusBoard from "@/components/StatusBoard";
import UtcClock from "@/components/UtcClock";
import type { Lang } from "@/lib/i18n";
import { copy } from "@/lib/i18n";
import type { OpsPayload, ScenarioId } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

function sourceLabel(payload: OpsPayload, lang: Lang): string {
  const t = copy[lang];
  if (payload.source === "live") return t.badgeLive;
  if (payload.source === "fallback") return t.badgeCached;
  return t.badgeDemo;
}

export default function OperationsDesk({ initial }: { initial: OpsPayload }) {
  const [lang, setLang] = useState<Lang>("en");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>(initial.scenario);
  const [payload, setPayload] = useState<OpsPayload>(initial);
  const [speaking, setSpeaking] = useState(false);
  const requestId = useRef(0);
  const t = copy[lang];
  const obs = payload.observation;

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
    try {
      const res = await fetch(`/api/ops?scenario=${next}`, { cache: "no-store" });
      if (!res.ok) throw new Error("ops failed");
      const json = (await res.json()) as OpsPayload;
      if (id === requestId.current) setPayload(json);
    } catch {
      if (id === requestId.current) {
        setPayload((prev) => ({ ...prev, usingFallback: true, source: "fallback" }));
      }
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
      <div className="cockpit-sun" aria-hidden />
      <div className="cockpit-grain" aria-hidden />

      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
        <p className="text-[11px] tracking-[0.42em] text-[color:var(--paper)]">{t.product.toUpperCase()}</p>
        <p className="text-[11px]">
          <UtcClock />
        </p>
        <div className="flex items-center gap-5">
          <LanguageToggle lang={lang} onChange={setLang} />
          <p className="flex items-center gap-2 text-[11px] tracking-[0.16em] text-[color:var(--paper-dim)]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                payload.source === "live" ? "live-dot bg-[color:var(--phosphor)]" : "bg-[color:var(--amber)]"
              }`}
            />
            <span>{sourceLabel(payload, lang)}</span>
          </p>
        </div>
      </header>

      <div className="hairline mx-5 sm:mx-8" />

      <section className="grid flex-1 content-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-0">
        <div className="lg:pr-16">
          <StatusBoard lang={lang} title={t.launch} decision={payload.decision.launch} />
        </div>
        <div className="lg:border-l lg:border-[color:var(--hairline)] lg:pl-16">
          <StatusBoard lang={lang} title={t.gnss} hint={t.gnssHint} decision={payload.decision.gnss} />
        </div>
      </section>

      <section className="px-5 pb-6 sm:px-8">
        <div className="flex items-start justify-between gap-6">
          <p className="max-w-4xl text-[13px] leading-relaxed text-[color:var(--paper-dim)]">
            {payload.briefing[lang]}
          </p>
          <button
            type="button"
            onClick={speak}
            className="text-btn shrink-0 pt-0.5 text-[10px] text-[color:var(--paper-faint)]"
          >
            {speaking ? t.stop : t.speak}
          </button>
        </div>
      </section>

      <div className="hairline mx-5 sm:mx-8" />

      <section className="grid grid-cols-1 gap-6 px-5 py-5 sm:grid-cols-3 sm:items-end sm:px-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--paper-faint)]">{t.kpNow}</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="text-2xl tabular-nums tracking-wide">{obs.kpNow.toFixed(2)}</p>
            <KpSparkline now={obs.kpNow} h24={obs.kp24h} h72={obs.kp72h} />
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--paper-faint)]">{t.flare}</p>
          <p className="mt-2 text-2xl tabular-nums tracking-wide">{obs.flareClass}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--paper-faint)]">{t.bz}</p>
          <p className="mt-2 text-2xl tabular-nums tracking-wide">{obs.bzGsm.toFixed(1)} nT</p>
        </div>
      </section>

      <div className="hairline mx-5 sm:mx-8" />

      <footer className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <ScenarioSwitch lang={lang} selectedScenario={selectedScenario} onChange={loadScenario} />
        <p className="text-[10px] leading-relaxed tracking-wide text-[color:var(--paper-faint)]">{t.disclaimer}</p>
      </footer>
    </main>
  );
}
