import { getT } from "@/i18n/server";
import Link from "next/link";
import { MonthCalendar } from "@/features/shared/month-calendar";
import { Bar, NoChild, PageHeader, StatCard } from "@/features/parent/ui";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { addDays, parseDay, startOfMonth, startOfWeek, todayIn } from "@/lib/dates";
import { requireParent } from "@/server/auth/guards";
import { analyticsData } from "@/server/queries/parent";
import { selectedChild } from "@/server/queries/selected-child";

export async function generateMetadata() {
  return { title: (await getT())("parent.progress.meta") };
}

const RANGES = { today: "parent.progress.today", week: "parent.progress.week", month: "parent.progress.month" } as const;
type Range = keyof typeof RANGES;

const pct = (r: number | null) => (r === null ? "—" : `${Math.round(r * 100)}%`);

export default async function ProgressPage({ searchParams }: PageProps<"/parent/progress">) {
  const { family } = await requireParent();
  const t = await getT();
  const { child } = await selectedChild(family.id);
  if (!child) return <NoChild />;

  const sp = await searchParams;
  const range: Range = typeof sp.range === "string" && sp.range in RANGES ? (sp.range as Range) : "week";
  const today = todayIn(family.timezone);
  const from = range === "today" ? today : range === "week" ? startOfWeek(today) : startOfMonth(today);

  const monthStart = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? `${sp.month}-01` : startOfMonth(today);
  const monthEnd = addDays(startOfMonth(addDays(monthStart, 32)), -1);
  const day = typeof sp.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.day) ? sp.day : null;

  const [a, monthDays, dayDetail] = await Promise.all([
    analyticsData(child.id, from, today),
    db.dailyProgress.findMany({ where: { childId: child.id, date: { gte: monthStart, lte: monthEnd } } }),
    day ? db.taskCompletion.findMany({ where: { childId: child.id, date: day }, orderBy: { completedAt: "asc" } }) : Promise.resolve(null),
  ]);
  const dayProgress = day ? await db.dailyProgress.findUnique({ where: { childId_date: { childId: child.id, date: day } } }) : null;

  const q = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ range, month: monthStart.slice(0, 7), ...(day ? { day } : {}), ...extra });
    return `/parent/progress?${p}`;
  };
  const prevMonth = addDays(monthStart, -1).slice(0, 7);
  const nextMonth = addDays(monthEnd, 1).slice(0, 7);

  return (
    <div className="space-y-6">
      <PageHeader title={t("parent.progress.title", { name: child.name })} subtitle={t("parent.progress.subtitle")} />

      <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-soft sm:inline-flex" role="tablist" aria-label={t("parent.progress.period")}>
        {(Object.keys(RANGES) as Range[]).map((r) => (
          <Link
            key={r}
            href={q({ range: r })}
            role="tab"
            aria-selected={r === range}
            className={cn("flex-1 rounded-xl px-4 py-2 text-center text-sm font-bold", r === range ? "bg-magic text-white" : "text-ink-soft hover:bg-ink/5")}
            scroll={false}
          >
            {t(RANGES[r])}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon="✅" label={t("parent.progress.completion")} value={pct(a.completion)} sub={t("parent.progress.tracked", { count: a.trackedDays })} />
        <StatCard icon="⭐" label={t("parent.progress.perfectDays")} value={a.perfectDays} />
        <StatCard icon="🔥" label={t("parent.progress.goodDays")} value={a.goodDays} sub={t("parent.progress.goodDaysSub")} />
        <StatCard icon="📅" label={t("parent.progress.period")} value={t(RANGES[range])} sub={t("parent.progress.periodDays", { count: a.span })} />
      </div>

      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="mb-4 font-display text-lg font-extrabold">{t("parent.progress.habits")}</h2>
        {a.habits.length === 0 ? (
          <p className="text-sm font-semibold text-ink-soft">{t("parent.progress.noData")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {a.habits.map((h) => {
              const days = h.mode === "days" ? h.fullDays : h.anyDays;
              return (
                <Bar
                  key={h.key}
                  icon={h.icon}
                  label={t(`parent.habits.${h.id}`)}
                  ratio={h.mode === "ratio" ? h.ratio : days / h.scheduledDays}
                  detail={h.mode === "ratio" ? pct(h.ratio) : t("parent.progress.daysOf", { done: days, total: h.scheduledDays })}
                />
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">{t("parent.progress.calendar")}</h2>
            <div className="flex gap-1">
              <Link href={q({ month: prevMonth })} className="rounded-lg px-3 py-1 text-sm font-bold hover:bg-ink/5" aria-label={t("parent.progress.prevMonth")} scroll={false}>
                {t.dir === "rtl" ? "→" : "←"}
              </Link>
              {nextMonth <= today.slice(0, 7) && (
                <Link href={q({ month: nextMonth })} className="rounded-lg px-3 py-1 text-sm font-bold hover:bg-ink/5" aria-label={t("parent.progress.nextMonth")} scroll={false}>
                  {t.dir === "rtl" ? "←" : "→"}
                </Link>
              )}
            </div>
          </div>
          <MonthCalendar
            month={monthStart}
            today={today}
            selected={day ?? undefined}
            days={Object.fromEntries(monthDays.map((p) => [p.date, { isPerfect: p.isPerfect, isSuccess: p.isSuccess, completed: p.completedTasks, total: p.totalTasks }]))}
            hrefFor={(d) => q({ day: d })}
          />
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-soft" aria-live="polite">
          {day && dayDetail ? (
            <>
              <h2 className="font-display text-lg font-extrabold">
                {t.date(parseDay(day), { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" })}
              </h2>
              <p className="text-sm font-semibold text-ink-soft">
                {dayProgress
                  ? t("parent.progress.dayMissions", { done: dayProgress.completedTasks, total: dayProgress.totalTasks }) + (dayProgress.isPerfect ? t("parent.progress.perfectSuffix") : "")
                  : t("parent.progress.noMissions")}
              </p>
              <ul className="mt-3 space-y-1.5">
                {dayDetail.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <span aria-hidden>{c.taskIcon}</span>
                    <span className="flex-1 font-semibold">{c.taskTitle}</span>
                    <span className="text-xs text-ink-soft">{t.date(c.completedAt, { hour: "numeric", minute: "2-digit", timeZone: family.timezone })}</span>
                  </li>
                ))}
                {dayDetail.length === 0 && <li className="text-sm text-ink-soft">{t("child.tryTomorrow")}</li>}
              </ul>
            </>
          ) : (
            <p className="text-sm font-semibold text-ink-soft">{t("parent.progress.tapDay")}</p>
          )}
        </section>
      </div>
    </div>
  );
}
