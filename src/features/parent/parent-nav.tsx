"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { Award, BarChart3, Gift, LayoutDashboard, ListChecks, LogOut, Settings, Sparkles, Users } from "lucide-react";
import { Logo } from "@/components/brand/mascot";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/server/actions/auth";
import { openKidModeAction } from "@/server/actions/parent-family";
import { selectChildAction } from "@/server/actions/parent-nav";

const LINKS = [
  { href: "/parent", label: "parent.nav.dashboard", icon: LayoutDashboard, exact: true },
  { href: "/parent/children", label: "parent.nav.children", icon: Users },
  { href: "/parent/routines", label: "parent.nav.routines", icon: ListChecks },
  { href: "/parent/rewards", label: "parent.nav.rewards", icon: Gift },
  { href: "/parent/progress", label: "parent.nav.progress", icon: BarChart3 },
  { href: "/parent/achievements", label: "parent.nav.achievements", icon: Award },
  { href: "/parent/settings", label: "parent.nav.settings", icon: Settings },
] as const;

export function ParentNav({
  kids,
  selectedId,
  pendingRewards,
  displayName,
}: {
  kids: { id: string; name: string }[];
  selectedId: string | null;
  pendingRewards: number;
  displayName: string;
}) {
  const path = usePathname();
  const t = useT();
  const [pending, start] = useTransition();

  const links = LINKS.map((l) => {
    const active = "exact" in l && l.exact ? path === l.href : path.startsWith(l.href);
    const Icon = l.icon;
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
          active ? "bg-magic text-white" : "text-ink-soft hover:bg-ink/5 hover:text-ink",
        )}
      >
        <Icon className="size-4" aria-hidden />
        <span>{t(l.label)}</span>
        {l.href === "/parent/rewards" && pendingRewards > 0 && (
          <span className={cn("ms-auto rounded-full px-1.5 text-xs", active ? "bg-white/25" : "bg-coral text-white")} aria-label={t("parent.nav.pending", { count: pendingRewards })}>
            {pendingRewards}
          </span>
        )}
      </Link>
    );
  });

  const switcher = kids.length > 1 && (
    <label className="block">
      <span className="sr-only">{t("parent.nav.child")}</span>
      <select
        value={selectedId ?? ""}
        disabled={pending}
        onChange={(e) => start(() => selectChildAction(e.target.value))}
        className="h-10 w-full rounded-xl border-2 border-ink/10 bg-white px-3 text-sm font-bold"
      >
        {kids.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-4 border-r border-ink/5 bg-white p-4 lg:flex">
        <Logo className="text-base" />
        {switcher}
        <nav aria-label={t("parent.nav.label")} className="flex flex-col gap-1">
          {links}
        </nav>
        <div className="mt-auto space-y-2">
          <form action={openKidModeAction}>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-sun px-3 py-2.5 text-sm font-extrabold text-ink hover:bg-sun-dark">
              <Sparkles className="size-4" aria-hidden /> {t("parent.kidMode")}
            </button>
          </form>
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink-soft hover:bg-ink/5">
              <LogOut className="size-4" aria-hidden /> {t("common.logout")} · {displayName}
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <div className="sticky top-0 z-30 border-b border-ink/5 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-2">
          <Logo className="text-sm" />
          <div className="flex items-center gap-1">
            <form action={openKidModeAction}>
              <button type="submit" className="rounded-xl bg-sun px-3 py-2 text-xs font-extrabold" aria-label={t("parent.kidMode")}>
                {t("parent.kidModeShort")}
              </button>
            </form>
            <form action={logoutAction}>
              <button type="submit" className="rounded-xl p-2 text-ink-soft hover:bg-ink/5" aria-label={t("common.logout")}>
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
        {kids.length > 1 && <div className="px-4 pb-2">{switcher}</div>}
        <nav aria-label={t("parent.nav.label")} className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {links}
        </nav>
      </div>
    </>
  );
}
