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
  return (
    <div className="inline-flex items-center text-[11px]" role="group" aria-label="Language">
      <button
        type="button"
        className="lang-btn"
        aria-pressed={lang === "fr"}
        onClick={() => onChange("fr")}
      >
        {t.langFr}
      </button>
      <span className="px-0.5 text-[color:var(--paper-faint)]" aria-hidden>
        |
      </span>
      <button
        type="button"
        className="lang-btn"
        aria-pressed={lang === "en"}
        onClick={() => onChange("en")}
      >
        {t.langEn}
      </button>
    </div>
  );
}
