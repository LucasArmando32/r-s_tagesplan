"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { signOutAction } from "@/lib/actions/auth";

export default function NavBar() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 shadow-sm backdrop-blur">
      <div className="h-1 bg-gradient-to-r from-[var(--color-brand-darker)] via-[var(--color-brand)] to-[var(--color-brand-darker)]" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/tablero">
          <Logo />
        </Link>

        <Link
          href="/tablero/verlauf"
          className="text-sm font-medium text-black/60 hover:text-black/80"
        >
          {t("history.title")}
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher />
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium text-black/70 transition-colors hover:border-black/25 hover:bg-black/5"
            >
              {t("common.logout")}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
