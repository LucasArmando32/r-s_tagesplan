"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function VerlaufTabs() {
  const { t } = useI18n();
  const pathname = usePathname();
  const enMes = pathname.endsWith("/monat");

  const tabClass = (activo) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${
      activo
        ? "bg-[var(--color-brand)] text-white"
        : "text-black/60 hover:bg-black/5"
    }`;

  return (
    <div className="mb-4 flex gap-2">
      <Link href="/tablero/verlauf" className={tabClass(!enMes)}>
        {t("history.tab_day")}
      </Link>
      <Link href="/tablero/verlauf/monat" className={tabClass(enMes)}>
        {t("history.tab_month")}
      </Link>
    </div>
  );
}
