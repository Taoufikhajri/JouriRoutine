import type { ReactNode } from "react";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/cn";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm font-semibold text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, sub, className }: { icon: string; label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-3xl bg-white p-4 shadow-soft", className)}>
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-soft">
        <span aria-hidden className="text-base">
          {icon}
        </span>
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
      {sub && <div className="text-xs font-semibold text-ink-soft">{sub}</div>}
    </div>
  );
}

export function Bar({ label, icon, ratio, detail }: { label: string; icon?: string; ratio: number | null; detail?: string }) {
  const pct = ratio === null ? null : Math.round(ratio * 100);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm font-bold">
        <span>
          {icon && <span aria-hidden>{icon} </span>}
          {label}
        </span>
        <span className="text-ink-soft">{detail ?? (pct === null ? "—" : `${pct}%`)}</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-label={label} aria-valuenow={pct ?? 0} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={cn("h-full rounded-full", pct === null ? "" : pct >= 80 ? "bg-mint" : pct >= 50 ? "bg-sun" : "bg-lilac")}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
    </div>
  );
}

export async function NoChild() {
  const t = await getT();
  return (
    <div className="rounded-3xl border-2 border-dashed border-ink/10 bg-white p-10 text-center">
      <p className="text-5xl" aria-hidden>
        👧
      </p>
      <p className="mt-2 font-display text-xl font-bold">{t("parent.noChildTitle")}</p>
      <a href="/parent/children" className="mt-3 inline-block rounded-xl bg-magic px-4 py-2 font-bold text-white">
        {t("parent.addChild")}
      </a>
    </div>
  );
}
