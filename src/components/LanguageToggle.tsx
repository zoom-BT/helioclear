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
    <div className="lang" role="group" aria-label="Language">
      <button
        type="button"
        aria-pressed={lang === "fr"}
        onClick={() => onChange("fr")}
      >
        {t.langFr}
      </button>
      <span className="lang-rule" aria-hidden>
        |
      </span>
      <button
        type="button"
        aria-pressed={lang === "en"}
        onClick={() => onChange("en")}
      >
        {t.langEn}
      </button>
    </div>
  );
}
