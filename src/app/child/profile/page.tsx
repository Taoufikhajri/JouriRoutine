import { LEVELS, levelForXp } from "@/config/game";
import { AvatarStudio } from "@/features/avatar/avatar-studio";
import { MonthCalendar } from "@/features/shared/month-calendar";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { startOfMonth, todayIn } from "@/lib/dates";
import { logoutAction } from "@/server/actions/auth";
import { requireChild } from "@/server/auth/guards";
import { availableCoins } from "@/server/services/rewards";

export async function generateMetadata() {
  return { title: (await getT())("child.profile.title") };
}

export default async function ProfilePage() {
  const { child: c, family } = await requireChild();
  const today = todayIn(family.timezone);
  const t = await getT();
  const [child, items, owned, achievements, progress, quran, wallet] = await Promise.all([
    db.childProfile.findUniqueOrThrow({ where: { id: c.id } }),
    db.avatarItem.findMany({ orderBy: { sortOrder: "asc" } }),
    db.childAvatarItem.findMany({ where: { childId: c.id } }),
    db.achievement.findMany({ select: { key: true, title: true, description: true } }),
    db.dailyProgress.findMany({ where: { childId: c.id, date: { gte: startOfMonth(today), lte: today } } }),
    db.quranMemorization.findMany({ where: { childId: c.id }, orderBy: { sortOrder: "asc" } }),
    availableCoins(db, c.id),
  ]);
  const ownedMap = new Map(owned.map((o) => [o.itemId, o]));
  const badgeTitle = new Map(achievements.map((a) => [a.key, t.badge(a.key, a).title]));
  const lv = levelForXp(child.xp);

  return (
    <div className="space-y-5">
      <h1 className="px-1 font-display text-2xl font-extrabold">👧 {t("child.profile.title")}</h1>
      <AvatarStudio
        avatarKey={child.avatarKey}
        coins={wallet.available}
        items={items.map((i) => ({
          id: i.id,
          key: i.key,
          name: i.name,
          emoji: i.emoji,
          slot: i.slot,
          cost: i.cost,
          lockedBy: i.achievementKey ? (badgeTitle.get(i.achievementKey) ?? "⭐") : null,
          owned: ownedMap.has(i.id),
          equipped: ownedMap.get(i.id)?.equipped ?? false,
        }))}
      />

      <section className="card-magic p-4 sm:p-6">
        <h2 className="mb-3 font-display text-lg font-extrabold">🧭 {t("child.profile.levels")}</h2>
        <ol className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {LEVELS.map((l) => (
            <li
              key={l.level}
              className={cn(
                "flex w-24 shrink-0 flex-col items-center rounded-2xl border-[3px] p-2 text-center",
                l.level === lv.level ? "border-magic bg-lilac/20" : l.level < lv.level ? "border-mint/40 bg-[#ecfbf3]" : "border-ink/5 opacity-60",
              )}
            >
              <span className="text-3xl" aria-hidden>
                {l.level <= lv.level ? l.icon : "🔒"}
              </span>
              <span className="text-xs font-extrabold">{t("child.levelShort", { level: l.level })}</span>
              <span className="text-[11px] font-bold leading-tight text-ink-soft">{t.level(l.level)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm font-bold text-ink-soft">
          {t("child.profile.best", { count: child.longestStreak, xp: child.xp })}
        </p>
      </section>

      <section className="card-magic p-4 sm:p-6">
        <h2 className="mb-3 font-display text-lg font-extrabold">📅 {t("child.profile.calendar")}</h2>
        <MonthCalendar month={today} today={today} days={Object.fromEntries(progress.map((p) => [p.date, { isPerfect: p.isPerfect, isSuccess: p.isSuccess, completed: p.completedTasks, total: p.totalTasks }]))} />
      </section>

      {quran.length > 0 && (
        <section className="card-magic p-4 sm:p-6">
          <h2 className="mb-3 font-display text-lg font-extrabold">📖 {t("child.profile.quran")}</h2>
          <ul className="space-y-3">
            {quran.map((q) => (
              <li key={q.id}>
                <div className="flex justify-between font-display font-bold">
                  <span>{t("child.surah", { name: q.surah })}</span>
                  <span>{q.progress === 100 ? "🌟 100%" : `${q.progress}%`}</span>
                </div>
                <div className="mt-1 h-3.5 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={q.progress} aria-label={t("child.surah", { name: q.surah })}>
                  <div className="h-full rounded-full bg-gradient-to-r from-mint to-[#3fbf8f]" style={{ width: `${q.progress}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action={logoutAction} className="text-center">
        <button type="submit" className="rounded-2xl bg-white/80 px-5 py-3 font-display font-bold text-ink-soft shadow-soft">
          🔄 {t("child.profile.switchUser")}
        </button>
      </form>
    </div>
  );
}
