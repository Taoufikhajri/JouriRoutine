import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Role } from "@prisma/client";
import { SESSION } from "@/config/app";
import { db } from "@/lib/db";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string, role: Role) {
  const token = randomBytes(32).toString("base64url");
  const days = role === "PARENT" ? SESSION.parentMaxAgeDays : SESSION.childMaxAgeDays;
  const expiresAt = new Date(Date.now() + days * 864e5);
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date(), failedLogins: 0, lockedUntil: null } });
  const jar = await cookies();
  jar.set(SESSION.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Resolve the current session (memoised per request). Role always comes from the DB. */
export const getSession = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION.cookieName)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { parentProfile: { include: { family: true } }, childProfile: { include: { family: true } } } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
});

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION.cookieName)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION.cookieName);
}

export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

export { hashToken };
