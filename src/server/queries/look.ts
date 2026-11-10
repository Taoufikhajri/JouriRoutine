import "server-only";
import { db } from "@/lib/db";
import type { EquippedLook } from "@/features/avatar/avatar-view";

export async function equippedLook(childId: string): Promise<EquippedLook> {
  const items = await db.childAvatarItem.findMany({ where: { childId, equipped: true }, include: { item: true } });
  const look: EquippedLook = {};
  for (const i of items) look[i.item.slot] = i.item.emoji;
  return look;
}

export async function equippedLooks(childIds: string[]): Promise<Record<string, EquippedLook>> {
  const items = await db.childAvatarItem.findMany({ where: { childId: { in: childIds }, equipped: true }, include: { item: true } });
  const out: Record<string, EquippedLook> = {};
  for (const i of items) (out[i.childId] ??= {})[i.item.slot] = i.item.emoji;
  return out;
}
