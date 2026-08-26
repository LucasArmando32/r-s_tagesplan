"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createObra, updateObra, setObraActiva, deleteObra } from "./actions";

function ObraForm({ obra, onDone }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const isEdit = Boolean(obra);

  function handleSubmit(formData) {
    startTransition(async () => {
      const action = isEdit ? updateObra.bind(null, obra.id) : createObra;
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
      <label className="text-sm font-medium sm:col-span-1">
        {t("common.name")}
        <input
          name="nombre"
          required
          defaultValue={obra?.nombre}
          className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-base focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-light)]"
        />
      </label>

      <label className="text-sm font-medium sm:col-span-1">
        {t("common.address")}
        <input
          name="direccion"
          defaultValue={obra?.direccion || ""}
          className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-base focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-light)]"
        />
      </label>

      <label className="text-sm font-medium sm:col-span-2">
        {t("common.notes")}
        <textarea
          name="notas"
          rows={2}
          defaultValue={obra?.notas || ""}
          className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-base focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-light)]"
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

function ObraRow({ obra }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return <ObraForm obra={obra} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{obra.nombre}</h3>
          {!obra.activa && (
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-black/60">
              {t("sites.archived")}
            </span>
          )}
        </div>
        {obra.direccion && (
          <p className="text-sm text-black/60">{obra.direccion}</p>
        )}
        {obra.notas && (
          <p className="mt-1 text-sm text-black/70">{obra.notas}</p>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
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
          onClick={() =>
            startTransition(() => setObraActiva(obra.id, !obra.activa))
          }
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium text-black/70 hover:bg-black/5 disabled:opacity-60"
        >
          {obra.activa ? t("common.archive") : t("common.active")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(t("common.confirm_delete"))) {
              startTransition(() => deleteObra(obra.id));
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

export default function ObrasManager({ obras }) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("sites.title")}</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t("sites.new")}
        </button>
      </div>

      {showForm && <ObraForm onDone={() => setShowForm(false)} />}

      {obras.length === 0 ? (
        <p className="text-black/60">{t("sites.empty")}</p>
      ) : (
        <div className="grid gap-3">
          {obras.map((obra) => (
            <ObraRow key={obra.id} obra={obra} />
          ))}
        </div>
      )}
    </div>
  );
}
