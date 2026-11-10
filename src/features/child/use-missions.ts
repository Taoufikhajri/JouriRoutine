"use client";

import { useCallback, useState } from "react";
import { completeTaskAction, undoTaskAction } from "@/server/actions/child";
import type { TodayRoutine, TodayTask } from "@/server/queries/child";
import { useGame } from "./game/game-provider";
import type { GameEvent } from "./game/events";

/** Optimistic mission completion shared by the Today list and the Adventure map. */
export function useMissions(routines: TodayRoutine[]) {
  const { celebrate, play } = useGame();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fresh server data wins over optimistic guesses.
  const [source, setSource] = useState(routines);
  if (source !== routines) {
    setSource(routines);
    setOverrides({});
  }

  const isDone = useCallback((t: TodayTask) => overrides[t.id] ?? t.done, [overrides]);

  const complete = useCallback(
    async (task: TodayTask) => {
      if (busy) return;
      setBusy(task.id);
      setError(null);
      play("pop");
      setOverrides((o) => ({ ...o, [task.id]: true }));
      const res = await completeTaskAction(task.id);
      setBusy(null);
      if (!res.ok) {
        setOverrides((o) => ({ ...o, [task.id]: false }));
        setError(res.error);
        return;
      }
      const r = res.data;
      const events: GameEvent[] = [{ type: "task", xp: r.xpGained, coins: r.coinsGained, title: task.title, icon: task.icon }];
      if (r.perfectDay) events.push({ type: "perfect", bonus: r.perfectBonus });
      if (r.streakMilestone) events.push({ type: "streak", count: r.streakMilestone });
      for (const b of r.badges) events.push({ type: "badge", key: b.key, title: b.title, icon: b.icon, description: b.description });
      if (r.levelUp) events.push({ type: "levelUp", ...r.levelUp });
      celebrate(events);
    },
    [busy, celebrate, play],
  );

  const undo = useCallback(
    async (task: TodayTask) => {
      if (busy) return;
      setBusy(task.id);
      play("undo");
      setOverrides((o) => ({ ...o, [task.id]: false }));
      const res = await undoTaskAction(task.id);
      setBusy(null);
      if (!res.ok) {
        setOverrides((o) => ({ ...o, [task.id]: true }));
        setError(res.error);
      }
    },
    [busy, play],
  );

  const all = routines.flatMap((r) => r.tasks);
  const doneCount = all.filter(isDone).length;
  const next = all.find((t) => !isDone(t)) ?? null;

  return { isDone, complete, undo, busy, error, doneCount, total: all.length, next, all };
}
