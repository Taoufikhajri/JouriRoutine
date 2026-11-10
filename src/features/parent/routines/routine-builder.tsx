"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Copy, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PRAYERS } from "@/config/game";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import {
  addPrayerAction,
  applyTemplateAction,
  deleteRoutineAction,
  deleteTaskAction,
  duplicateRoutineAction,
  moveRoutineAction,
  reorderTasksAction,
  toggleRoutineAction,
  toggleTaskAction,
  updatePrayerTaskAction,
} from "@/server/actions/parent-routines";
import { RoutineEditor, TaskEditor } from "./editors";
import { Toggle } from "./fields";
import type { BuilderRoutine, BuilderTask } from "./types";

interface TemplateInfo {
  key: string;
  name: string;
  icon: string;
  description: string;
}

type Editing =
  | { kind: "routine"; routine?: BuilderRoutine }
  | { kind: "task"; routineId: string; task?: BuilderTask }
  | { kind: "templates" }
  | null;

export function RoutineBuilder({ childId, childName, routines, templates }: { childId: string; childName: string; routines: BuilderRoutine[]; templates: TemplateInfo[] }) {
  const t = useT();
  const [editing, setEditing] = useState<Editing>(null);
  const close = () => setEditing(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setEditing({ kind: "routine" })}>
          <Plus className="size-4" /> {t("parent.routines.newRoutine")}
        </Button>
        <Button variant="outline" onClick={() => setEditing({ kind: "templates" })}>
          {t("parent.routines.fromTemplate")}
        </Button>
      </div>

      <PrayerPanel routines={routines} />

      {routines.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-ink/10 bg-white p-8 text-center font-semibold text-ink-soft">
          {t("parent.routines.empty", { name: childName })}
        </div>
      )}

      {routines.map((r, i) => (
        <RoutineCard
          key={r.id}
          routine={r}
          first={i === 0}
          last={i === routines.length - 1}
          onEdit={() => setEditing({ kind: "routine", routine: r })}
          onAddTask={() => setEditing({ kind: "task", routineId: r.id })}
          onEditTask={(task) => setEditing({ kind: "task", routineId: r.id, task })}
        />
      ))}

      {editing?.kind === "routine" && <RoutineEditor open onClose={close} childId={childId} routine={editing.routine} />}
      {editing?.kind === "task" && <TaskEditor open onClose={close} routineId={editing.routineId} task={editing.task} />}
      {editing?.kind === "templates" && <TemplatePicker childId={childId} templates={templates} onClose={close} />}
    </div>
  );
}

function RoutineCard({
  routine,
  first,
  last,
  onEdit,
  onAddTask,
  onEditTask,
}: {
  routine: BuilderRoutine;
  first: boolean;
  last: boolean;
  onEdit: () => void;
  onAddTask: () => void;
  onEditTask: (t: BuilderTask) => void;
}) {
  const t = useT();
  const [pending, start] = useTransition();
  const [tasks, setTasks] = useState(routine.tasks);
  const [source, setSource] = useState(routine.tasks);
  if (source !== routine.tasks) {
    setSource(routine.tasks);
    setTasks(routine.tasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = tasks.findIndex((t) => t.id === e.active.id);
    const to = tasks.findIndex((t) => t.id === e.over!.id);
    const next = arrayMove(tasks, from, to);
    setTasks(next);
    start(() => reorderTasksAction(routine.id, next.map((t) => t.id)));
  };

  return (
    <section className={cn("rounded-3xl bg-white shadow-soft", !routine.isActive && "opacity-70")} aria-labelledby={`rt-${routine.id}`}>
      <header className="flex flex-wrap items-center gap-3 border-b border-ink/5 p-4">
        <span className="text-3xl" aria-hidden>
          {routine.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`rt-${routine.id}`} className="font-display text-xl font-extrabold">
            {routine.name}
          </h2>
          <p className="text-xs font-semibold text-ink-soft">
            {t("parent.routines.summary", { category: t.category(routine.category), days: t.mask(routine.daysMask), count: tasks.length })}
            {!routine.isActive && ` · ${t("parent.routines.off")}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Toggle checked={routine.isActive} onChange={() => start(() => toggleRoutineAction(routine.id))} label={t("parent.routines.active", { name: routine.name })} disabled={pending} />
          <IconBtn label={t("parent.routines.moveUp")} disabled={first || pending} onClick={() => start(() => moveRoutineAction(routine.id, "up"))}>
            <ArrowUp className="size-4" />
          </IconBtn>
          <IconBtn label={t("parent.routines.moveDown")} disabled={last || pending} onClick={() => start(() => moveRoutineAction(routine.id, "down"))}>
            <ArrowDown className="size-4" />
          </IconBtn>
          <IconBtn label={t("parent.routines.duplicate")} disabled={pending} onClick={() => start(() => duplicateRoutineAction(routine.id))}>
            <Copy className="size-4" />
          </IconBtn>
          <IconBtn label={t("parent.routines.editRoutine")} onClick={onEdit}>
            <Pencil className="size-4" />
          </IconBtn>
          <IconBtn
            label={t("parent.routines.deleteRoutine")}
            disabled={pending}
            onClick={() => confirm(t("parent.routines.confirmDeleteRoutine", { name: routine.name, count: tasks.length })) && start(() => deleteRoutineAction(routine.id))}
          >
            <Trash2 className="size-4 text-coral" />
          </IconBtn>
        </div>
      </header>

      <DndContext id={`dnd-${routine.id}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-ink/5">
            {tasks.map((t) => (
              <SortableTask key={t.id} task={t} onEdit={() => onEditTask(t)} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="p-3">
        <Button size="sm" variant="ghost" onClick={onAddTask}>
          <Plus className="size-4" /> {t("parent.routines.addMission")}
        </Button>
      </div>
    </section>
  );
}

function SortableTask({ task, onEdit }: { task: BuilderTask; onEdit: () => void }) {
  const t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const [pending, start] = useTransition();
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-2 bg-white px-2 py-2.5 sm:px-4", isDragging && "relative z-10 rounded-2xl shadow-xl", !task.isActive && "opacity-50")}
    >
      <button type="button" className="cursor-grab touch-none rounded-lg p-2 text-ink-soft hover:bg-ink/5 active:cursor-grabbing" aria-label={t("parent.routines.reorder", { name: task.title })} {...attributes} {...listeners}>
        <GripVertical className="size-5" />
      </button>
      <span className="w-8 text-center text-2xl" aria-hidden>
        {task.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{task.title}</p>
        <p className="flex flex-wrap gap-x-2 text-xs font-semibold text-ink-soft">
          {task.time && <span>🕖 {t.time(task.time)}</span>}
          <span>⭐ {task.xp} {t("common.xp")}</span>
          <span>🪙 {task.coins}</span>
          <span>{task.isRequired ? t("common.required") : t("common.bonus")}</span>
          <span>{t.mask(task.daysMask)}</span>
        </p>
      </div>
      <Toggle checked={task.isActive} onChange={() => start(() => toggleTaskAction(task.id))} label={t("parent.routines.active", { name: task.title })} disabled={pending} />
      <IconBtn label={t("parent.routines.editTask", { name: task.title })} onClick={onEdit}>
        <Pencil className="size-4" />
      </IconBtn>
      <IconBtn
        label={t("parent.routines.deleteTask", { name: task.title })}
        disabled={pending}
        onClick={() => confirm(t("parent.routines.confirmDeleteTask", { name: task.title })) && start(() => deleteTaskAction(task.id))}
      >
        <Trash2 className="size-4 text-coral" />
      </IconBtn>
    </li>
  );
}

function IconBtn({ label, children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className="rounded-lg p-2 text-ink-soft hover:bg-ink/5 disabled:opacity-30" {...p}>
      {children}
    </button>
  );
}

/** Quick overview of the 5 daily prayers across routines. */
function PrayerPanel({ routines }: { routines: BuilderRoutine[] }) {
  const t = useT();
  const [pending, start] = useTransition();
  const [addTo, setAddTo] = useState(routines[0]?.id ?? "");
  const prayerTasks = routines.flatMap((r) => r.tasks.filter((x) => x.kind === "PRAYER" && x.prayerName).map((x) => ({ ...x, routineName: r.name })));

  return (
    <section className="rounded-3xl bg-gradient-to-br from-[#ecfbf3] to-white p-4 shadow-soft" aria-labelledby="prayers-h">
      <h2 id="prayers-h" className="font-display text-lg font-extrabold">
        {t("parent.routines.prayersTitle")}
      </h2>
      <p className="text-xs font-semibold text-ink-soft">{t("parent.routines.prayersHint")}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PRAYERS.map((p) => {
          const items = prayerTasks.filter((pt) => pt.prayerName === p.name);
          const label = t.dyn(`prayers.${p.name}`, p.label);
          return (
            <li key={p.name} className="rounded-2xl bg-white p-3">
              <p className="font-bold">{label}</p>
              {items.length ? (
                items.map((pt) => (
                  <div key={pt.id} className="mt-1 flex items-center gap-2">
                    <input
                      type="time"
                      defaultValue={pt.time ?? ""}
                      aria-label={t("parent.routines.prayerTimeIn", { prayer: label, routine: pt.routineName })}
                      onBlur={(e) => e.target.value !== (pt.time ?? "") && start(() => updatePrayerTaskAction(pt.id, { time: e.target.value }))}
                      className="h-9 rounded-lg border-2 border-ink/10 px-2 text-sm"
                    />
                    <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">{pt.routineName}</span>
                    <Toggle
                      checked={pt.isActive}
                      label={t("parent.routines.prayerIn", { prayer: label, routine: pt.routineName })}
                      disabled={pending}
                      onChange={() => start(() => updatePrayerTaskAction(pt.id, { isActive: !pt.isActive }))}
                    />
                  </div>
                ))
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <select value={addTo} onChange={(e) => setAddTo(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border-2 border-ink/10 px-2 text-sm" aria-label={t("parent.routines.routineFor", { prayer: label })}>
                    {routines.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="outline" disabled={!addTo || pending} onClick={() => start(() => addPrayerAction(addTo, p.name))}>
                    {t("common.add")}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TemplatePicker({ childId, templates, onClose }: { childId: string; templates: TemplateInfo[]; onClose: () => void }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <Modal open onClose={onClose} title={t("parent.routines.templatesTitle")}>
      <ul className="space-y-2">
        {templates.map((tpl) => (
          <li key={tpl.key} className="flex items-center gap-3 rounded-2xl border-2 border-ink/5 p-3">
            <span className="text-3xl" aria-hidden>
              {tpl.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{t.dyn(`templates.${tpl.key}.name`, tpl.name)}</p>
              <p className="text-xs text-ink-soft">{t.dyn(`templates.${tpl.key}.description`, tpl.description)}</p>
            </div>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await applyTemplateAction(childId, tpl.key);
                  onClose();
                })
              }
            >
              {t("common.add")}
            </Button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
