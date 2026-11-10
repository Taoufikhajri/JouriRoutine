import type { LedgerSource } from "@prisma/client";
import type { DB } from "./types";

interface Grant {
  childId: string;
  xp?: number;
  coins?: number;
  source: LedgerSource;
  sourceId?: string;
  reason: string;
}

/**
 * Write XP / coin ledger entries and update the cached totals.
 * Totals never drop below zero.
 */
export async function grant(db: DB, g: Grant) {
  const xp = g.xp ?? 0;
  const coins = g.coins ?? 0;
  if (xp !== 0) {
    await db.xPTransaction.create({ data: { childId: g.childId, amount: xp, source: g.source, sourceId: g.sourceId, reason: g.reason } });
  }
  if (coins !== 0) {
    await db.coinTransaction.create({ data: { childId: g.childId, amount: coins, source: g.source, sourceId: g.sourceId, reason: g.reason } });
  }
  const child = await db.childProfile.findUniqueOrThrow({ where: { id: g.childId }, select: { xp: true, coins: true } });
  return db.childProfile.update({
    where: { id: g.childId },
    data: { xp: Math.max(0, child.xp + xp), coins: Math.max(0, child.coins + coins) },
    select: { xp: true, coins: true },
  });
}
