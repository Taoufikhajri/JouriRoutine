"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DIFFICULTY_PRESETS } from "@/config/game";
import { getLocale, getT } from "@/i18n/server";
import { translateContent } from "@/i18n/content";
import { db } from "@/lib/db";
import { maskFromDays } from "@/lib/days-mask";
import { fieldErrors, hhmmSchema, iconSchema, type ActionState } from "@/lib/validation";
import { assertFamilyChild, requireParent } from "@/server/auth/guards";
import { TEMPLATES, type TemplateKey } from "@/server/catalog/templates";
import { applyTemplate } from "@/server/services/family";

const CATEGORIES = ["MORNING", "SCHOOL", "AFTER_SCHOOL", "EVENING", "WEEKEND", "RAMADAN", "CUSTOM"] as const;
const KINDS = ["GENERAL", "PRAYER", "QURAN", "ADHKAR", "READING", "HOMEWORK", "HYGIENE", "TEETH", "HELPING", "MANNERS", "SLEEP", "MEAL", "EXERCISE", "CREATIVE", "SCHOOL"] as const;
const DIFFS = ["SIMPLE", "NORMAL", "IMPORTANT", "SPECIAL"] as const;
const PRAYERS = ["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"] as const;

function done() {
  revalidatePath("/parent", "layout");
  revalidatePath("/child", "layout");
}

function daysFrom(fd: FormData) {
  const days = fd
    .getAll("days")
    .map((d) => Number(d))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  return maskFromDays(days);
}

/** Load a routine only if it belongs to the parent's family. */
async function ownedRoutine(familyId: string, routineId: string) {
  const r = await db.routine.findFirst({ where: { id: routineId, child: { familyId } } });
  if (!r) throw new Error("FORBIDDEN");
  return r;
}

async function ownedTask(familyId: string, taskId: string) {
  const t = await db.routineTask.findFirst({ where: { id: taskId, routine: { child: { familyId } } } });
  if (!t) throw new Error("FORBIDDEN");
  return t;
}

// ───────────── Routines ─────────────

const routineSchema = z.object({
  name: z.string().trim().min(1, "errors.required").max(40),
  icon: iconSchema,
  category: z.enum(CATEGORIES),
});

export async function saveRoutineAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const { family } = await requireParent();
  const parsed = routineSchema.safeParse({ name: fd.get("name"), icon: fd.get("icon"), category: fd.get("category") });
  if (!parsed.success) return fieldErrors(parsed.error, t);
  const daysMask = daysFrom(fd);
  if (daysMask === 0) return { error: t("errors.pickDay"), fieldErrors: { days: [t("errors.pickDay")] } };

  const routineId = String(fd.get("routineId") ?? "");
  if (routineId) {
    await ownedRoutine(family.id, routineId);
    await db.routine.update({ where: { id: routineId }, data: { ...parsed.data, daysMask } });
  } else {
    const childId = String(fd.get("childId") ?? "");
    await assertFamilyChild(family.id, childId);
    const last = await db.routine.findFirst({ where: { childId }, orderBy: { sortOrder: "desc" } });
    await db.routine.create({ data: { ...parsed.data, daysMask, childId, sortOrder: (last?.sortOrder ?? -1) + 1 } });
  }
  done();
  return { ok: true, message: t("parent.routines.saved") };
}

export async function toggleRoutineAction(routineId: string) {
  const { family } = await requireParent();
  const r = await ownedRoutine(family.id, routineId);
  await db.routine.update({ where: { id: r.id }, data: { isActive: !r.isActive } });
  done();
}

export async function deleteRoutineAction(routineId: string) {
  const { family } = await requireParent();
  await ownedRoutine(family.id, routineId);
  await db.routine.delete({ where: { id: routineId } });
  done();
}

export async function duplicateRoutineAction(routineId: string) {
  const t = await getT();
  const { family } = await requireParent();
  await ownedRoutine(family.id, routineId);
  const r = await db.routine.findUniqueOrThrow({ where: { id: routineId }, include: { tasks: true } });
  await db.routine.create({
    data: {
      childId: r.childId,
      name: `${r.name}${t("parent.routines.copySuffix")}`,
      icon: r.icon,
      category: r.category,
      daysMask: r.daysMask,
      isActive: false,
      sortOrder: r.sortOrder + 1,
      tasks: {
        create: r.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          icon: t.icon,
          time: t.time,
          kind: t.kind,
          difficulty: t.difficulty,
          xp: t.xp,
          coins: t.coins,
          isRequired: t.isRequired,
          isActive: t.isActive,
          daysMask: t.daysMask,
          sortOrder: t.sortOrder,
          prayerName: t.prayerName,
          quranMinutes: t.quranMinutes,
          quranPages: t.quranPages,
          quranSurah: t.quranSurah,
        })),
      },
    },
  });
  done();
}

export async function moveRoutineAction(routineId: string, direction: "up" | "down") {
  const { family } = await requireParent();
  const r = await ownedRoutine(family.id, routineId);
  const siblings = await db.routine.findMany({ where: { childId: r.childId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const i = siblings.findIndex((s) => s.id === r.id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= siblings.length) return;
  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  await db.$transaction(siblings.map((s, idx) => db.routine.update({ where: { id: s.id }, data: { sortOrder: idx } })));
  done();
}

export async function applyTemplateAction(childId: string, key: string) {
  const { family } = await requireParent();
  await assertFamilyChild(family.id, childId);
  if (!TEMPLATES.some((tpl) => tpl.key === key)) return { ok: false as const };
  const locale = await getLocale();
  await db.$transaction((tx) => applyTemplate(tx, childId, key as TemplateKey, locale), { timeout: 20000 });
  done();
  return { ok: true as const };
}

// ───────────── Tasks ─────────────

const optInt = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .pipe(z.number().int().min(0).max(max).nullable());

const taskSchema = z.object({
  title: z.string().trim().min(1, "errors.required").max(60),
  description: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || null),
  icon: iconSchema,
  time: hhmmSchema,
  kind: z.enum(KINDS),
  difficulty: z.enum(DIFFS),
  xp: z.coerce.number().int().min(0, "errors.zeroOrMore").max(500),
  coins: z.coerce.number().int().min(0, "errors.zeroOrMore").max(200),
  isRequired: z.boolean(),
  prayerName: z
    .enum(PRAYERS)
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null),
  quranMinutes: optInt(240),
  quranPages: optInt(100),
  quranSurah: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => v || null),
});

export async function saveTaskAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const { family } = await requireParent();
  const raw = Object.fromEntries([...fd.entries()].filter(([k]) => k !== "days").map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  const parsed = taskSchema.safeParse({ ...raw, isRequired: fd.get("isRequired") === "on" });
  if (!parsed.success) return fieldErrors(parsed.error, t);
  const daysMask = daysFrom(fd);
  if (daysMask === 0) return { error: t("errors.pickDay"), fieldErrors: { days: [t("errors.pickDay")] } };
  const data = { ...parsed.data, daysMask };
  if (data.kind !== "PRAYER") data.prayerName = null;
  if (data.kind !== "QURAN") Object.assign(data, { quranMinutes: null, quranPages: null, quranSurah: null });

  const taskId = String(fd.get("taskId") ?? "");
  if (taskId) {
    await ownedTask(family.id, taskId);
    await db.routineTask.update({ where: { id: taskId }, data });
  } else {
    const routineId = String(fd.get("routineId") ?? "");
    await ownedRoutine(family.id, routineId);
    const last = await db.routineTask.findFirst({ where: { routineId }, orderBy: { sortOrder: "desc" } });
    await db.routineTask.create({ data: { ...data, routineId, sortOrder: (last?.sortOrder ?? -1) + 1 } });
  }
  done();
  return { ok: true, message: t("parent.routines.missionSaved") };
}

export async function toggleTaskAction(taskId: string) {
  const { family } = await requireParent();
  const t = await ownedTask(family.id, taskId);
  await db.routineTask.update({ where: { id: t.id }, data: { isActive: !t.isActive } });
  done();
}

export async function deleteTaskAction(taskId: string) {
  const { family } = await requireParent();
  await ownedTask(family.id, taskId);
  await db.routineTask.delete({ where: { id: taskId } });
  done();
}

/** Persist a drag-and-drop order. Every id must belong to the same owned routine. */
export async function reorderTasksAction(routineId: string, orderedIds: string[]) {
  const { family } = await requireParent();
  await ownedRoutine(family.id, routineId);
  const ids = z.array(z.string().max(40)).max(200).parse(orderedIds);
  const tasks = await db.routineTask.findMany({ where: { routineId }, select: { id: true } });
  const valid = new Set(tasks.map((t) => t.id));
  if (ids.length !== valid.size || !ids.every((id) => valid.has(id))) throw new Error("INVALID_ORDER");
  await db.$transaction(ids.map((id, i) => db.routineTask.update({ where: { id }, data: { sortOrder: i } })));
  done();
}

/** Quick prayer settings: change time / switch on or off without opening the editor. */
export async function updatePrayerTaskAction(taskId: string, patch: { time?: string; isActive?: boolean }) {
  const { family } = await requireParent();
  await ownedTask(family.id, taskId);
  const data: { time?: string | null; isActive?: boolean } = {};
  if (patch.time !== undefined) data.time = hhmmSchema.parse(patch.time);
  if (patch.isActive !== undefined) data.isActive = !!patch.isActive;
  await db.routineTask.update({ where: { id: taskId }, data });
  done();
}

export async function addPrayerAction(routineId: string, prayer: string) {
  const { family } = await requireParent();
  await ownedRoutine(family.id, routineId);
  const name = z.enum(PRAYERS).parse(prayer);
  const locale = await getLocale();
  const label = name.charAt(0) + name.slice(1).toLowerCase();
  const last = await db.routineTask.findFirst({ where: { routineId }, orderBy: { sortOrder: "desc" } });
  const preset = DIFFICULTY_PRESETS.IMPORTANT;
  await db.routineTask.create({
    data: { routineId, title: translateContent(`${label} Prayer`, locale), icon: "🕌", kind: "PRAYER", difficulty: "IMPORTANT", prayerName: name, xp: preset.xp, coins: preset.coins, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  done();
}
