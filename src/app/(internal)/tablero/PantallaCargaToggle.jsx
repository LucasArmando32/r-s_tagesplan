"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import Switch from "@/components/Switch";
import { setPantallaCargaManual } from "./actions";

export default function PantallaCargaToggle({ activa: activaInicial }) {
  const { t } = useI18n();
  const [activa, setActiva] = useState(activaInicial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !activa;
    setActiva(next);
    startTransition(async () => {
      const { error } = await setPantallaCargaManual(next);
      if (error) setActiva(!next);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={activa}
      className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/10 transition-opacity disabled:opacity-60"
    >
      <span className="text-left text-sm">
        <span className="block font-semibold text-black/80">
          {t("board.loading_screen")}
        </span>
        <span
          className={`block text-sm font-medium ${
            activa ? "text-[var(--color-brand)]" : "text-black/50"
          }`}
        >
          {activa
            ? t("board.loading_screen_active")
            : t("board.loading_screen_inactive")}
        </span>
      </span>
      <Switch checked={activa} size="lg" />
    </button>
  );
}
