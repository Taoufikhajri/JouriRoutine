"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { Alert } from "@/components/ui/form";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import type { DayPart } from "@/lib/dates";
import type { TodayRoutine } from "@/server/queries/child";
import { ChestPanel } from "./chest-panel";
import { TaskCard } from "./task-card";
import { useMissions } from "./use-missions";

interface Props {
  name: string;
  part: DayPart;
  routines: TodayRoutine[];
  chests: React.ComponentProps<typeof ChestPanel>;
  notices: { id: string; title: string }[];
}

function ProgressRing({ value }: { value: number }) {
  const t = useT();
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-28 shrink-0" role="img" aria-label={t("child.ringLabel", { pct: Math.round(value * 100) })}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="#ece8ff" strokeWidth="12" fill="none" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          stroke="url(#ring)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 0.9, delay: 0.4 }}
        />
        <defs>
          <linearGradient id="ring" x1="0" x2="1">
            <stop offset="0" stopColor="#5fd3a5" />
            <stop offset="1" stopColor="#7c5cff" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-extrabold">{Math.round(value * 100)}%</span>
    </div>
  );
}

export function TodayBoard({ name, part, routines, chests, notices }: Props) {
  const t = useT();
  const m = useMissions(routines);
  const ratio = m.total ? m.doneCount / m.total : 0;
  const scrolled = useRef(false);

  useEffect(() => {
    if (scrolled.current || !m.next) return;
    scrolled.current = true;
    const el = document.getElementById(`task-${m.next.id}`);
    if (el && m.doneCount > 0) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 500);
  }, [m.next, m.doneCount]);

  const cheer = ratio >= 1 ? t("child.allDone") : ratio >= 0.75 ? t("child.almostThere") : t("child.keepGoing");

  return (
    <div className="space-y-5">
      {notices.map((n) => (
        <Alert key={n.id} tone="success">
          {n.title}
        </Alert>
      ))}

      <section className="card-magic flex items-center gap-4 p-4 sm:p-6">
        <div className="min-w-0 flex-1">
          <h1 className={cn("font-display text-2xl font-extrabold leading-tight sm:text-3xl")}>
            {t(`child.greeting.${part}`, { name })} {part === "evening" ? "🌙" : "🌟"}
          </h1>
          <p className="mt-1 font-display text-lg font-bold text-ink-soft">{cheer}</p>
          <p className="mt-2 text-sm font-bold text-ink-soft">
            ✅ {m.doneCount} / {m.total}
          </p>
        </div>
        <div className="relative">
          <ProgressRing value={ratio} />
          <Mascot className="absolute -end-3 -top-5 size-12 animate-bob" mood={ratio >= 1 ? "wow" : "happy"} />
        </div>
      </section>

      <ChestPanel {...chests} />

      {m.error && <Alert>{m.error}</Alert>}

      <h2 className="px-1 font-display text-2xl font-extrabold text-ink drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">{t("child.todaysAdventure")}</h2>

      {routines.length === 0 && (
        <div className="card-magic p-6 text-center font-display text-xl font-bold">{t("child.map.noMissions")}</div>
      )}

      {routines.map((r) => (
        <RoutineSection key={r.id} routine={r} m={m} />
      ))}
    </div>
  );
}

function RoutineSection({ routine, m }: { routine: TodayRoutine; m: ReturnType<typeof useMissions> }) {
  const done = routine.tasks.filter(m.isDone).length;
  const complete = done === routine.tasks.length;
  const [open, setOpen] = useState(!complete);
  const [wasComplete, setWasComplete] = useState(complete);
  if (complete !== wasComplete) {
    // Fold a section away once it is finished.
    setWasComplete(complete);
    if (complete) setOpen(false);
  }

  return (
    <section aria-labelledby={`r-${routine.id}`} className="rounded-[2rem] bg-white/55 p-2 backdrop-blur-sm sm:p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-3xl px-2 py-2 text-start"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-3xl shadow-soft" aria-hidden>
          {routine.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`r-${routine.id}`} className="font-display text-xl font-extrabold">
            {routine.name}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-mint transition-[width] duration-700" style={{ width: `${(done / routine.tasks.length) * 100}%` }} />
            </div>
            <span className="text-sm font-extrabold text-ink-soft">
              {complete ? "🌟" : ""} {done}/{routine.tasks.length}
            </span>
          </div>
        </div>
        <ChevronDown className={cn("size-6 text-ink-soft transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <ol className="relative mt-2 space-y-4 ps-6 before:absolute before:bottom-4 before:start-2.5 before:top-4 before:border-l-4 before:border-dotted before:border-magic/30">
          {routine.tasks.map((task) => {
            const isDone = m.isDone(task);
            return (
              <li key={task.id} className="relative">
                <span
                  className={cn(
                    "absolute -start-[1.4rem] top-1/2 size-4 -translate-y-1/2 rounded-full border-[3px] border-white",
                    isDone ? "bg-mint" : m.next?.id === task.id ? "bg-sun" : "bg-lilac",
                  )}
                  aria-hidden
                />
                <TaskCard
                  task={task}
                  done={isDone}
                  isNext={m.next?.id === task.id}
                  busy={m.busy === task.id}
                  onComplete={() => m.complete(task)}
                  onUndo={() => m.undo(task)}
                />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
