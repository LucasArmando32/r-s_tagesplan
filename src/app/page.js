import { getPublicBoardData, registrarVisita } from "@/lib/data/public";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ContenedorToggle from "./ContenedorToggle";
import TareaToggle from "./TareaToggle";

export const dynamic = "force-dynamic";

export default async function PublicBoardPage() {
  const locale = await getLocale();
  registrarVisita();
  const { obras, contenedores, tareas } = getPublicBoardData();
  const t = (path) =>
    path
      .split(".")
      .reduce((acc, key) => acc?.[key], getDictionary(locale)) ?? path;

  return (
    <div className="min-h-screen">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Logo />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">{t("public.title")}</h1>
          <p className="text-black/60">{t("public.subtitle")}</p>
        </div>

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
                          className="rounded-full bg-black/5 px-3 py-1 text-sm font-medium"
                        >
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
                  className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                >
                  <div>
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
                  className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                >
                  <div>
                    <p
                      className={`font-medium ${tarea.hecha ? "text-black/40 line-through" : ""}`}
                    >
                      {tarea.descripcion}
                    </p>
                    <p className="text-sm text-black/60">
                      {tarea.obreroNombre || t("tasks.unassigned")} ·{" "}
                      {tarea.fecha}
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
