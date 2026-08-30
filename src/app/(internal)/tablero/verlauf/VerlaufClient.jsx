"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

const TIPO_LABEL_KEY = {
  lager: "history.type_lager",
  frei: "history.type_frei",
  ferien: "history.type_ferien",
  krank: "history.type_krank",
};

export default function VerlaufClient({ fecha, historial }) {
  const { t } = useI18n();
  const router = useRouter();

  function onChangeFecha(e) {
    if (e.target.value) router.push(`/tablero/verlauf?fecha=${e.target.value}`);
  }

  return (
    <div>
      <div className="mb-5 border-b border-black/5 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-brand-dark)] sm:text-3xl">
              {t("history.title")}
            </h1>
            <p className="mt-1 text-sm text-black/60">{t("history.subtitle")}</p>
          </div>
          <input
            type="date"
            value={fecha}
            onChange={onChangeFecha}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>
      </div>

      {historial.length === 0 ? (
        <p className="text-black/60">{t("history.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-black/50">
              <tr>
                <th className="px-4 py-2 font-medium">{t("history.worker")}</th>
                <th className="px-4 py-2 font-medium">{t("history.location")}</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((fila) => (
                <tr
                  key={fila.obrero_id ?? fila.obrero_nombre}
                  className="border-b border-black/5 last:border-0"
                >
                  <td className="px-4 py-2">{fila.obrero_nombre}</td>
                  <td className="px-4 py-2">
                    {fila.tipo === "obra"
                      ? fila.obra_nombre
                      : t(TIPO_LABEL_KEY[fila.tipo] || fila.tipo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
