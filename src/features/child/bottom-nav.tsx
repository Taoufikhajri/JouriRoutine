"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/child/today", icon: "🏠", label: "child.nav.today" },
  { href: "/child/adventure", icon: "🗺️", label: "child.nav.adventure" },
  { href: "/child/rewards", icon: "🏆", label: "child.nav.rewards" },
  { href: "/child/badges", icon: "⭐", label: "child.nav.badges" },
  { href: "/child/profile", icon: "👧", label: "child.nav.profile" },
] as const;

export function BottomNav({ pendingBadge }: { pendingBadge?: number }) {
  const path = usePathname();
  const t = useT();
  return (
    <nav aria-label={t("child.nav.main")} className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1 rounded-[1.75rem] bg-white/95 p-1.5 shadow-[0_-4px_30px_-10px_rgba(42,33,84,0.35)] backdrop-blur">
        {ITEMS.map((it) => {
          const active = path.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-2xl py-2 transition-colors",
                  active ? "bg-gradient-to-b from-[#efe9ff] to-[#e2d9ff] text-magic-dark" : "text-ink-soft hover:bg-ink/5",
                )}
              >
                <span className={cn("text-[1.7rem] leading-none transition-transform", active && "scale-110")} aria-hidden>
                  {it.icon}
                </span>
                <span className="font-display text-xs font-bold sm:text-sm">{t(it.label)}</span>
                {it.href === "/child/rewards" && !!pendingBadge && (
                  <span className="absolute end-2 top-1 flex size-5 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white" aria-label={t("child.nav.pending", { count: pendingBadge })}>
                    {pendingBadge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
