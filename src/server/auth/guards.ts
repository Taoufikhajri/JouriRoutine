import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "./session";

/** Server-side guard for parent pages and actions. */
export async function requireParent() {
  const s = await getSession();
  const parent = s?.user.role === "PARENT" ? s.user.parentProfile : null;
  if (!s || !parent) redirect("/login");
  return { user: s.user, parent, family: parent.family };
}

/** Server-side guard for child pages and actions. The child id ALWAYS comes from the session. */
export async function requireChild() {
  const s = await getSession();
  const child = s?.user.role === "CHILD" ? s.user.childProfile : null;
  if (!s || !child) redirect("/login");
  return { user: s.user, child, family: child.family };
}

/**
 * Resolve which child a parent is looking at. The id from the URL is only a
 * hint — it is checked against the parent's own family.
 */
export async function resolveParentChild(familyId: string, requestedId?: string | null) {
  const children = await db.childProfile.findMany({ where: { familyId }, orderBy: { createdAt: "asc" } });
  const child = children.find((c) => c.id === requestedId) ?? children[0] ?? null;
  return { children, child };
}

/** Throws if the child does not belong to the family. Use in parent actions. */
export async function assertFamilyChild(familyId: string, childId: string) {
  const child = await db.childProfile.findFirst({ where: { id: childId, familyId } });
  if (!child) throw new Error("FORBIDDEN");
  return child;
}
