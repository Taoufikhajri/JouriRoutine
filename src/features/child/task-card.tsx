"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import type { TodayTask } from "@/server/queries/child";

export function TaskCard({
  task,
  done,
  isNext,
  busy,
  onComplete,
  onUndo,
}: {
  task: TodayTask;
  done: boolean;
  isNext: boolean;
  busy: boolean;
  onComplete: () => void;
  onUndo: () => void;
}) {
  const t = useT();
  const time = t.time(task.time);
  return (
    <motion.article
      layout
      id={`task-${task.id}`}
      className={cn(
        "relative flex items-center gap-3 rounded-[1.75rem] border-[3px] p-3 transition-colors sm:gap-4 sm:p-4",
        done ? "border-mint/60 bg-[#ecfbf3]" : "border-white bg-white/95 shadow-soft",
        isNext && !done && "animate-glow border-sun",
      )}
      aria-label={done ? `${task.title} ${t("child.doneSuffix")}` : task.title}
    >
      {isNext && !done && (
        <span className="absolute -top-3 start-5 rounded-full bg-sun px-3 py-0.5 font-display text-xs font-extrabold text-ink shadow">
          ✨ {t("child.nextMission")}
        </span>
      )}
      <div
        className={cn(
          "relative flex size-16 shrink-0 items-center justify-center rounded-3xl text-4xl sm:size-20 sm:text-5xl",
          done ? "bg-mint/25" : "bg-gradient-to-br from-[#f3efff] to-[#e4dcff]",
        )}
        aria-hidden
      >
        <span className={cn(done && "opacity-60")}>{task.icon}</span>
        {done && (
          <motion.span
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -bottom-1 -end-1 flex size-8 items-center justify-center rounded-full border-[3px] border-white bg-mint text-white"
          >
            <Check className="size-5" strokeWidth={4} />
          </motion.span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className={cn("font-display text-lg font-bold leading-tight sm:text-xl", done && "text-ink-soft")}>{task.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-bold sm:text-sm">
          {time && <span className="rounded-full bg-ink/5 px-2 py-0.5 text-ink-soft">🕖 {time}</span>}
          <span className="rounded-full bg-sun/25 px-2 py-0.5">⭐ +{task.xp}</span>
          {task.coins > 0 && <span className="rounded-full bg-[#fff1b8] px-2 py-0.5">🪙 +{task.coins}</span>}
          {!task.isRequired && <span className="rounded-full bg-lilac/30 px-2 py-0.5 text-magic-dark">{t("common.bonus")}</span>}
        </div>
        {task.description && !done && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{task.description}</p>}
        {done && (
          <button type="button" onClick={onUndo} disabled={busy} className="mt-1 text-xs font-bold text-ink-soft underline underline-offset-2">
            ↩ {t("child.undo")}
          </button>
        )}
      </div>

      {!done && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onComplete}
          disabled={busy}
          className="btn-pop flex h-16 min-w-[5.5rem] shrink-0 flex-col items-center justify-center rounded-3xl bg-mint px-3 font-display text-lg font-extrabold text-white disabled:opacity-60 sm:h-20 sm:min-w-28 sm:text-xl"
          aria-label={`${t("child.done")} ${task.title}`}
        >
          <span>{t("child.done")}</span>
          <span aria-hidden>✅</span>
        </motion.button>
      )}
    </motion.article>
  );
}
