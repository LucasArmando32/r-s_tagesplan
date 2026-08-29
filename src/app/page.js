import {
  getPublicBoardData,
  registrarVisita,
  isPantallaCargaActiva,
} from "@/lib/data/public";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatDateDMY, formatTodayLong } from "@/lib/date";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CarIcon from "@/components/CarIcon";
import ContenedorToggle from "./ContenedorToggle";
import TareaToggle from "./TareaToggle";
import AutoRefresh from "./AutoRefresh";

export const dynamic = "force-dynamic";

function PublicHeader({ t, today }) {
  return (
    <header className="bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-darker)] shadow-md">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Logo inverted />
        <LanguageSwitcher />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {t("public.title")}
          </h1>
          <span className="text-base font-medium text-white/70 sm:text-lg">
            {today}
          </span>
        </div>
        <p className="text-white/80">{t("public.subtitle")}</p>
      </div>
    </header>
  );
}

export default async function PublicBoardPage() {
  const locale = await getLocale();
  await registrarVisita();
  const t = (path) =>
    path
      .split(".")
      .reduce((acc, key) => acc?.[key], getDictionary(locale)) ?? path;
  const today = formatTodayLong(locale);

  if (await isPantallaCargaActiva()) {
    return (
      <div className="min-h-screen">
        <AutoRefresh />
        <PublicHeader t={t} today={today} />
        <main className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-brand-light)] border-t-[var(--color-brand)]" />
          <h2 className="text-xl font-semibold text-[var(--color-brand)]">
            {t("public.not_ready_title")}
          </h2>
          <p className="text-black/60">{t("public.not_ready_message")}</p>
        </main>
      </div>
    );
  }

  const { obras, contenedores, tareas } = await getPublicBoardData();

  return (
    <div className="min-h-screen">
      <AutoRefresh />
      <PublicHeader t={t} today={today} />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-brand)]">
            {t("public.sites_heading")}
          </h2>
          {obras.length === 0 ? (
            <p className="text-black/60">{t("public.no_sites")}</p>
          ) : (
            <div className="grid gap-4">
              {obras.map((obra) => (
                <div
                  key={obra.id}
                  className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                >
                  <h3 className="text-lg font-semibold">{obra.nombre}</h3>
                  {obra.direccion && (
                    <p className="text-sm text-black/60">
                      {t("public.address")}: {obra.direccion}
                    </p>
                  )}
                  {obra.notas && (
                    <p className="mt-2 rounded-lg bg-[var(--color-brand-light)] px-3 py-2 text-sm text-[var(--color-brand-dark)]">
                      {t("public.notes")}: {obra.notas}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {obra.obreros.length === 0 ? (
                      <span className="text-sm text-black/40">
                        {t("board.no_workers")}
                      </span>
                    ) : (
                      obra.obreros.map((obrero) => (
                        <span
                          key={obrero.id}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                            obrero.tipo === "auto"
                              ? "bg-slate-200 text-slate-800"
                              : "bg-black/5"
                          }`}
                        >
                          {obrero.tipo === "auto" && (
                            <CarIcon className="h-3.5 w-5 shrink-0 text-slate-500" />
                          )}
                          {obrero.nombre}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-brand)]">
            {t("public.containers_heading")}
          </h2>
          {contenedores.length === 0 ? (
            <p className="text-black/60">{t("public.no_containers")}</p>
          ) : (
            <div className="grid gap-3">
              {contenedores.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0 break-words">
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-sm text-black/60">
                      {c.ubicacionNombre || t("common.warehouse")}
                    </p>
                  </div>
                  <ContenedorToggle id={c.id} lleno={c.lleno} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-brand)]">
            {t("public.tasks_heading")}
          </h2>
          {tareas.length === 0 ? (
            <p className="text-black/60">{t("public.no_tasks")}</p>
          ) : (
            <div className="grid gap-3">
              {tareas.map((tarea) => (
                <div
                  key={tarea.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0 break-words">
                    <p
                      className={`font-medium ${tarea.hecha ? "text-black/40 line-through" : ""}`}
                    >
                      {tarea.descripcion}
                    </p>
                    <p className="text-sm text-black/60">
                      {tarea.obreroNombre || t("tasks.unassigned")} ·{" "}
                      {formatDateDMY(tarea.fecha)}
                    </p>
                  </div>
                  <TareaToggle id={tarea.id} hecha={tarea.hecha} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
