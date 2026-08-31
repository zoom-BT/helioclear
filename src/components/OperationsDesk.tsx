"use client";

import LanguageToggle from "@/components/LanguageToggle";
import ScenarioSwitch from "@/components/ScenarioSwitch";
import StatusBoard from "@/components/StatusBoard";
import type { Lang } from "@/lib/i18n";
import { copy } from "@/lib/i18n";
import type { OpsPayload, ScenarioId } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

function sourceLabel(payload: OpsPayload, lang: Lang): string {
  const t = copy[lang];
  if (payload.source === "live") return t.live;
  if (payload.source === "fallback") return t.cached;
  return t.fixture;
}

export default function OperationsDesk({ initial }: { initial: OpsPayload }) {
  const [lang, setLang] = useState<Lang>("en");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>(initial.scenario);
  const [payload, setPayload] = useState<OpsPayload>(initial);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const requestId = useRef(0);
  const t = copy[lang];

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

  const obs = payload.observation;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/90">
            {t.tagline}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {t.product}
          </h1>
          <p className="mt-2 text-sm text-cyan-100/80">{t.location}</p>
          <p className="mt-1 max-w-xl text-xs text-slate-400">{t.challenge}</p>
        </div>
        <LanguageToggle lang={lang} onChange={setLang} />
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <ScenarioSwitch
          lang={lang}
          selectedScenario={selectedScenario}
          loading={loading}
          onChange={loadScenario}
        />
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              payload.source === "live" ? "live-dot bg-emerald-400" : "bg-amber-300"
            }`}
          />
          <span>
            {t.source}: {sourceLabel(payload, lang)}
          </span>
        </div>
      </section>

      {payload.usingFallback ? (
        <p
          className="mt-4 rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          {t.fallback}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-3 text-sm text-cyan-200/80" role="status">
          {t.loading}
        </p>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <StatusBoard lang={lang} title={t.launch} decision={payload.decision.launch} />
        <StatusBoard
          lang={lang}
          title={t.gnss}
          hint={t.gnssHint}
          decision={payload.decision.gnss}
        />
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { k: t.kpNow, v: obs.kpNow.toFixed(2) },
          { k: t.kp24, v: obs.kp24h.toFixed(2) },
          { k: t.kp72, v: obs.kp72h.toFixed(2) },
          { k: t.flare, v: obs.flareClass },
          { k: t.wind, v: `${Math.round(obs.solarWindSpeed)} km/s` },
          { k: t.bz, v: `${obs.bzGsm.toFixed(1)} nT` },
          { k: t.scales, v: `R${obs.rScale} S${obs.sScale} G${obs.gScale}` },
        ].map((metric) => (
          <div
            key={metric.k}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{metric.k}</p>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-lg text-cyan-50">
              {metric.v}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
            {t.why}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { title: t.launch, mission: payload.decision.launch },
              { title: t.gnss, mission: payload.decision.gnss },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs text-slate-400">{col.title}</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-200">
                  {col.mission.overrides.map((item) => (
                    <li key={item}>• {t.override}: {item}</li>
                  ))}
                  {col.mission.contributions.map((item) => (
                    <li key={item.id}>
                      • {item.label} (+{item.points}) — {item.detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
              {t.briefing}
            </h2>
            <button
              type="button"
              onClick={speak}
              className="rounded-md border border-cyan-300/40 px-3 py-1.5 text-sm text-cyan-100 hover:bg-cyan-300/10"
            >
              {speaking ? t.stop : t.speak}
            </button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-100">{payload.briefing[lang]}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
            {t.alerts}
          </h2>
          {obs.alerts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">{t.noAlerts}</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {obs.alerts.map((alert) => (
                <li key={`${alert.productId}-${alert.issuedAt}`}>
                  <span className="font-[family-name:var(--font-mono)] text-amber-200">
                    {alert.productId}
                  </span>{" "}
                  {alert.headline}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
            {t.donki}
          </h2>
          {payload.donkiStatus === "skipped" ? (
            <p className="mt-3 text-sm text-slate-400">{t.donkiSkip}</p>
          ) : payload.donkiStatus === "error" ? (
            <p className="mt-3 text-sm text-slate-400">{t.donkiError}</p>
          ) : payload.donki.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">{t.donkiEmpty}</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {payload.donki.map((item) => (
                <li key={item.messageID || item.messageBody}>
                  <span className="text-cyan-200">{item.messageType}</span> — {item.messageBody}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <footer className="mt-10 border-t border-white/10 pt-4 text-xs leading-relaxed text-slate-500">
        <p>{t.disclaimer}</p>
        <p className="mt-2">
          MIT © 2026 Balbino Tchoutzine · NOAA SWPC public JSON · optional NASA DONKI DEMO_KEY
        </p>
      </footer>
    </main>
  );
}
