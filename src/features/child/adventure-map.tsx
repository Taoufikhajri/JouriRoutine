"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ADVENTURE_STAGES } from "@/config/game";
import { AvatarView, type EquippedLook } from "@/features/avatar/avatar-view";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import type { TodayRoutine, TodayTask } from "@/server/queries/child";
import { TaskCard } from "./task-card";
import { useMissions } from "./use-missions";

type Node =
  | { kind: "stage"; stage: (typeof ADVENTURE_STAGES)[number]; index: number; x: number; y: number; unlocked: boolean }
  | { kind: "task"; task: TodayTask; order: number; x: number; y: number };

const STAGE_GAP = 150;
const TASK_GAP = 96;

export function AdventureMap({ routines, avatarKey, look }: { routines: TodayRoutine[]; avatarKey: string; look: EquippedLook }) {
  const t = useT();
  const m = useMissions(routines);
  const [open, setOpen] = useState<TodayTask | null>(null);

  const { nodes, height } = useMemo(() => {
    const tasks = routines.flatMap((r) => r.tasks);
    const stages = ADVENTURE_STAGES;
    const per = Math.max(1, Math.ceil(tasks.length / (stages.length - 1)));
    const out: Node[] = [];
    let y = 70;
    let zig = 0;
    stages.forEach((stage, si) => {
      const slice = si < stages.length - 1 ? tasks.slice(si * per, (si + 1) * per) : [];
      const before = tasks.slice(0, si * per);
      out.push({ kind: "stage", stage, index: si, x: si % 2 === 0 ? 30 : 70, y, unlocked: before.every(m.isDone) });
      y += STAGE_GAP * 0.75;
      slice.forEach((task, i) => {
        out.push({ kind: "task", task, order: si * per + i, x: Math.round((50 + 28 * Math.sin(zig * 1.1)) * 100) / 100, y });
        zig += 1;
        y += TASK_GAP;
      });
      y += STAGE_GAP * 0.25;
    });
    return { nodes: out, height: y + 40 };
  }, [routines, m.isDone]);

  // The avatar stands on the last finished mission (or at home).
  const taskNodes = nodes.filter((n): n is Extract<Node, { kind: "task" }> => n.kind === "task");
  const lastDoneIdx = taskNodes.reduce((acc, n, i) => (m.isDone(n.task) ? i : acc), -1);
  const here = lastDoneIdx >= 0 ? taskNodes[lastDoneIdx] : nodes[0];
  const reachedStage = [...nodes].reverse().find((n) => n.kind === "stage" && n.unlocked && n.y <= (here?.y ?? 0) + 1);

  const pathD = useMemo(() => {
    if (nodes.length < 2) return "";
    return nodes
      .map((n, i) => {
        if (i === 0) return `M ${n.x} ${n.y}`;
        const p = nodes[i - 1];
        const my = (p.y + n.y) / 2;
        return `C ${p.x} ${my}, ${n.x} ${my}, ${n.x} ${n.y}`;
      })
      .join(" ");
  }, [nodes]);

  useEffect(() => {
    if (!here) return;
    const id = setTimeout(() => window.scrollTo({ top: Math.max(0, here.y - 260), behavior: "smooth" }), 400);
    return () => clearTimeout(id);
  }, [here]);

  if (taskNodes.length === 0) {
    return <div className="card-magic p-8 text-center font-display text-xl font-bold">{t("child.map.noMissions")}</div>;
  }

  return (
    <div>
      <div className="card-magic mb-4 flex items-center justify-between gap-3 p-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold">🗺️ {t("child.map.title")}</h1>
          {reachedStage?.kind === "stage" && (
            <p className="font-display font-bold text-magic-dark">{t("child.map.reached", { place: `${reachedStage.stage.icon} ${t.stage(reachedStage.stage.key, reachedStage.stage.name)}` })}</p>
          )}
        </div>
        <span className="rounded-2xl bg-mint/20 px-3 py-2 font-display text-lg font-extrabold">
          {m.doneCount}/{m.total}
        </span>
      </div>

      <div className="relative mx-auto max-w-xl" style={{ height }}>
        <svg className="absolute inset-0 size-full" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden>
          <path d={pathD} fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity=".85" />
          <path
            d={pathD}
            fill="none"
            stroke="#c9b8ff"
            strokeWidth="5"
            strokeDasharray="2 12"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {nodes.map((n) =>
          n.kind === "stage" ? (
            <div
              key={n.stage.key}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${n.x}%`, top: n.y }}
            >
              <div
                className={cn(
                  "flex flex-col items-center rounded-[2rem] border-4 border-white px-4 py-2 shadow-soft transition",
                  !n.unlocked && "opacity-60 grayscale",
                )}
                style={{ background: n.stage.color }}
              >
                <span className="text-5xl drop-shadow" aria-hidden>
                  {n.unlocked ? n.stage.icon : "☁️"}
                </span>
                <span className="whitespace-nowrap font-display text-sm font-extrabold">{t.stage(n.stage.key, n.stage.name)}</span>
              </div>
            </div>
          ) : (
            <button
              key={n.task.id}
              type="button"
              onClick={() => setOpen(n.task)}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${n.x}%`, top: n.y }}
              aria-label={m.isDone(n.task) ? `${n.task.title} ${t("child.doneSuffix")}` : n.task.title}
            >
              <span
                className={cn(
                  "flex size-16 items-center justify-center rounded-full border-4 text-3xl shadow-soft transition-transform hover:scale-110",
                  m.isDone(n.task)
                    ? "border-sun bg-gradient-to-br from-[#fff3b0] to-sun"
                    : m.next?.id === n.task.id
                      ? "animate-glow border-white bg-white"
                      : "border-white bg-white/85",
                )}
              >
                {m.isDone(n.task) ? "⭐" : n.task.icon}
              </span>
              <span className="mt-1 block max-w-28 truncate rounded-full bg-white/85 px-2 text-xs font-bold">{n.task.title}</span>
            </button>
          ),
        )}

        {here && (
          <motion.div
            className="pointer-events-none absolute z-10"
            initial={false}
            animate={{ left: `${here.x}%`, top: here.y - 62 }}
            transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.3 }}
            style={{ x: "-50%" }}
          >
            <div className="flex flex-col items-center">
              <span className="mb-1 whitespace-nowrap rounded-full bg-magic px-2 py-0.5 text-[11px] font-extrabold text-white shadow">
                {t("child.map.youAreHere")}
              </span>
              <div className="animate-bob">
                <AvatarView avatarKey={avatarKey} look={look} size="sm" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""}>
        {open && (
          <TaskCard
            task={open}
            done={m.isDone(open)}
            isNext={false}
            busy={m.busy === open.id}
            onComplete={async () => {
              const task = open;
              setOpen(null);
              await m.complete(task);
            }}
            onUndo={() => m.undo(open)}
          />
        )}
      </Modal>
    </div>
  );
}
