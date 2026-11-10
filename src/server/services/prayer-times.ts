/**
 * Prayer-time providers.
 *
 * MVP: parents set prayer times manually on each prayer mission
 * (RoutineTask.kind = PRAYER, prayerName, time). No location permission is
 * ever requested.
 *
 * Later: implement `PrayerTimeProvider` with an API (e.g. Aladhan) using a
 * city the parent types in, then run `syncPrayerTimes` daily to update the
 * `time` of every prayer mission.
 */
import type { PrayerName } from "@prisma/client";
import type { DB } from "./types";

export type PrayerTimes = Record<PrayerName, string>; // "HH:MM"

export interface PrayerTimeProvider {
  readonly id: string;
  timesFor(date: string, place: { city: string; country?: string; method?: number }): Promise<PrayerTimes>;
}

/** Default provider: whatever the parent configured — nothing to fetch. */
export const manualProvider: PrayerTimeProvider = {
  id: "manual",
  async timesFor() {
    throw new Error("Manual provider has no automatic times; times live on each prayer mission.");
  },
};

/** Apply provider times to a child's prayer missions. Not used in the MVP. */
export async function syncPrayerTimes(db: DB, childId: string, times: Partial<PrayerTimes>) {
  for (const [prayerName, time] of Object.entries(times)) {
    if (!time) continue;
    await db.routineTask.updateMany({
      where: { kind: "PRAYER", prayerName: prayerName as PrayerName, routine: { childId } },
      data: { time },
    });
  }
}
