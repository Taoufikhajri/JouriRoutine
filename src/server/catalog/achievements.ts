import type { AchievementRule } from "@prisma/client";

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  rule: AchievementRule;
  dimension?: string;
  threshold: number;
  xpBonus?: number;
  coinBonus?: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first-step", title: "First Step", description: "Complete your very first mission.", icon: "👣", rule: "TOTAL_TASKS", threshold: 1, coinBonus: 5 },
  { key: "perfect-day", title: "Perfect Day", description: "Finish 100% of a day's missions.", icon: "⭐", rule: "PERFECT_DAYS", threshold: 1, coinBonus: 10, xpBonus: 20 },
  { key: "early-bird", title: "Early Bird", description: "Finish the morning routine 5 times.", icon: "🌅", rule: "FULL_DAYS", dimension: "cat:MORNING", threshold: 5, coinBonus: 10 },
  { key: "prayer-star", title: "Prayer Star", description: "Complete all your prayers on 7 days.", icon: "🕌", rule: "FULL_DAYS", dimension: "kind:PRAYER", threshold: 7, coinBonus: 20, xpBonus: 50 },
  { key: "quran-explorer", title: "Quran Explorer", description: "Complete your Quran mission 10 times.", icon: "📖", rule: "COMPLETION_COUNT", dimension: "QURAN", threshold: 10, coinBonus: 20, xpBonus: 50 },
  { key: "dhikr-light", title: "Dhikr Light", description: "Say your adhkar 7 times.", icon: "🤲", rule: "COMPLETION_COUNT", dimension: "ADHKAR", threshold: 7, coinBonus: 10 },
  { key: "super-smile", title: "Super Smile", description: "Brush teeth morning and evening for 7 days.", icon: "🦷", rule: "FULL_DAYS", dimension: "kind:TEETH", threshold: 7, coinBonus: 15 },
  { key: "kind-helper", title: "Kind Helper", description: "Help your family 10 times.", icon: "❤️", rule: "COMPLETION_COUNT", dimension: "HELPING", threshold: 10, coinBonus: 15 },
  { key: "book-worm", title: "Book Worm", description: "Read books on 10 different days.", icon: "📚", rule: "ANY_DAYS", dimension: "kind:READING", threshold: 10, coinBonus: 15 },
  { key: "streak-3", title: "Spark", description: "3 good days in a row!", icon: "🔥", rule: "STREAK", threshold: 3, coinBonus: 5 },
  { key: "streak-7", title: "Shining Week", description: "7 good days in a row!", icon: "🌟", rule: "STREAK", threshold: 7, coinBonus: 15, xpBonus: 30 },
  { key: "streak-14", title: "Super Streak", description: "14 good days in a row!", icon: "💫", rule: "STREAK", threshold: 14, coinBonus: 25, xpBonus: 50 },
  { key: "streak-30", title: "Streak Master", description: "30 good days in a row!", icon: "🏆", rule: "STREAK", threshold: 30, coinBonus: 50, xpBonus: 100 },
  { key: "streak-60", title: "Moon Walker", description: "60 good days in a row!", icon: "🌙", rule: "STREAK", threshold: 60, coinBonus: 80, xpBonus: 150 },
  { key: "streak-100", title: "Legend of Light", description: "100 good days in a row!", icon: "👑", rule: "STREAK", threshold: 100, coinBonus: 150, xpBonus: 300 },
  { key: "mission-hero", title: "Mission Hero", description: "Complete 100 missions.", icon: "🦸", rule: "TOTAL_TASKS", threshold: 100, coinBonus: 20 },
  { key: "star-collector", title: "Star Collector", description: "Have 7 perfect days.", icon: "🌠", rule: "PERFECT_DAYS", threshold: 7, coinBonus: 30, xpBonus: 50 },
];
