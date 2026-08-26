"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import Switch from "@/components/Switch";
import {
  createContenedor,
  updateContenedor,
  setContenedorLleno,
  deleteContenedor,
} from "./actions";

function LocationSelect({ obras, defaultValue, t }) {
  return (
    <select
      name="ubicacion_id"
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

function ContenedorForm({ contenedor, obras, onDone }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const isEdit = Boolean(contenedor);

  function handleSubmit(formData) {
    startTransition(async () => {
      const action = isEdit
        ? updateContenedor.bind(null, contenedor.id)
        : createContenedor;
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
          defaultValue={contenedor?.nombre}
          className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-base focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-light)]"
        />
      </label>

      <label className="text-sm font-medium">
        {t("containers.location")}
        <LocationSelect
          obras={obras}
          defaultValue={contenedor?.ubicacion_id}
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

function ContenedorRow({ contenedor, obras, obrasById }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <ContenedorForm
        contenedor={contenedor}
        obras={obras}
        onDone={() => setEditing(false)}
      />
    );
  }

  const locationName = contenedor.ubicacion_id
    ? obrasById.get(contenedor.ubicacion_id)?.nombre || t("common.none")
    : t("common.warehouse");

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-semibold">{contenedor.nombre}</h3>
        <p className="text-sm text-black/60">{locationName}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() =>
              setContenedorLleno(contenedor.id, !contenedor.lleno)
            )
          }
          aria-pressed={contenedor.lleno}
          className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-black/70 disabled:opacity-60"
        >
          <span>
            {contenedor.lleno ? t("containers.full") : t("containers.not_full")}
          </span>
          <Switch checked={contenedor.lleno} />
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
              startTransition(() => deleteContenedor(contenedor.id));
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

export default function ContenedoresManager({ contenedores, obras }) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const obrasById = new Map(obras.map((o) => [o.id, o]));

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--color-brand)]">
          {t("containers.title")}
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t("containers.new")}
        </button>
      </div>

      {showForm && (
        <ContenedorForm obras={obras} onDone={() => setShowForm(false)} />
      )}

      {contenedores.length === 0 ? (
        <p className="text-black/60">{t("containers.empty")}</p>
      ) : (
        <div className="grid gap-3">
          {contenedores.map((contenedor) => (
            <ContenedorRow
              key={contenedor.id}
              contenedor={contenedor}
              obras={obras}
              obrasById={obrasById}
            />
          ))}
        </div>
      )}
    </div>
  );
}
