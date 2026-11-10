import type { RoutineCategory, TaskDifficulty } from "@prisma/client";

/** XP / coin presets per difficulty. Parents can override per task. */
export const DIFFICULTY_PRESETS: Record<TaskDifficulty, { xp: number; coins: number; label: string }> = {
  SIMPLE: { xp: 5, coins: 1, label: "Simple" },
  NORMAL: { xp: 10, coins: 2, label: "Normal" },
  IMPORTANT: { xp: 20, coins: 5, label: "Important" },
  SPECIAL: { xp: 30, coins: 8, label: "Special challenge" },
};

export interface LevelDef {
  level: number;
  title: string;
  minXp: number;
  icon: string;
}

/** Level ladder. A full day is roughly 300–400 XP. */
export const LEVELS: LevelDef[] = [
  { level: 1, title: "Little Explorer", minXp: 0, icon: "🌱" },
  { level: 2, title: "Bright Star", minXp: 400, icon: "⭐" },
  { level: 3, title: "Kind Helper", minXp: 1000, icon: "🤝" },
  { level: 4, title: "Brave Adventurer", minXp: 2000, icon: "🛡️" },
  { level: 5, title: "Quran Explorer", minXp: 3500, icon: "📖" },
  { level: 6, title: "Super Helper", minXp: 5500, icon: "🦸" },
  { level: 7, title: "Golden Star", minXp: 8000, icon: "🌟" },
  { level: 8, title: "Young Champion", minXp: 11000, icon: "🏅" },
  { level: 9, title: "Master Adventurer", minXp: 15000, icon: "🧭" },
  { level: 10, title: "Legendary Star", minXp: 20000, icon: "👑" },
];

export function levelForXp(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.minXp) current = l;
  const next = LEVELS.find((l) => l.level === current.level + 1) ?? null;
  const span = next ? next.minXp - current.minXp : 1;
  const into = xp - current.minXp;
  return {
    ...current,
    next,
    xp,
    progress: next ? Math.min(1, into / span) : 1,
    nextXp: next?.minXp ?? current.minXp,
  };
}

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

export const CHESTS = {
  smallAfterTasks: 5,
  perfectDayBonusCoins: 20,
  small: { coins: [5, 5, 10, 10, 15], xp: [10, 15, 20] },
  golden: { coins: [15, 20, 25, 30], xp: [30, 40, 50] },
} as const;

export const CATEGORY_META: Record<RoutineCategory, { label: string; icon: string; order: number }> = {
  MORNING: { label: "Morning", icon: "🌅", order: 0 },
  SCHOOL: { label: "School", icon: "🏫", order: 1 },
  AFTER_SCHOOL: { label: "After School", icon: "🌇", order: 2 },
  EVENING: { label: "Evening", icon: "🌙", order: 3 },
  WEEKEND: { label: "Weekend", icon: "🎈", order: 4 },
  RAMADAN: { label: "Ramadan", icon: "🌙", order: 5 },
  CUSTOM: { label: "Custom", icon: "✨", order: 6 },
};

/** Places on the daily adventure map, spread evenly along the path. */
export const ADVENTURE_STAGES = [
  { key: "home", name: "Cozy Home", icon: "🏠", color: "#ffd6a5" },
  { key: "forest", name: "Magic Forest", icon: "🌳", color: "#b9fbc0" },
  { key: "school", name: "School Castle", icon: "🏫", color: "#a0c4ff" },
  { key: "rainbow", name: "Rainbow Bridge", icon: "🌈", color: "#ffc6ff" },
  { key: "library", name: "Knowledge Library", icon: "📚", color: "#fdffb6" },
  { key: "garden", name: "Peace Garden", icon: "🕌", color: "#caffbf" },
  { key: "castle", name: "Dream Castle", icon: "🏰", color: "#bdb2ff" },
] as const;

export const PRAYERS = [
  { name: "FAJR", label: "Fajr", defaultTime: "07:00" },
  { name: "DHUHR", label: "Dhuhr", defaultTime: "13:00" },
  { name: "ASR", label: "Asr", defaultTime: "15:50" },
  { name: "MAGHRIB", label: "Maghrib", defaultTime: "18:30" },
  { name: "ISHA", label: "Isha", defaultTime: "20:05" },
] as const;
