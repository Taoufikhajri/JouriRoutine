"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SECURITY, SESSION } from "@/config/app";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/i18n";
import { getLocale, getT } from "@/i18n/server";
import { db } from "@/lib/db";
import { safeTz } from "@/lib/dates";
import { emailSchema, fieldErrors, formToObject, passwordSchema, type ActionState } from "@/lib/validation";
import { hashPassword, verifyWithLockout } from "@/server/auth/password";
import { createSession, destroySession, getSession, hashToken } from "@/server/auth/session";
import { sendPasswordResetEmail } from "@/server/mailer";
import { syncCatalogs, uniqueFamilyCode } from "@/server/services/family";

const familyCookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

/** Keep the signed-out pages (login, PIN pad) in the family's language. */
async function rememberLocale(locale: string | undefined | null) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === "production" });
}

/** Language switcher on the signed-out pages. */
export async function setLocaleAction(locale: Locale) {
  if (!isLocale(locale)) return;
  await rememberLocale(locale);
  revalidatePath("/", "layout");
}

// ───────────── Parent ─────────────

export async function parentLoginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const parsed = z.object({ email: emailSchema, password: z.string().min(1).max(128) }).safeParse(formToObject(fd));
  if (!parsed.success) return { error: t("auth.wrongLogin") };
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const res = await verifyWithLockout(user?.role === "PARENT" ? user : null, parsed.data.password);
  if (!res.ok) return { error: res.reason === "locked" ? t("auth.locked", { minutes: res.minutes ?? SECURITY.lockMinutes }) : t("auth.wrongLogin") };
  await createSession(user!.id, "PARENT");
  const family = await db.parentProfile.findUnique({ where: { userId: user!.id }, select: { family: { select: { locale: true } } } });
  await rememberLocale(family?.family.locale);
  redirect("/parent");
}

export async function signupAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const parsed = z
    .object({
      displayName: z.string().trim().min(1, "Required").max(40),
      email: emailSchema,
      password: passwordSchema,
      timezone: z.string().max(64).optional(),
    })
    .safeParse(formToObject(fd));
  if (!parsed.success) return fieldErrors(parsed.error, t);
  const { displayName, email, password, timezone } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) {
    return { error: t("errors.emailTaken"), fieldErrors: { email: [t("errors.emailTaken")] } };
  }
  await syncCatalogs(db);
  const family = await db.family.create({
    data: { name: t("auth.familyName", { name: displayName }), loginCode: await uniqueFamilyCode(db), timezone: safeTz(timezone ?? "UTC"), locale: await getLocale() },
  });
  const user = await db.user.create({
    data: {
      role: "PARENT",
      email,
      passwordHash: await hashPassword(password),
      parentProfile: { create: { familyId: family.id, displayName } },
    },
  });
  await createSession(user.id, "PARENT");
  redirect("/onboarding");
}

export async function forgotPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const parsed = emailSchema.safeParse(fd.get("email"));
  if (!parsed.success) return { error: t("errors.email") };
  const user = await db.user.findUnique({ where: { email: parsed.data } });
  let devLink: string | undefined;
  if (user?.role === "PARENT") {
    const token = randomBytes(32).toString("base64url");
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + SECURITY.resetTokenMinutes * 60000) },
    });
    const url = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email!, url);
    if (process.env.NODE_ENV !== "production") devLink = url;
  }
  // Same response whether or not the account exists.
  return { ok: true, message: t("auth.forgotSent"), data: devLink ? { devLink } : undefined };
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const parsed = z.object({ token: z.string().min(10).max(200), password: passwordSchema }).safeParse(formToObject(fd));
  if (!parsed.success) return fieldErrors(parsed.error, t);
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return { error: t("auth.resetInvalid") };
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(parsed.data.password), failedLogins: 0, lockedUntil: null } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: record.userId } }),
  ]);
  return { ok: true, message: t("auth.resetDone") };
}

// ───────────── Child ─────────────

/** Remember a family on this device so kids only need to tap their avatar + PIN. */
export async function rememberFamilyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const code = String(fd.get("code") ?? "").trim().toUpperCase().slice(0, 20);
  const family = code ? await db.family.findUnique({ where: { loginCode: code } }) : null;
  if (!family) return { error: t("auth.wrongFamily") };
  (await cookies()).set(SESSION.familyCookieName, family.loginCode, familyCookieOpts);
  redirect("/login?as=kid");
}

export async function forgetFamilyAction() {
  (await cookies()).delete(SESSION.familyCookieName);
  redirect("/login?as=kid");
}

export async function childLoginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const jar = await cookies();
  const code = jar.get(SESSION.familyCookieName)?.value;
  const parsed = z.object({ childId: z.string().min(1).max(40), secret: z.string().min(1).max(64) }).safeParse(formToObject(fd));
  if (!code || !parsed.success) return { error: t("auth.wrongPin") };

  const child = await db.childProfile.findFirst({
    where: { id: parsed.data.childId, family: { loginCode: code } },
    include: { user: true, family: { select: { locale: true } } },
  });
  const res = await verifyWithLockout(child?.user ?? null, parsed.data.secret);
  if (!res.ok) return { error: res.reason === "locked" ? t("auth.locked", { minutes: res.minutes ?? SECURITY.lockMinutes }) : t("auth.wrongPin") };
  await createSession(child!.userId, "CHILD");
  await rememberLocale(child!.family.locale);
  redirect(child!.welcomedAt ? "/child/today" : "/child/welcome");
}

// ───────────── Shared ─────────────

export async function logoutAction() {
  const s = await getSession();
  const wasChild = s?.user.role === "CHILD";
  await destroySession();
  redirect(wasChild ? "/login?as=kid" : "/login");
}
