"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  moverObrero,
  crearObra,
  actualizarObra,
  borrarObra,
  crearObrero,
  renombrarObrero,
  borrarObrero,
} from "./actions";

const WAREHOUSE_ID = "almacen";

function WorkerCard({ obrero }) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: obrero.id });
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(obrero.nombre);
  const [pending, startTransition] = useTransition();

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  function save() {
    const trimmed = nombre.trim();
    if (!trimmed) return;
    startTransition(() => renombrarObrero(obrero.id, trimmed));
    setEditing(false);
  }

  function remove() {
    if (!confirm(t("common.confirm_delete"))) return;
    startTransition(() => borrarObrero(obrero.id));
  }

  if (editing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg border border-black/10 bg-white p-2 text-sm shadow-sm"
      >
        <input
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setNombre(obrero.nombre);
              setEditing(false);
            }
          }}
          className="w-full rounded border border-black/15 px-2 py-1 text-sm focus:border-[var(--color-brand)] focus:outline-none"
        />
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="text-xs font-medium text-[var(--color-brand)]"
            >
              {t("common.save")}
            </button>
            <button
              type="button"
              onClick={() => {
                setNombre(obrero.nombre);
                setEditing(false);
              }}
              className="text-xs text-black/50"
            >
              {t("common.cancel")}
            </button>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-xs font-medium text-red-700"
          >
            {t("common.delete")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => setEditing(true)}
      className={`cursor-grab touch-none select-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium shadow-sm active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      {obrero.nombre}
    </div>
  );
}

function AddWorkerRow({ obraId }) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [nombre, setNombre] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef(null);

  function submit() {
    const trimmed = nombre.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    startTransition(async () => {
      await crearObrero(trimmed, obraId);
      setNombre("");
      inputRef.current?.focus();
    });
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="rounded-lg px-2 py-1.5 text-left text-sm text-black/50 hover:bg-black/5 hover:text-black/70"
      >
        + {t("board.new_worker")}
      </button>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        autoFocus
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") {
            setAdding(false);
            setNombre("");
          }
        }}
        onBlur={() => {
          if (!nombre.trim()) setAdding(false);
        }}
        className="w-full rounded-lg border border-black/15 bg-white px-2 py-1.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
      />
      <div className="mt-1.5 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-lg bg-[var(--color-brand)] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
        >
          {t("common.save")}
        </button>
        <button
          type="button"
          onClick={() => {
            setAdding(false);
            setNombre("");
          }}
          className="rounded-lg border border-black/15 px-2.5 py-1 text-xs font-medium text-black/70"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

function EditObraForm({ obra, onDone }) {
  const { t } = useI18n();
  const [nombre, setNombre] = useState(obra.nombre);
  const [direccion, setDireccion] = useState(obra.direccion || "");
  const [notas, setNotas] = useState(obra.notas || "");
  const [pending, startTransition] = useTransition();

  function save() {
    const trimmed = nombre.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await actualizarObra(
        obra.id,
        trimmed,
        direccion.trim() || null,
        notas.trim() || null
      );
      onDone();
    });
  }

  function remove() {
    if (!confirm(t("common.confirm_delete"))) return;
    startTransition(async () => {
      await borrarObra(obra.id);
      onDone();
    });
  }

  return (
    <div className="mb-2 rounded-lg border border-black/10 bg-white p-2 shadow-sm">
      <input
        autoFocus
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full rounded border border-black/15 px-2 py-1 text-sm font-semibold focus:border-[var(--color-brand)] focus:outline-none"
      />
      <input
        value={direccion}
        onChange={(e) => setDireccion(e.target.value)}
        placeholder={t("common.address")}
        className="mt-1.5 w-full rounded border border-black/15 px-2 py-1 text-xs focus:border-[var(--color-brand)] focus:outline-none"
      />
      <textarea
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        rows={2}
        placeholder={t("board.notes_placeholder")}
        className="mt-1.5 w-full rounded border border-black/15 px-2 py-1 text-xs focus:border-[var(--color-brand)] focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded bg-[var(--color-brand)] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
          >
            {t("common.save")}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded border border-black/15 px-2.5 py-1 text-xs font-medium text-black/70"
          >
            {t("common.cancel")}
          </button>
        </div>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-xs font-medium text-red-700"
        >
          {t("common.delete")}
        </button>
      </div>
    </div>
  );
}

function AddSiteColumn() {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const trimmed = nombre.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    startTransition(async () => {
      await crearObra(trimmed, direccion.trim() || null, null);
      setNombre("");
      setDireccion("");
      setAdding(false);
    });
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex h-12 w-72 shrink-0 items-center justify-center rounded-xl border border-dashed border-black/15 text-sm font-medium text-black/50 hover:border-black/30 hover:text-black/70"
      >
        + {t("board.new_site")}
      </button>
    );
  }

  return (
    <div className="w-72 shrink-0 rounded-xl border border-black/10 bg-black/[0.02] p-3">
      <input
        autoFocus
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder={t("common.name")}
        className="w-full rounded-lg border border-black/15 bg-white px-2 py-1.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
      />
      <input
        value={direccion}
        onChange={(e) => setDireccion(e.target.value)}
        placeholder={t("common.address")}
        className="mt-2 w-full rounded-lg border border-black/15 bg-white px-2 py-1.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
        >
          {t("common.save")}
        </button>
        <button
          type="button"
          onClick={() => setAdding(false)}
          className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-medium text-black/70"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

function Column({ id, obra, obreros }) {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id });
  const [editing, setEditing] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-colors ${
        isOver
          ? "border-[var(--color-brand)] bg-[var(--color-brand-light)]"
          : "border-black/10 bg-black/[0.02]"
      }`}
    >
      {!obra ? (
        <h2 className="mb-2 font-semibold">{t("common.warehouse")}</h2>
      ) : editing ? (
        <EditObraForm obra={obra} onDone={() => setEditing(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mb-2 w-full rounded-lg px-1 py-1 text-left hover:bg-black/5"
        >
          <h2 className="font-semibold">{obra.nombre}</h2>
          {obra.direccion && (
            <p className="text-xs text-black/60">{obra.direccion}</p>
          )}
          {obra.notas && (
            <p className="mt-1 text-xs text-black/70">{obra.notas}</p>
          )}
        </button>
      )}

      <div className="flex min-h-16 flex-1 flex-col gap-2">
        {obreros.length === 0 ? (
          <p className="rounded-lg border border-dashed border-black/15 px-3 py-3 text-center text-xs text-black/40">
            {t("board.no_workers")}
          </p>
        ) : (
          obreros.map((obrero) => (
            <WorkerCard key={obrero.id} obrero={obrero} />
          ))
        )}
      </div>

      <div className="mt-2">
        <AddWorkerRow obraId={obra ? obra.id : null} />
      </div>
    </div>
  );
}

export default function Board({ obras, obreros }) {
  const { t, locale } = useI18n();
  const today = useMemo(() => {
    const formatted = new Intl.DateTimeFormat(
      locale === "de" ? "de-CH" : "es-AR",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    ).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [locale]);
  const [prevObreros, setPrevObreros] = useState(obreros);
  const [obrerosState, setObrerosState] = useState(obreros);
  const [activeId, setActiveId] = useState(null);

  // Re-sincroniza el estado local con la fuente de verdad del servidor cada
  // vez que cambian los props (tras crear/renombrar/borrar/mover), sin usar
  // un efecto — ver "Adjusting state when a prop changes" en la doc de React.
  if (obreros !== prevObreros) {
    setPrevObreros(obreros);
    setObrerosState(obreros);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    })
  );

  const obrerosByColumn = useMemo(() => {
    const map = new Map();
    map.set(WAREHOUSE_ID, []);
    obras.forEach((o) => map.set(o.id, []));
    obrerosState.forEach((obrero) => {
      const key = obrero.obra_actual_id || WAREHOUSE_ID;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(obrero);
    });
    return map;
  }, [obras, obrerosState]);

  const activeWorker = obrerosState.find((o) => o.id === activeId);

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const obreroId = active.id;
    const targetId = over.id === WAREHOUSE_ID ? null : over.id;
    const current = obrerosState.find((o) => o.id === obreroId);
    if (!current || current.obra_actual_id === targetId) return;

    setObrerosState((prev) =>
      prev.map((o) =>
        o.id === obreroId ? { ...o, obra_actual_id: targetId } : o
      )
    );

    moverObrero(obreroId, targetId).then((result) => {
      if (result?.error) {
        setObrerosState((prev) =>
          prev.map((o) =>
            o.id === obreroId
              ? { ...o, obra_actual_id: current.obra_actual_id }
              : o
          )
        );
      }
    });
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold">{t("board.title")}</h1>
          <span className="text-sm font-medium text-black/50">
            {today}
          </span>
        </div>
        <p className="text-sm text-black/60">{t("board.subtitle")}</p>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          <Column
            id={WAREHOUSE_ID}
            obra={null}
            obreros={obrerosByColumn.get(WAREHOUSE_ID) || []}
          />
          {obras.map((obra) => (
            <Column
              key={obra.id}
              id={obra.id}
              obra={obra}
              obreros={obrerosByColumn.get(obra.id) || []}
            />
          ))}
          <AddSiteColumn />
        </div>

        <DragOverlay>
          {activeWorker ? (
            <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium shadow-lg">
              {activeWorker.nombre}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
