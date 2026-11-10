import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-3xl border border-ink/5 bg-white p-5 shadow-soft", className)}>{children}</div>;
}

export function ProgressBar({
  value,
  className,
  barClassName,
  label,
}: {
  value: number; // 0..1
  className?: string;
  barClassName?: string;
  label: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn("h-3 w-full overflow-hidden rounded-full bg-ink/10", className)}
    >
      <div className={cn("h-full rounded-full bg-magic transition-[width] duration-700 ease-out", barClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", className)}>{children}</span>;
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-ink/10 p-8 text-center">
      <span className="text-5xl" aria-hidden>
        {icon}
      </span>
      <p className="font-display text-lg font-bold">{title}</p>
      {children && <div className="text-sm text-ink-soft">{children}</div>}
    </div>
  );
}
