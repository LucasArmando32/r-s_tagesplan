"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import VerlaufTabs from "../VerlaufTabs";

const COLUMNAS = [
  { key: "ferien", labelKey: "history.col_ferien" },
  { key: "krank", labelKey: "history.col_krank" },
  { key: "frei", labelKey: "history.col_frei" },
  { key: "lager", labelKey: "history.col_lager" },
  { key: "obra", labelKey: "history.col_obra" },
];

function exportarCSV(mes, resumen, columnas) {
  const encabezado = ["Arbeiter/Obrero", ...columnas.map((c) => c.key)];
  const filas = resumen.map((fila) => [
    fila.obrero_nombre,
    ...columnas.map((c) => fila[c.key]),
  ]);
  const csv = [encabezado, ...filas]
    .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `verlauf-${mes}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VerlaufMonatClient({ mes, resumen }) {
  const { t } = useI18n();
  const router = useRouter();

  function onChangeMes(e) {
    if (e.target.value) router.push(`/tablero/verlauf/monat?mes=${e.target.value}`);
  }

  return (
    <div>
      <VerlaufTabs />
      <div className="mb-5 border-b border-black/5 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-brand-dark)] sm:text-3xl">
              {t("history.title")}
            </h1>
            <p className="mt-1 text-sm text-black/60">
              {t("history.month_subtitle")}
            </p>
          </div>
          <input
            type="month"
            value={mes}
            onChange={onChangeMes}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>
      </div>

      {resumen.length === 0 ? (
        <p className="text-black/60">{t("history.month_empty")}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-black/50">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("history.worker")}</th>
                  {COLUMNAS.map((c) => (
                    <th key={c.key} className="px-4 py-2 text-right font-medium">
                      {t(c.labelKey)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resumen.map((fila) => (
                  <tr
                    key={fila.obrero_nombre}
                    className="border-b border-black/5 last:border-0"
                  >
                    <td className="px-4 py-2">{fila.obrero_nombre}</td>
                    {COLUMNAS.map((c) => (
                      <td key={c.key} className="px-4 py-2 text-right tabular-nums">
                        {fila[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => exportarCSV(mes, resumen, COLUMNAS)}
            className="mt-3 rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium text-black/70 hover:bg-black/5"
          >
            {t("history.export_csv")}
          </button>
        </>
      )}
    </div>
  );
}
