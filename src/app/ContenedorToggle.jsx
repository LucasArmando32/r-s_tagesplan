"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function ContenedorToggle({ id, lleno: initialLleno }) {
  const { t } = useI18n();
  const [lleno, setLleno] = useState(initialLleno);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !lleno;
    setLleno(next);
    startTransition(async () => {
      try {
        const res = await fetch("/api/public/contenedores/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setLleno(data.lleno);
      } catch {
        setLleno(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={lleno}
      className={`min-w-32 rounded-xl px-5 py-3 text-base font-semibold shadow-sm transition-colors disabled:opacity-60 ${
        lleno
          ? "bg-[var(--color-brand)] text-white"
          : "bg-white text-black/70 ring-1 ring-black/10"
      }`}
    >
      {lleno ? t("containers.full") : t("containers.not_full")}
    </button>
  );
}
