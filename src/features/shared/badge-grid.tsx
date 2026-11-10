import { getT } from "@/i18n/server";
import { cn } from "@/lib/cn";
import type { AchievementProgress } from "@/server/services/achievements";

/** Collectible badge grid. Locked badges are faded with a progress bar; unlocked ones glow. */
export async function BadgeGrid({ items, compact }: { items: AchievementProgress[]; compact?: boolean }) {
  const t = await getT();
  return (
    <ul className={cn("grid gap-3", compact ? "grid-cols-3 sm:grid-cols-5 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3")}>
      {items.map(({ achievement: a, value, unlockedAt }) => {
        const unlocked = !!unlockedAt;
        const label = t.badge(a.key, a);
        return (
          <li
            key={a.id}
            className={cn(
              "flex flex-col items-center rounded-[1.75rem] border-[3px] p-3 text-center",
              unlocked ? "border-sun/60 bg-gradient-to-b from-white to-[#fff6d6] shadow-soft" : "border-white/70 bg-white/60",
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center rounded-full",
                compact ? "size-14 text-3xl" : "size-20 text-5xl",
                unlocked ? "animate-glow bg-gradient-to-br from-[#fff3b0] to-sun" : "bg-ink/5 opacity-50 grayscale",
              )}
              aria-hidden
            >
              {a.icon}
            </span>
            <p className={cn("mt-2 font-display font-extrabold leading-tight", compact ? "text-sm" : "text-lg")}>{label.title}</p>
            {!compact && <p className="mt-0.5 text-xs font-semibold text-ink-soft">{label.description}</p>}
            {unlocked ? (
              <p className="mt-1 text-xs font-bold text-mint-dark">✓ {t.date(unlockedAt, { month: "short", day: "numeric" })}</p>
            ) : (
              <div className="mt-2 w-full">
                <div className="h-2 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={value} aria-valuemax={a.threshold} aria-label={t("child.badges.progress", { name: label.title })}>
                  <div className="h-full rounded-full bg-lilac" style={{ width: `${(value / a.threshold) * 100}%` }} />
                </div>
                <p className="mt-0.5 text-[11px] font-bold text-ink-soft">
                  {value}/{a.threshold}
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
