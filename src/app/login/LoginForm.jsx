"use client";

import { useActionState } from "react";
import { signInAction } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const initialState = { error: null };

export default function LoginForm({ next }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState
  );

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <LanguageSwitcher />
      </div>
      <form
        action={formAction}
        className="rounded-2xl border border-black/10 bg-white p-6 shadow-lg shadow-black/5"
      >
        <div className="mb-1 h-1 w-10 rounded-full bg-[var(--color-brand)]" />
        <h1 className="mt-3 text-xl font-semibold text-[var(--color-brand-dark)]">
          {t("login.title")}
        </h1>
        <p className="mt-1 text-sm text-black/60">{t("login.subtitle")}</p>

        <input type="hidden" name="next" value={next} />

        <label className="mt-5 block text-sm font-medium">
          {t("login.email")}
          <input
            type="email"
            name="email"
            required
            autoComplete="username"
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-base focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-light)]"
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          {t("login.password")}
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-base focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-light)]"
          />
        </label>

        {state?.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {t("login.error")}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-[var(--color-brand)] px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-brand-dark)] disabled:opacity-60"
        >
          {pending ? t("common.loading") : t("login.submit")}
        </button>
      </form>
    </div>
  );
}
