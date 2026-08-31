"use client";

import type { Lang } from "@/lib/i18n";
import { copy } from "@/lib/i18n";

export default function LanguageToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (next: Lang) => void;
}) {
  const t = copy[lang];
  const btn =
    "min-w-11 rounded-md px-3 py-1.5 text-sm font-semibold tracking-wide transition";
  return (
    <div className="inline-flex gap-1 rounded-lg border border-cyan-400/25 bg-black/30 p-1" role="group" aria-label="Language">
      <button
        type="button"
        className={`${btn} ${lang === "fr" ? "bg-cyan-300 text-slate-950" : "text-cyan-100 hover:bg-white/5"}`}
        aria-pressed={lang === "fr"}
        onClick={() => onChange("fr")}
      >
        {t.langFr}
      </button>
      <button
        type="button"
        className={`${btn} ${lang === "en" ? "bg-cyan-300 text-slate-950" : "text-cyan-100 hover:bg-white/5"}`}
        aria-pressed={lang === "en"}
        onClick={() => onChange("en")}
      >
        {t.langEn}
      </button>
    </div>
  );
}
