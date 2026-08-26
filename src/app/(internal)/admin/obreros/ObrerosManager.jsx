"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createObrero, updateObrero, deleteObrero } from "./actions";

function SiteSelect({ obras, defaultValue, t }) {
  return (
    <select
      name="obra_actual_id"
      defaultValue={defaultValue || ""}
      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-base focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-light)]"
    >
      <option value="">{t("common.warehouse")}</option>
      {obras.map((obra) => (
        <option key={obra.id} value={obra.id}>
          {obra.nombre}
        </option>
      ))}
    </select>
  );
}

function ObreroForm({ obrero, obras, onDone }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const isEdit = Boolean(obrero);

  function handleSubmit(formData) {
    startTransition(async () => {
      const action = isEdit
        ? updateObrero.bind(null, obrero.id)
        : createObrero;
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
      <label className="text-sm font-medium">
        {t("common.name")}
        <input
          name="nombre"
          required
          defaultValue={obrero?.nombre}
          className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-base focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-light)]"
        />
      </label>

      <label className="text-sm font-medium">
        {t("workers.current_site")}
        <SiteSelect
          obras={obras}
          defaultValue={obrero?.obra_actual_id}
          t={t}
        />
      </label>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={obrero?.activo ?? true}
            className="h-4 w-4"
          />
          {t("common.active")}
        </label>
      )}

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

function ObreroRow({ obrero, obras, obrasById }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <ObreroForm
        obrero={obrero}
        obras={obras}
        onDone={() => setEditing(false)}
      />
    );
  }

  const siteName = obrero.obra_actual_id
    ? obrasById.get(obrero.obra_actual_id)?.nombre || t("common.none")
    : t("common.warehouse");

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{obrero.nombre}</h3>
          {!obrero.activo && (
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-black/60">
              {t("common.inactive")}
            </span>
          )}
        </div>
        <p className="text-sm text-black/60">{siteName}</p>
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
          onClick={() => {
            if (confirm(t("common.confirm_delete"))) {
              startTransition(() => deleteObrero(obrero.id));
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

export default function ObrerosManager({ obreros, obras }) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const obrasById = new Map(obras.map((o) => [o.id, o]));

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("workers.title")}</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t("workers.new")}
        </button>
      </div>

      {showForm && (
        <ObreroForm obras={obras} onDone={() => setShowForm(false)} />
      )}

      {obreros.length === 0 ? (
        <p className="text-black/60">{t("workers.empty")}</p>
      ) : (
        <div className="grid gap-3">
          {obreros.map((obrero) => (
            <ObreroRow
              key={obrero.id}
              obrero={obrero}
              obras={obras}
              obrasById={obrasById}
            />
          ))}
        </div>
      )}
    </div>
  );
}
