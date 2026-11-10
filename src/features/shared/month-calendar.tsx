import Link from "next/link";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/cn";
import { addDays, parseDay, startOfMonth } from "@/lib/dates";

export interface CalendarDay {
  isPerfect: boolean;
  isSuccess: boolean;
  completed: number;
  total: number;
}

/**
 * Month grid. ⭐ = perfect day, ✅ = good day (counts for streak), small dot = some progress.
 * Never uses colour alone: each state also has its own symbol.
 */
export async function MonthCalendar({
  month, // any YYYY-MM-DD in the month
  today,
  days,
  selected,
  hrefFor,
}: {
  month: string;
  today: string;
  days: Record<string, CalendarDay>;
  selected?: string;
  hrefFor?: (day: string) => string;
}) {
  const t = await getT();
  const WEEK = [1, 2, 3, 4, 5, 6, 0].map((d) => t.messages.days[d]);
  const first = startOfMonth(month);
  const firstWd = (parseDay(first).getUTCDay() + 6) % 7; // Monday = 0
  const cells: (string | null)[] = Array.from({ length: firstWd }, () => null);
  for (let d = first; d.slice(0, 7) === first.slice(0, 7); d = addDays(d, 1)) cells.push(d);
  const label = t.date(parseDay(first), { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div>
      <p className="mb-2 font-display text-lg font-extrabold">{label}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-ink-soft">
        {WEEK.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const info = days[d];
          const symbol = info?.isPerfect ? "⭐" : info?.isSuccess ? "✅" : info && info.completed > 0 ? "•" : "";
          const state = t(info?.isPerfect ? "calendar.statePerfect" : info?.isSuccess ? "calendar.stateGood" : info?.completed ? "calendar.stateSome" : "calendar.stateNone");
          const content = (
            <>
              <span className="text-[11px] leading-none">{Number(d.slice(8))}</span>
              <span className="text-base leading-none" aria-hidden>
                {symbol}
              </span>
            </>
          );
          const cls = cn(
            "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border-2 text-ink",
            info?.isPerfect ? "border-sun/70 bg-[#fff6d6]" : info?.isSuccess ? "border-mint/50 bg-[#ecfbf3]" : "border-transparent bg-ink/[0.03]",
            d === today && "ring-2 ring-magic",
            d === selected && "border-magic bg-lilac/30",
            d > today && "opacity-40",
          );
          return hrefFor && d <= today ? (
            <Link key={d} href={hrefFor(d)} className={cls} aria-label={`${d}: ${state}`} scroll={false}>
              {content}
            </Link>
          ) : (
            <span key={d} className={cls} aria-label={`${d}: ${state}`}>
              {content}
            </span>
          );
        })}
      </div>
      <p className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-ink-soft">
        <span>{t("calendar.perfect")}</span>
        <span>{t("calendar.good")}</span>
        <span>{t("calendar.some")}</span>
      </p>
    </div>
  );
}
