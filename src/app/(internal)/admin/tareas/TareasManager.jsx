"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createTarea, updateTarea, setTareaHecha, deleteTarea } from "./actions";

function WorkerSelect({ obreros, defaultValue, t }) {
  return (
    <select
      name="obrero_asignado_id"
      defaultValue={defaultValue || ""}
      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-base focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-light)]"
    >
      <option value="">{t("tasks.unassigned")}</option>
      {obreros.map((obrero) => (
        <option key={obrero.id} value={obrero.id}>
          {obrero.nombre}
        </option>
      ))}
    </select>
  );
}

function TareaForm({ tarea, obreros, today, onDone }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const isEdit = Boolean(tarea);

  function handleSubmit(formData) {
    startTransition(async () => {
      const action = isEdit ? updateTarea.bind(null, tarea.id) : createTarea;
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      onDone?.();
    });
  }

  return (
    <form
      action={handleSubmit}
      className="grid gap-3 rounded-xl border border-black/10 bg-white p-4 sm:grid-cols-2"
    >
      <label className="text-sm font-medium sm:col-span-2">
        {t("tasks.description")}
        <input
          name="descripcion"
          required
          defaultValue={tarea?.descripcion}
          className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-base focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-light)]"
        />
      </label>

      <label className="text-sm font-medium">
        {t("tasks.date")}
        <input
          type="date"
          name="fecha"
          required
          defaultValue={tarea?.fecha || today}
          className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-base focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-light)]"
        />
      </label>

      <label className="text-sm font-medium">
        {t("tasks.assigned_to")}
        <WorkerSelect
          obreros={obreros}
          defaultValue={tarea?.obrero_asignado_id}
          t={t}
        />
      </label>

      {error && (
        <p className="text-sm text-red-700 sm:col-span-2">
          {t("common.save_error")}
        </p>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? t("common.loading") : t("common.save")}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={() => onDone?.()}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium text-black/70 hover:bg-black/5"
          >
            {t("common.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}

function TareaRow({ tarea, obreros, obrerosById, today }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <TareaForm
        tarea={tarea}
        obreros={obreros}
        today={today}
        onDone={() => setEditing(false)}
      />
    );
  }

  const workerName = tarea.obrero_asignado_id
    ? obrerosById.get(tarea.obrero_asignado_id)?.nombre || t("common.none")
    : t("tasks.unassigned");

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3
          className={`font-semibold ${tarea.hecha ? "line-through text-black/40" : ""}`}
        >
          {tarea.descripcion}
        </h3>
        <p className="text-sm text-black/60">
          {tarea.fecha} · {workerName}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() => setTareaHecha(tarea.id, !tarea.hecha))
          }
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            tarea.hecha
              ? "bg-[var(--color-brand)] text-white"
              : "bg-black/5 text-black/70"
          } disabled:opacity-60`}
        >
          {tarea.hecha ? t("tasks.done") : t("tasks.not_done")}
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium text-black/70 hover:bg-black/5"
        >
          {t("common.edit")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(t("common.confirm_delete"))) {
              startTransition(() => deleteTarea(tarea.id));
            }
          }}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {t("common.delete")}
        </button>
      </div>
    </div>
  );
}

export default function TareasManager({ tareas, obreros, today }) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const obrerosById = new Map(obreros.map((o) => [o.id, o]));

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("tasks.title")}</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t("tasks.new")}
        </button>
      </div>

      {showForm && (
        <TareaForm
          obreros={obreros}
          today={today}
          onDone={() => setShowForm(false)}
        />
      )}

      {tareas.length === 0 ? (
        <p className="text-black/60">{t("tasks.empty")}</p>
      ) : (
        <div className="grid gap-3">
          {tareas.map((tarea) => (
            <TareaRow
              key={tarea.id}
              tarea={tarea}
              obreros={obreros}
              obrerosById={obrerosById}
              today={today}
            />
          ))}
        </div>
      )}
    </div>
  );
}
