"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { signOutAction } from "@/lib/actions/auth";

const LINKS = [
  { href: "/tablero", key: "nav.board" },
  { href: "/admin/obras", key: "nav.sites" },
  { href: "/admin/obreros", key: "nav.workers" },
  { href: "/admin/contenedores", key: "nav.containers" },
  { href: "/admin/tareas", key: "nav.tasks" },
];

export default function NavBar() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/tablero">
          <Logo />
        </Link>

        <nav className="flex flex-1 flex-wrap gap-1 text-sm">
          {LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--color-brand)] text-white"
                    : "text-black/70 hover:bg-black/5"
                }`}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
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
