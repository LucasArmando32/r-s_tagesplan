"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function TareaToggle({ id, hecha: initialHecha }) {
  const { t } = useI18n();
  const [hecha, setHecha] = useState(initialHecha);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !hecha;
    setHecha(next);
    startTransition(async () => {
      try {
        const res = await fetch("/api/public/tareas/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setHecha(data.hecha);
      } catch {
        setHecha(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={hecha}
      className={`min-w-32 rounded-xl px-5 py-3 text-base font-semibold shadow-sm transition-colors disabled:opacity-60 ${
        hecha
          ? "bg-[var(--color-brand)] text-white"
          : "bg-white text-black/70 ring-1 ring-black/10"
      }`}
    >
      {hecha ? t("tasks.done") : t("tasks.not_done")}
    </button>
  );
}
