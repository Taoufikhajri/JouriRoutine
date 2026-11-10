import "server-only";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { SECURITY } from "@/config/app";
import { db } from "@/lib/db";

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const hashPin = (pin: string) => bcrypt.hash(pin, 10);

// Constant-time-ish dummy compare so unknown users take as long as known ones.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export type VerifyResult = { ok: true } | { ok: false; reason: "invalid" | "locked"; minutes?: number };

/** Verify a secret with lockout after repeated failures. */
export async function verifyWithLockout(user: User | null, secret: string): Promise<VerifyResult> {
  if (!user) {
    await bcrypt.compare(secret, DUMMY_HASH);
    return { ok: false, reason: "invalid" };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, reason: "locked", minutes: Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000) };
  }
  const ok = await bcrypt.compare(secret, user.passwordHash);
  if (ok) return { ok: true };
  const failed = user.failedLogins + 1;
  const lock = failed >= SECURITY.maxFailedLogins;
  await db.user.update({
    where: { id: user.id },
    data: { failedLogins: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + SECURITY.lockMinutes * 60000) : null },
  });
  return lock ? { ok: false, reason: "locked", minutes: SECURITY.lockMinutes } : { ok: false, reason: "invalid" };
}

export const comparePassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
