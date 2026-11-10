import { getT } from "@/i18n/server";
import Link from "next/link";
import { levelForXp } from "@/config/game";
import { AvatarView } from "@/features/avatar/avatar-view";
import { ApprovalList } from "@/features/parent/approval-list";
import { Bar, NoChild, PageHeader, StatCard } from "@/features/parent/ui";
import type { Translator } from "@/i18n";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { parseDay } from "@/lib/dates";
import { markNotificationsReadAction } from "@/server/actions/parent-family";
import { requireParent } from "@/server/auth/guards";
import { equippedLook } from "@/server/queries/look";
import { dashboardData } from "@/server/queries/parent";
import { selectedChild } from "@/server/queries/selected-child";

export async function generateMetadata() {
  return { title: (await getT())("parent.dashboard.meta") };
}

function ago(d: Date, t: Translator) {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return t("parent.ago.now");
  if (mins < 60) return t("parent.ago.minutes", { count: mins });
  const h = Math.round(mins / 60);
  if (h < 24) return t("parent.ago.hours", { count: h });
  return t.date(d);
}

export default async function ParentDashboard() {
  const { family } = await requireParent();
  const t = await getT();
  const { child } = await selectedChild(family.id);
  if (!child) return <NoChild />;

  const [d, look, notes] = await Promise.all([
    dashboardData(child.id, family.timezone),
    equippedLook(child.id),
    db.notification.findMany({ where: { familyId: family.id, childId: null, readAt: null }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const lv = levelForXp(d.child.xp);
  const pct = d.today.totalTasks ? Math.round((d.today.completedTasks / d.today.totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title={t("parent.dashboard.title", { name: child.name })} subtitle={t.date(parseDay(d.date), { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })} />

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-3xl bg-white p-5 shadow-soft xl:col-span-2" aria-labelledby="today-h">
          <div className="flex flex-wrap items-center gap-5">
            <AvatarView avatarKey={d.child.avatarKey} look={look} size="md" />
            <div className="flex-1">
              <h2 id="today-h" className="text-sm font-bold uppercase tracking-wide text-ink-soft">
                {t("parent.dashboard.todayProgress")}
              </h2>
              <p className="font-display text-4xl font-extrabold">
                {d.today.completedTasks} / {d.today.totalTasks} <span className="text-xl text-ink-soft">{t("parent.dashboard.tasks", { pct })}</span>
              </p>
              <p className="text-sm font-semibold text-ink-soft">
                {t("parent.dashboard.required", { done: d.today.requiredCompleted, total: d.today.requiredTasks })}
                {d.today.isPerfect && t("parent.dashboard.perfect")}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {d.categories.map((c) => (
              <Bar key={c.key} icon={c.icon} label={t.category(c.key)} ratio={c.total ? c.completed / c.total : null} detail={`${c.completed}/${c.total}`} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-soft" aria-labelledby="week-h">
          <h2 id="week-h" className="text-sm font-bold uppercase tracking-wide text-ink-soft">
            {t("parent.dashboard.last7")}
          </h2>
          <div className="mt-3 flex h-36 items-end justify-between gap-2">
            {d.week.map((w) => (
              <div key={w.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs" aria-hidden>
                  {w.isPerfect ? "⭐" : w.isSuccess ? "✅" : ""}
                </span>
                <div className="flex h-24 w-full items-end overflow-hidden rounded-lg bg-ink/5">
                  <div
                    className={cn("w-full rounded-lg", w.isPerfect ? "bg-sun" : w.isSuccess ? "bg-mint" : "bg-lilac")}
                    style={{ height: `${Math.max(4, w.ratio * 100)}%` }}
                    title={`${Math.round(w.ratio * 100)}%`}
                  />
                </div>
                <span className="text-[11px] font-bold text-ink-soft">{t.date(parseDay(w.date), { weekday: "narrow", timeZone: "UTC" })}</span>
              </div>
            ))}
          </div>
          <p className="sr-only">{d.week.map((w) => `${w.date}: ${Math.round(w.ratio * 100)}%`).join(", ")}</p>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon="🔥" label={t("parent.dashboard.streak")} value={t("parent.dashboard.days", { count: d.streak })} sub={t("parent.dashboard.best", { count: d.child.longestStreak })} />
        <StatCard icon={lv.icon} label={t("parent.dashboard.level")} value={t("child.levelShort", { level: lv.level })} sub={t.level(lv.level)} />
        <StatCard
          icon="⭐"
          label={t("parent.dashboard.xp")}
          value={d.child.xp}
          sub={lv.next ? t("parent.dashboard.toNext", { count: lv.nextXp - d.child.xp }) : t("parent.dashboard.maxLevel")}
        />
        <StatCard
          icon="🪙"
          label={t("parent.dashboard.coins")}
          value={d.child.coins}
          sub={d.lastCompletion ? t("parent.dashboard.lastActivity", { ago: ago(d.lastCompletion.completedAt, t) }) : t("parent.dashboard.noActivity")}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">{t("parent.dashboard.rewardRequests")}</h2>
            <Link href="/parent/rewards" className="text-sm font-bold text-magic-dark hover:underline">
              {t("parent.dashboard.manage")} {t.dir === "rtl" ? "←" : "→"}
            </Link>
          </div>
          <ApprovalList
            items={d.pending.map((p) => ({
              id: p.id,
              title: p.rewardTitle,
              icon: p.rewardIcon,
              cost: p.cost,
              childName: child.name,
              childCoins: d.child.coins,
              requestedAt: p.requestedAt.toISOString(),
            }))}
          />
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg font-extrabold">{t("parent.dashboard.recentAchievements")}</h2>
          {d.recentBadges.length ? (
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {d.recentBadges.map((b) => (
                <li key={b.id} className="flex items-center gap-2 rounded-2xl bg-[#fff8e1] p-2">
                  <span className="text-2xl" aria-hidden>
                    {b.achievement.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{t.badge(b.achievement.key, b.achievement).title}</span>
                    <span className="block text-[11px] font-semibold text-ink-soft">{t.date(b.unlockedAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm font-semibold text-ink-soft">{t("parent.dashboard.noBadges", { name: child.name })}</p>
          )}
        </section>
      </div>

      {notes.length > 0 && (
        <section className="rounded-3xl bg-white p-5 shadow-soft" aria-labelledby="notes-h">
          <div className="flex items-center justify-between">
            <h2 id="notes-h" className="font-display text-lg font-extrabold">
              {t("parent.dashboard.updates")}
            </h2>
            <form action={markNotificationsReadAction}>
              <button type="submit" className="text-sm font-bold text-magic-dark hover:underline">
                {t("parent.dashboard.markRead")}
              </button>
            </form>
          </div>
          <ul className="mt-2 space-y-1.5">
            {notes.map((n) => (
              <li key={n.id} className="flex justify-between gap-3 text-sm">
                <span className="font-semibold">{n.title}</span>
                <span className="shrink-0 text-xs text-ink-soft">{ago(n.createdAt, t)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
