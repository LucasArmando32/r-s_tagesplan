"use client";

import { useRouter } from "next/navigation";
import { LOCALES } from "@/lib/i18n/dictionaries";
import { setLocaleCookie } from "@/lib/i18n/setLocaleCookie";
import { useI18n } from "@/lib/i18n/I18nProvider";

const LABELS = { de: "DE", es: "ES" };

export default function LanguageSwitcher() {
  const { locale } = useI18n();
  const router = useRouter();

  function switchTo(next) {
    if (next === locale) return;
    setLocaleCookie(next);
    router.refresh();
  }

  return (
    <div className="inline-flex items-center rounded-full border border-black/10 bg-white p-0.5 text-sm shadow-sm">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          aria-pressed={locale === code}
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            locale === code
              ? "bg-[var(--color-brand)] text-white"
              : "text-black/60 hover:text-black"
          }`}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
