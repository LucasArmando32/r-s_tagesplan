"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { formatTodayLong } from "@/lib/date";
import CarIcon from "@/components/CarIcon";
import {
  moverObrero,
  crearObra,
  actualizarObra,
  actualizarNotas,
  borrarObra,
  crearObrero,
  renombrarObrero,
  borrarObrero,
} from "./actions";

// Cada cuánto se recalcula la fecha mostrada — para que cambie sola si el
// tablero queda abierto de un día para el otro, sin recargar la página.
const DATE_REFRESH_MS = 60_000;

const WAREHOUSE_ID = "almacen";
const FREE_ID = "frei";

const COLUMN_VARIANTS = {
  lager: "border-sky-200/80 bg-gradient-to-b from-sky-50 to-white",
  frei: "border-emerald-200/80 bg-gradient-to-b from-emerald-50 to-white",
  obra: "border-[var(--color-brand)]/15 bg-white",
};

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

  const isAuto = obrero.tipo === "auto";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => setEditing(true)}
      className={`flex cursor-grab touch-none select-none items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
        isAuto
          ? "border-slate-300 bg-slate-100 text-slate-700"
          : "border-black/10 bg-white"
      } ${isDragging ? "opacity-30" : ""}`}
    >
      {isAuto && (
        <CarIcon className="h-3.5 w-5 shrink-0 text-slate-500" />
      )}
      {obrero.nombre}
    </div>
  );
}

function AddWorkerRow({ obraId, libre, tipo = "obrero" }) {
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
      await crearObrero(trimmed, obraId, libre, tipo);
      setNombre("");
      inputRef.current?.focus();
    });
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="rounded-lg px-2 py-1.5 text-left text-sm text-black/50 hover:bg-black/10 hover:text-black/70"
      >
        + {tipo === "auto" ? t("board.new_car") : t("board.new_worker")}
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

function NotesField({ obra }) {
  const { t } = useI18n();
  const [value, setValue] = useState(obra.notas || "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(() => actualizarNotas(obra.id, value.trim() || null));
  }

  return (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      disabled={pending}
      rows={2}
      placeholder={t("board.notes_placeholder")}
      className="mb-2 w-full resize-none rounded-lg border border-black/10 bg-white/70 px-2 py-1.5 text-xs text-black/70 placeholder:text-black/35 focus:border-[var(--color-brand)] focus:bg-white focus:outline-none disabled:opacity-60"
    />
  );
}

function EditObraForm({ obra, onDone }) {
  const { t } = useI18n();
  const [nombre, setNombre] = useState(obra.nombre);
  const [direccion, setDireccion] = useState(obra.direccion || "");
  const [pending, startTransition] = useTransition();

  function save() {
    const trimmed = nombre.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await actualizarObra(obra.id, trimmed, direccion.trim() || null);
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
        className="flex h-12 w-72 shrink-0 items-center justify-center rounded-2xl border border-dashed border-[var(--color-brand)]/30 text-sm font-medium text-[var(--color-brand)]/70 transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-muted)] hover:text-[var(--color-brand)]"
      >
        + {t("board.new_site")}
      </button>
    );
  }

  return (
    <div className="w-72 shrink-0 rounded-2xl border border-[var(--color-brand)]/15 bg-white p-3 shadow-sm">
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

function Column({ id, obra, obreros, fixedTitle, variant, addTarget }) {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id });
  const [editing, setEditing] = useState(false);

  // El personal siempre va antes que los vehículos, para poder distinguirlos
  // de un vistazo al arrastrar — sort() es estable, así que dentro de cada
  // grupo se mantiene el orden alfabético que ya trae la consulta.
  const personas = obreros.filter((o) => o.tipo !== "auto");
  const vehiculos = obreros.filter((o) => o.tipo === "auto");

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-2xl border p-3 shadow-sm transition-colors ${
        isOver
          ? "border-[var(--color-brand)] bg-[var(--color-brand-light)]"
          : COLUMN_VARIANTS[variant]
      }`}
    >
      {!obra ? (
        <h2 className="mb-2 font-semibold text-black/80">{fixedTitle}</h2>
      ) : editing ? (
        <EditObraForm obra={obra} onDone={() => setEditing(false)} />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mb-1 w-full rounded-lg px-1 py-1 text-left hover:bg-black/5"
          >
            <h2 className="font-semibold text-[var(--color-brand-dark)]">
              {obra.nombre}
            </h2>
            {obra.direccion && (
              <p className="text-xs text-black/60">{obra.direccion}</p>
            )}
          </button>
          <NotesField obra={obra} />
        </>
      )}

      <div className="flex min-h-16 flex-1 flex-col gap-2">
        {obreros.length === 0 ? (
          <p className="rounded-lg border border-dashed border-black/15 bg-white/40 px-3 py-3 text-center text-xs text-black/40">
            {t("board.no_workers")}
          </p>
        ) : (
          <>
            {personas.map((obrero) => (
              <WorkerCard key={obrero.id} obrero={obrero} />
            ))}
            {vehiculos.length > 0 && personas.length > 0 && (
              <div className="my-0.5 border-t border-dashed border-black/10" />
            )}
            {vehiculos.map((obrero) => (
              <WorkerCard key={obrero.id} obrero={obrero} />
            ))}
          </>
        )}
      </div>

      <div className="mt-2 flex flex-col">
        <AddWorkerRow obraId={addTarget.obraId} libre={addTarget.libre} />
        <AddWorkerRow
          obraId={addTarget.obraId}
          libre={addTarget.libre}
          tipo="auto"
        />
      </div>
    </div>
  );
}

export default function Board({ obras, obreros }) {
  const { t, locale } = useI18n();
  const [today, setToday] = useState(() => formatTodayLong(locale));
  const [prevLocale, setPrevLocale] = useState(locale);

  // El idioma pudo cambiar (adjust state during render, sin efecto — ver
  // el mismo patrón más abajo para obrerosState); el intervalo de abajo
  // solo se suscribe al reloj, que es justamente lo que un efecto debe
  // hacer.
  if (locale !== prevLocale) {
    setPrevLocale(locale);
    setToday(formatTodayLong(locale));
  }

  useEffect(() => {
    const id = setInterval(() => setToday(formatTodayLong(locale)), DATE_REFRESH_MS);
    return () => clearInterval(id);
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

  function columnKeyFor(obrero) {
    if (obrero.obra_actual_id) return obrero.obra_actual_id;
    return obrero.libre ? FREE_ID : WAREHOUSE_ID;
  }

  const obrerosByColumn = useMemo(() => {
    const map = new Map();
    map.set(WAREHOUSE_ID, []);
    map.set(FREE_ID, []);
    obras.forEach((o) => map.set(o.id, []));
    obrerosState.forEach((obrero) => {
      const key = columnKeyFor(obrero);
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
    const targetObraId = over.id === WAREHOUSE_ID || over.id === FREE_ID ? null : over.id;
    const targetLibre = over.id === FREE_ID;

    const current = obrerosState.find((o) => o.id === obreroId);
    if (!current) return;
    if (
      current.obra_actual_id === targetObraId &&
      Boolean(current.libre) === targetLibre
    ) {
      return;
    }

    setObrerosState((prev) =>
      prev.map((o) =>
        o.id === obreroId
          ? { ...o, obra_actual_id: targetObraId, libre: targetLibre }
          : o
      )
    );

    moverObrero(obreroId, targetObraId, targetLibre).then((result) => {
      if (result?.error) {
        setObrerosState((prev) =>
          prev.map((o) =>
            o.id === obreroId
              ? {
                  ...o,
                  obra_actual_id: current.obra_actual_id,
                  libre: current.libre,
                }
              : o
          )
        );
      }
    });
  }

  return (
    <div>
      <div className="mb-5 border-b border-black/5 pb-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-brand-dark)] sm:text-3xl">
            {t("board.title")}
          </h1>
          <span className="text-sm font-medium text-black/50 sm:text-base">
            {today}
          </span>
        </div>
        <p className="mt-1 text-sm text-black/60">{t("board.subtitle")}</p>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex flex-wrap gap-3">
          <Column
            id={WAREHOUSE_ID}
            obra={null}
            fixedTitle={t("common.warehouse")}
            variant="lager"
            addTarget={{ obraId: null, libre: false }}
            obreros={obrerosByColumn.get(WAREHOUSE_ID) || []}
          />
          <Column
            id={FREE_ID}
            obra={null}
            fixedTitle={t("common.free")}
            variant="frei"
            addTarget={{ obraId: null, libre: true }}
            obreros={obrerosByColumn.get(FREE_ID) || []}
          />
          {obras.map((obra) => (
            <Column
              key={obra.id}
              id={obra.id}
              obra={obra}
              variant="obra"
              addTarget={{ obraId: obra.id, libre: false }}
              obreros={obrerosByColumn.get(obra.id) || []}
            />
          ))}
          <AddSiteColumn />
        </div>

        <DragOverlay>
          {activeWorker ? (
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-lg ${
                activeWorker.tipo === "auto"
                  ? "border-slate-300 bg-slate-100 text-slate-700"
                  : "border-black/10 bg-white"
              }`}
            >
              {activeWorker.tipo === "auto" && (
                <CarIcon className="h-3.5 w-5 shrink-0 text-slate-500" />
              )}
              {activeWorker.nombre}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
