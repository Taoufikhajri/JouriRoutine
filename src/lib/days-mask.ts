/** Week-day bitmask helpers. Bit 0 = Sunday … bit 6 = Saturday. */
export const EVERY_DAY = 0b1111111;
export const WEEKDAYS = 0b0111110; // Mon–Fri
export const WEEKEND = 0b1000001; // Sat + Sun

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function includesDay(mask: number, weekday: number): boolean {
  return (mask & (1 << weekday)) !== 0;
}

export function maskFromDays(days: number[]): number {
  return days.reduce((m, d) => m | (1 << d), 0);
}

export function daysFromMask(mask: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6].filter((d) => includesDay(mask, d));
}

export function describeMask(mask: number): string {
  if (mask === EVERY_DAY) return "Every day";
  if (mask === WEEKDAYS) return "Mon–Fri";
  if (mask === WEEKEND) return "Weekends";
  if (mask === 0) return "Never";
  return daysFromMask(mask)
    .map((d) => DAY_LABELS[d])
    .join(", ");
}
