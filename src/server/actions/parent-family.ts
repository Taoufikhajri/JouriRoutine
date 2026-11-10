"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SESSION } from "@/config/app";
import { LOCALE_COOKIE, createTranslator, isLocale, type Locale } from "@/i18n";
import { getLocale, getT } from "@/i18n/server";
import { translateContent } from "@/i18n/content";
import { db } from "@/lib/db";
import { safeTz } from "@/lib/dates";
import {
  childNameSchema,
  fieldErrors,
  iconSchema,
  loginNameSchema,
  passwordSchema,
  pinSchema,
  type ActionState,
} from "@/lib/validation";
import { assertFamilyChild, requireParent } from "@/server/auth/guards";
import { comparePassword, hashPassword, hashPin } from "@/server/auth/password";
import { destroyAllSessions, destroySession, createSession } from "@/server/auth/session";
import { AVATARS } from "@/server/catalog/avatars";
import { DEFAULT_REWARDS } from "@/server/catalog/rewards";
import { TEMPLATES, type TemplateKey } from "@/server/catalog/templates";
import { applyTemplate, grantStarterItems, translateFamilyContent, uniqueFamilyCode } from "@/server/services/family";
import { RewardError, decideReward } from "@/server/services/rewards";

function done() {
  revalidatePath("/parent", "layout");
  revalidatePath("/child", "layout");
}

const avatarSchema = z.string().refine((k) => AVATARS.some((a) => a.key === k), "errors.character");

// ───────────── Children ─────────────

async function createChild(familyId: string, d: { name: string; loginName: string; age: number | null; avatarKey: string; pin: string }) {
  const clash = await db.childProfile.findUnique({ where: { familyId_loginName: { familyId, loginName: d.loginName } } });
  if (clash) return null;
  const user = await db.user.create({
    data: {
      role: "CHILD",
      username: d.loginName,
      passwordHash: await hashPin(d.pin),
      childProfile: { create: { familyId, name: d.name, loginName: d.loginName, age: d.age, avatarKey: d.avatarKey } },
    },
    include: { childProfile: true },
  });
  await grantStarterItems(db, user.childProfile!.id);
  return user.childProfile!;
}

const childSchema = z.object({
  name: childNameSchema,
  age: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .pipe(z.number().int().min(2).max(17).nullable()),
  avatarKey: avatarSchema,
});

export async function addChildAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const { family } = await requireParent();
  const parsed = childSchema.extend({ pin: pinSchema }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fieldErrors(parsed.error, t);
  const loginName = loginNameSchema.safeParse(parsed.data.name);
  if (!loginName.success) return { error: t("errors.loginName"), fieldErrors: { name: [t("errors.loginName")] } };
  const child = await createChild(family.id, { ...parsed.data, loginName: loginName.data });
  if (!child) return { error: t("errors.nameUsed"), fieldErrors: { name: [t("errors.nameUsed")] } };
  const tpl = String(fd.get("template") ?? "");
  if (TEMPLATES.some((x) => x.key === tpl)) await applyTemplate(db, child.id, tpl as TemplateKey, await getLocale());
  done();
  return { ok: true, message: t("parent.children.added", { name: child.name }) };
}

export async function updateChildAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const { family } = await requireParent();
  const childId = String(fd.get("childId") ?? "");
  const child = await assertFamilyChild(family.id, childId);
  const parsed = childSchema
    .extend({ pin: pinSchema.or(z.literal("")), loginMode: z.enum(["PIN", "PASSWORD"]), password: z.string().max(64).optional() })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fieldErrors(parsed.error, t);
  const { name, age, avatarKey, pin, loginMode, password } = parsed.data;

  const loginName = loginNameSchema.safeParse(name);
  if (!loginName.success) return { fieldErrors: { name: [t("errors.loginName")] }, error: t("errors.checkFields") };
  if (loginName.data !== child.loginName) {
    const clash = await db.childProfile.findUnique({ where: { familyId_loginName: { familyId: family.id, loginName: loginName.data } } });
    if (clash) return { fieldErrors: { name: [t("errors.nameUsed")] }, error: t("errors.nameUsed") };
  }

  let passwordHash: string | undefined;
  if (loginMode === "PIN" && pin) passwordHash = await hashPin(pin);
  if (loginMode === "PASSWORD" && password) {
    if (password.length < 4) return { fieldErrors: { password: [t("errors.shortPassword")] }, error: t("errors.checkFields") };
    passwordHash = await hashPin(password);
  }
  if (loginMode !== child.loginMode && !passwordHash) {
    return { error: loginMode === "PIN" ? t("errors.switchPin") : t("errors.switchPassword") };
  }

  await db.$transaction([
    db.childProfile.update({ where: { id: child.id }, data: { name, age, avatarKey, loginMode, loginName: loginName.data } }),
    db.user.update({ where: { id: child.userId }, data: { username: loginName.data, ...(passwordHash ? { passwordHash, failedLogins: 0, lockedUntil: null } : {}) } }),
  ]);
  done();
  return { ok: true, message: t("parent.children.saved") };
}

export async function deleteChildAction(childId: string) {
  const { family } = await requireParent();
  const child = await assertFamilyChild(family.id, childId);
  await db.user.delete({ where: { id: child.userId } }); // cascades to profile + history
  done();
}

export async function saveMemorizationAction(childId: string, surah: string, progress: number) {
  const { family } = await requireParent();
  await assertFamilyChild(family.id, childId);
  const s = z.string().trim().min(1).max(40).parse(surah);
  const p = z.number().int().min(0).max(100).parse(progress);
  const count = await db.quranMemorization.count({ where: { childId } });
  await db.quranMemorization.upsert({
    where: { childId_surah: { childId, surah: s } },
    create: { childId, surah: s, progress: p, sortOrder: count },
    update: { progress: p },
  });
  done();
}

export async function deleteMemorizationAction(id: string) {
  const { family } = await requireParent();
  await db.quranMemorization.deleteMany({ where: { id, child: { familyId: family.id } } });
  done();
}

// ───────────── Rewards ─────────────

const rewardSchema = z.object({
  title: z.string().trim().min(1, "errors.required").max(50),
  icon: iconSchema,
  cost: z.coerce.number().int().min(1, "errors.atLeastOne").max(10000),
});

export async function saveRewardAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const { family } = await requireParent();
  const parsed = rewardSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fieldErrors(parsed.error, t);
  const id = String(fd.get("rewardId") ?? "");
  if (id) {
    const r = await db.reward.findFirst({ where: { id, familyId: family.id } });
    if (!r) return { error: t("errors.notFound") };
    await db.reward.update({ where: { id }, data: parsed.data });
  } else {
    const count = await db.reward.count({ where: { familyId: family.id } });
    await db.reward.create({ data: { ...parsed.data, familyId: family.id, sortOrder: count } });
  }
  done();
  return { ok: true, message: t("parent.rewards.saved") };
}

export async function toggleRewardAction(id: string) {
  const { family } = await requireParent();
  const r = await db.reward.findFirst({ where: { id, familyId: family.id } });
  if (!r) return;
  await db.reward.update({ where: { id }, data: { isActive: !r.isActive } });
  done();
}

export async function deleteRewardAction(id: string) {
  const { family } = await requireParent();
  await db.reward.deleteMany({ where: { id, familyId: family.id } });
  done();
}

export async function decideRewardAction(redemptionId: string, approve: boolean) {
  const t = await getT();
  const { family, parent } = await requireParent();
  try {
    await db.$transaction((tx) => decideReward(tx, family.id, parent.id, redemptionId, approve));
    done();
    return { ok: true as const };
  } catch (e) {
    if (e instanceof RewardError) {
      return { ok: false as const, error: e.code === "NOT_ENOUGH" ? t("errors.notEnoughCoins") : e.code === "ALREADY_DECIDED" ? t("errors.alreadyHandled") : t("errors.notFound") };
    }
    throw e;
  }
}

// ───────────── Settings ─────────────

export async function updateFamilyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const { family } = await requireParent();
  const parsed = z
    .object({ name: z.string().trim().min(1, "errors.required").max(50), timezone: z.string().max(64), locale: z.string().refine(isLocale), soundVolume: z.coerce.number().int().min(0).max(100).default(60) })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fieldErrors(parsed.error, t);
  const locale = parsed.data.locale as Locale;
  await db.family.update({
    where: { id: family.id },
    data: { name: parsed.data.name, timezone: safeTz(parsed.data.timezone), soundEnabled: fd.get("soundEnabled") === "on", soundVolume: parsed.data.soundVolume, locale },
  });
  if (locale !== family.locale && fd.get("translateContent") === "on") {
    await db.$transaction((tx) => translateFamilyContent(tx, family.id, locale), { timeout: 30000 });
  }
  (await cookies()).set(LOCALE_COOKIE, locale, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
  done();
  return { ok: true, message: createTranslator(locale)("parent.settings.saved") };
}

export async function regenerateFamilyCodeAction() {
  const { family } = await requireParent();
  await db.family.update({ where: { id: family.id }, data: { loginCode: await uniqueFamilyCode(db) } });
  done();
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const { user } = await requireParent();
  const parsed = z.object({ current: z.string().min(1, "errors.required"), next: passwordSchema }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fieldErrors(parsed.error, t);
  if (!(await comparePassword(parsed.data.current, user.passwordHash))) return { fieldErrors: { current: [t("errors.incorrectPassword")] }, error: t("errors.incorrectPassword") };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.next) } });
  // Sign out every other device, keep this one.
  await destroyAllSessions(user.id);
  await createSession(user.id, "PARENT");
  return { ok: true, message: t("parent.settings.changed") };
}

/** Hand the device to the child: remember the family, end the parent session. */
export async function openKidModeAction() {
  const { family } = await requireParent();
  (await cookies()).set(SESSION.familyCookieName, family.loginCode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  await destroySession();
  redirect("/login?as=kid");
}

export async function markNotificationsReadAction() {
  const { family } = await requireParent();
  await db.notification.updateMany({ where: { familyId: family.id, childId: null, readAt: null }, data: { readAt: new Date() } });
  done();
}

// ───────────── Onboarding ─────────────

const onboardingSchema = z.object({
  familyName: z.string().trim().min(1, "errors.required").max(50),
  childName: childNameSchema,
  age: z.coerce.number().int().min(2).max(17),
  avatarKey: avatarSchema,
  pin: pinSchema,
  templates: z.array(z.enum(TEMPLATES.map((t) => t.key) as [TemplateKey, ...TemplateKey[]])).min(1, "errors.required"),
  rewards: z.array(z.number().int().min(0).max(DEFAULT_REWARDS.length - 1)).max(DEFAULT_REWARDS.length),
});

export async function completeOnboardingAction(input: z.input<typeof onboardingSchema>): Promise<ActionState> {
  const t = await getT();
  const { family } = await requireParent();
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return fieldErrors(parsed.error, t);
  const d = parsed.data;
  const loginName = loginNameSchema.safeParse(d.childName);
  if (!loginName.success) return { error: t("parent.onboarding.letters") };

  const child = await createChild(family.id, { name: d.childName, loginName: loginName.data, age: d.age, avatarKey: d.avatarKey, pin: d.pin });
  if (!child) return { error: t("errors.nameUsed") };
  const locale = await getLocale();
  for (const key of d.templates) await applyTemplate(db, child.id, key, locale);
  if (d.rewards.length) {
    await db.reward.createMany({
      data: d.rewards.map((i, order) => ({ ...DEFAULT_REWARDS[i], title: translateContent(DEFAULT_REWARDS[i].title, locale), familyId: family.id, sortOrder: order })),
    });
  }
  await db.family.update({ where: { id: family.id }, data: { name: d.familyName, onboardedAt: new Date() } });
  done();
  return { ok: true };
}

export async function skipOnboardingAction() {
  const { family } = await requireParent();
  await db.family.update({ where: { id: family.id }, data: { onboardedAt: new Date() } });
  redirect("/parent");
}

