"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import Switch from "@/components/Switch";

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
      className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/10 transition-opacity disabled:opacity-60"
    >
      <span
        className={`text-base font-semibold ${
          lleno ? "text-[var(--color-brand)]" : "text-black/50"
        }`}
      >
        {lleno ? t("containers.full") : t("containers.not_full")}
      </span>
      <Switch checked={lleno} size="lg" />
    </button>
  );
}
