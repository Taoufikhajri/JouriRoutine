import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION } from "@/config/app";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { getSession } from "@/server/auth/session";
import { equippedLooks } from "@/server/queries/look";
import { KidLogin } from "@/features/auth/kid-login";
import { ParentLoginForm } from "@/features/auth/parent-login-form";

export async function generateMetadata() {
  return { title: (await getT())("auth.titleLogin") };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await getSession();
  if (session) redirect(session.user.role === "PARENT" ? "/parent" : "/child/today");

  const sp = await searchParams;
  const t = await getT();
  const code = (await cookies()).get(SESSION.familyCookieName)?.value;
  const family = code
    ? await db.family.findUnique({
        where: { loginCode: code },
        include: { children: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, avatarKey: true, loginMode: true } } },
      })
    : null;
  // Kids are the default on a device that already knows the family.
  const asKid = sp.as === "kid" || (sp.as !== "parent" && !!family);
  const looks = family ? await equippedLooks(family.children.map((c) => c.id)) : {};

  return (
    <div className="card-magic p-5 sm:p-7">
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-ink/5 p-1.5" role="tablist">
        <Link
          href="/login?as=kid"
          role="tab"
          aria-selected={asKid}
          className={cn("rounded-xl py-3 text-center font-display text-lg font-bold", asKid ? "bg-white shadow-soft" : "text-ink-soft")}
        >
          🧒 {t("auth.kidTab")}
        </Link>
        <Link
          href="/login?as=parent"
          role="tab"
          aria-selected={!asKid}
          className={cn("rounded-xl py-3 text-center font-display text-lg font-bold", !asKid ? "bg-white shadow-soft" : "text-ink-soft")}
        >
          👪 {t("auth.parentTab")}
        </Link>
      </div>

      {asKid ? (
        <KidLogin
          key={family?.loginCode ?? "none"}
          family={family ? { name: family.name, children: family.children.map((c) => ({ ...c, look: looks[c.id] ?? {} })) } : null}
        />
      ) : (
        <ParentLoginForm />
      )}
    </div>
  );
}
