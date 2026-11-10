import { z } from "zod";
import type { Translator } from "@/i18n";

/*
 * Validation messages are i18n keys ("errors.required") and are translated
 * when returned to the client by `fieldErrors(error, t)`.
 */
export const emailSchema = z.string().trim().toLowerCase().email("errors.email").max(200);
export const passwordSchema = z
  .string()
  .min(8, "errors.passwordLength")
  .max(128)
  .regex(/[A-Za-z]/, "errors.passwordLetter")
  .regex(/[0-9]/, "errors.passwordNumber");
export const pinSchema = z.string().regex(/^\d{4}$/, "errors.pin");
export const hhmmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "errors.time")
  .or(z.literal(""))
  .transform((v) => v || null);
export const iconSchema = z.string().trim().min(1, "errors.icon").max(16);
export const childNameSchema = z.string().trim().min(1, "errors.required").max(30);
/** Internal unique login key per family — kids tap their avatar, they never type it. Any alphabet. */
export const loginNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v) => v.replace(/\s+/g, ""))
  .pipe(z.string().regex(/^[\p{L}\p{M}\p{N}_-]{1,30}$/u, "errors.loginName"));

export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  data?: Record<string, unknown>;
};

export function fieldErrors(error: z.ZodError, t: Translator): ActionState {
  const raw = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const translated = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v?.map((m) => t.error(m))]));
  return { error: t("errors.checkFields"), fieldErrors: translated };
}

export function formToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}
