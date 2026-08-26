"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { signOutAction } from "@/lib/actions/auth";

export default function NavBar() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/tablero">
          <Logo />
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher />
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium text-black/70 transition-colors hover:bg-black/5"
            >
              {t("common.logout")}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
