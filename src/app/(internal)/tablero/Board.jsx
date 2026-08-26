"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
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
import { moverObrero, updateObraNotas } from "./actions";

const WAREHOUSE_ID = "almacen";

function WorkerCard({ obrero }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: obrero.id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab touch-none select-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium shadow-sm active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      {obrero.nombre}
    </div>
  );
}

function NotesEditor({ obra, notas, onSaved }) {
  const { t } = useI18n();
  const [value, setValue] = useState(notas || "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateObraNotas(obra.id, value.trim());
      onSaved?.(value.trim());
    });
  }

  return (
    <div className="mt-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        placeholder={t("board.notes_placeholder")}
        className="w-full rounded-lg border border-black/15 px-2 py-1.5 text-sm focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-light)]"
      />
      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="mt-1 rounded-lg bg-[var(--color-brand)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? t("common.loading") : t("common.save")}
      </button>
    </div>
  );
}

function SiteColumn({ id, title, address, notas, obreros, obraForNotes }) {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id });
  const [editingNotes, setEditingNotes] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(notas || "");

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border bg-black/[0.02] p-3 transition-colors ${
        isOver ? "border-[var(--color-brand)] bg-[var(--color-brand-light)]" : "border-black/10"
      }`}
    >
      <div className="mb-2">
        <h2 className="font-semibold">{title}</h2>
        {address && <p className="text-xs text-black/60">{address}</p>}
      </div>

      {obraForNotes &&
        (editingNotes ? (
          <NotesEditor
            obra={obraForNotes}
            notas={currentNotes}
            onSaved={(v) => {
              setCurrentNotes(v);
              setEditingNotes(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingNotes(true)}
            className="mb-2 rounded-lg bg-white px-2 py-1.5 text-left text-xs text-black/70 shadow-sm hover:bg-black/5"
          >
            {currentNotes || `+ ${t("board.edit_notes")}`}
          </button>
        ))}

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
    </div>
  );
}

export default function Board({ obras, obreros }) {
  const { t } = useI18n();
  const [obrerosState, setObrerosState] = useState(obreros);
  const [activeId, setActiveId] = useState(null);

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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("board.title")}</h1>
          <p className="text-sm text-black/60">{t("board.subtitle")}</p>
        </div>
        <Link
          href="/admin/obras"
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium text-black/70 hover:bg-black/5"
        >
          {t("board.manage_sites")}
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          <SiteColumn
            id={WAREHOUSE_ID}
            title={t("common.warehouse")}
            obreros={obrerosByColumn.get(WAREHOUSE_ID) || []}
          />
          {obras.map((obra) => (
            <SiteColumn
              key={obra.id}
              id={obra.id}
              title={obra.nombre}
              address={obra.direccion}
              notas={obra.notas}
              obraForNotes={obra}
              obreros={obrerosByColumn.get(obra.id) || []}
            />
          ))}
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
