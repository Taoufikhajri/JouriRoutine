/**
 * Ready-made routine templates. Pure data (no server-only imports) so the
 * seed script and onboarding share exactly the same definitions.
 */
import type { PrayerName, RoutineCategory, TaskDifficulty, TaskKind } from "@prisma/client";
import { DIFFICULTY_PRESETS } from "../../config/game";
import { EVERY_DAY, WEEKDAYS, WEEKEND, maskFromDays } from "../../lib/days-mask";

export interface TaskTemplate {
  title: string;
  icon: string;
  time?: string;
  description?: string;
  kind?: TaskKind;
  difficulty?: TaskDifficulty;
  xp?: number;
  coins?: number;
  isRequired?: boolean;
  daysMask?: number;
  prayerName?: PrayerName;
  quranMinutes?: number;
}

export interface RoutineTemplate {
  name: string;
  icon: string;
  category: RoutineCategory;
  daysMask: number;
  isActive?: boolean;
  tasks: TaskTemplate[];
}

export interface TemplateSet {
  key: TemplateKey;
  name: string;
  icon: string;
  description: string;
  routines: RoutineTemplate[];
}

export type TemplateKey = "muslim-daily" | "weekend" | "simple" | "school" | "ramadan";

const prayer = (name: PrayerName, label: string, time: string, extra: Partial<TaskTemplate> = {}): TaskTemplate => ({
  title: `${label} Prayer`,
  icon: "🕌",
  time,
  kind: "PRAYER",
  difficulty: "IMPORTANT",
  prayerName: name,
  ...extra,
});

const quran = (time: string, minutes = 10): TaskTemplate => ({
  title: "Quran",
  icon: "📖",
  time,
  kind: "QURAN",
  difficulty: "IMPORTANT",
  description: `Read or listen for ${minutes} minutes`,
  quranMinutes: minutes,
});

const FRIDAY = maskFromDays([5]);

export const TEMPLATES: TemplateSet[] = [
  {
    key: "muslim-daily",
    name: "Muslim Daily Routine",
    icon: "🌙",
    description: "School days with prayers, Quran, adhkar and good manners.",
    routines: [
      {
        name: "Morning",
        icon: "🌅",
        category: "MORNING",
        daysMask: WEEKDAYS,
        tasks: [
          { title: "Wake up", icon: "🌞", time: "06:45", kind: "SLEEP", difficulty: "SIMPLE" },
          { title: "Make my bed", icon: "🛏️", time: "06:50", kind: "HELPING", difficulty: "SIMPLE" },
          { title: "Bathroom & wash", icon: "🚿", time: "06:55", kind: "HYGIENE", difficulty: "SIMPLE" },
          prayer("FAJR", "Fajr", "07:00"),
          quran("07:10", 5),
          { title: "Brush my teeth", icon: "🦷", time: "07:20", kind: "TEETH", difficulty: "NORMAL" },
          { title: "Get dressed", icon: "👕", time: "07:25", kind: "HYGIENE", difficulty: "SIMPLE" },
          { title: "Healthy breakfast", icon: "🥣", time: "07:35", kind: "MEAL", difficulty: "NORMAL" },
        ],
      },
      {
        name: "School",
        icon: "🏫",
        category: "SCHOOL",
        daysMask: WEEKDAYS,
        tasks: [
          { title: "Prepare my school bag", icon: "🎒", time: "07:50", kind: "SCHOOL", difficulty: "NORMAL" },
          { title: "Say goodbye nicely", icon: "❤️", time: "07:55", kind: "MANNERS", difficulty: "SIMPLE", description: "A big smile and a hug!" },
          { title: "Go to school", icon: "🏫", time: "08:00", kind: "SCHOOL", difficulty: "NORMAL" },
        ],
      },
      {
        name: "After School",
        icon: "🌇",
        category: "AFTER_SCHOOL",
        daysMask: WEEKDAYS,
        tasks: [
          { title: "Come home", icon: "🏠", time: "15:30", kind: "GENERAL", difficulty: "SIMPLE" },
          { title: "Put shoes & clothes away", icon: "👟", time: "15:35", kind: "HELPING", difficulty: "SIMPLE" },
          { title: "Healthy snack", icon: "🥛", time: "15:40", kind: "MEAL", difficulty: "SIMPLE" },
          prayer("ASR", "Asr", "15:50", { isRequired: false, description: "If it is prayer time" }),
          { title: "Rest for 20 minutes", icon: "😌", time: "16:00", kind: "GENERAL", difficulty: "SIMPLE" },
          { title: "Homework", icon: "📚", time: "16:20", kind: "HOMEWORK", difficulty: "IMPORTANT" },
          { title: "Read a book (15 min)", icon: "📖", time: "17:00", kind: "READING", difficulty: "NORMAL", coins: 3 },
          { title: "Free play", icon: "🧸", time: "17:20", kind: "GENERAL", difficulty: "SIMPLE" },
          {
            title: "Help Mom or Dad",
            icon: "❤️",
            time: "17:45",
            kind: "HELPING",
            difficulty: "IMPORTANT",
            coins: 8,
            description: "Organize toys, set the table, tidy my room or help my sibling",
          },
        ],
      },
      {
        name: "Evening",
        icon: "🌙",
        category: "EVENING",
        daysMask: EVERY_DAY,
        tasks: [
          { title: "Dinner with family", icon: "🍽️", time: "18:00", kind: "MEAL", difficulty: "NORMAL" },
          prayer("MAGHRIB", "Maghrib", "18:30"),
          quran("18:45", 10),
          {
            title: "Creative time",
            icon: "🎨",
            time: "19:00",
            kind: "CREATIVE",
            difficulty: "SIMPLE",
            isRequired: false,
            description: "Drawing, crafts, puzzle, LEGO or writing",
          },
          { title: "Tidy toys & bedroom", icon: "🧸", time: "19:30", kind: "HELPING", difficulty: "NORMAL" },
          { title: "Shower time", icon: "🚿", time: "19:45", kind: "HYGIENE", difficulty: "NORMAL" },
          { title: "Brush my teeth", icon: "🦷", time: "20:00", kind: "TEETH", difficulty: "NORMAL" },
          prayer("ISHA", "Isha", "20:05"),
          { title: "Evening adhkar", icon: "🤲", time: "20:15", kind: "ADHKAR", difficulty: "NORMAL" },
          { title: "Bedtime story", icon: "📚", time: "20:20", kind: "READING", difficulty: "SIMPLE" },
          { title: "Hug Mom and Dad", icon: "🤗", time: "20:30", kind: "MANNERS", difficulty: "SIMPLE" },
          { title: "Sleep", icon: "😴", time: "20:35", kind: "SLEEP", difficulty: "NORMAL" },
        ],
      },
      {
        name: "Good Habits",
        icon: "✨",
        category: "CUSTOM",
        daysMask: EVERY_DAY,
        tasks: [
          { title: "Say Bismillah before eating", icon: "🤲", kind: "MANNERS", difficulty: "SIMPLE", isRequired: false },
          { title: "Say Alhamdulillah", icon: "🙏", kind: "MANNERS", difficulty: "SIMPLE", isRequired: false },
          { title: "Say something nice", icon: "💬", kind: "MANNERS", difficulty: "SIMPLE", isRequired: false },
          { title: "Be kind to my sibling", icon: "😊", kind: "MANNERS", difficulty: "NORMAL", isRequired: false },
          { title: "Learn something new", icon: "🧠", kind: "GENERAL", difficulty: "NORMAL", isRequired: false },
          {
            title: "Charity & kindness",
            icon: "💝",
            kind: "MANNERS",
            difficulty: "SPECIAL",
            isRequired: false,
            daysMask: FRIDAY,
            description: "Share, give sadaqah or do a secret kindness",
          },
        ],
      },
    ],
  },
  {
    key: "weekend",
    name: "Weekend Routine",
    icon: "🎈",
    description: "Relaxed Saturday & Sunday with family time and outdoor fun.",
    routines: [
      {
        name: "Weekend",
        icon: "🎈",
        category: "WEEKEND",
        daysMask: WEEKEND,
        tasks: [
          { title: "Wake up", icon: "🌞", time: "07:30", kind: "SLEEP", difficulty: "SIMPLE" },
          prayer("FAJR", "Fajr", "07:35"),
          { title: "Brush my teeth", icon: "🦷", time: "07:45", kind: "TEETH", difficulty: "NORMAL" },
          { title: "Breakfast", icon: "🥞", time: "08:30", kind: "MEAL", difficulty: "NORMAL" },
          quran("09:00", 10),
          { title: "Clean my bedroom", icon: "🧹", time: "09:30", kind: "HELPING", difficulty: "NORMAL" },
          { title: "Help my parents", icon: "❤️", time: "10:00", kind: "HELPING", difficulty: "IMPORTANT", coins: 8 },
          { title: "Reading time", icon: "📖", time: "11:00", kind: "READING", difficulty: "NORMAL", coins: 3 },
          prayer("DHUHR", "Dhuhr", "13:00"),
          { title: "Outdoor activity", icon: "🚲", time: "14:00", kind: "EXERCISE", difficulty: "NORMAL" },
          prayer("ASR", "Asr", "15:50"),
          { title: "Creative activity", icon: "🎨", time: "16:15", kind: "CREATIVE", difficulty: "SIMPLE" },
          { title: "Family time", icon: "👨‍👩‍👧", time: "17:00", kind: "MANNERS", difficulty: "NORMAL" },
        ],
      },
    ],
  },
  {
    key: "simple",
    name: "Simple Routine",
    icon: "🌈",
    description: "A short, gentle routine to get started.",
    routines: [
      {
        name: "Morning",
        icon: "🌅",
        category: "MORNING",
        daysMask: EVERY_DAY,
        tasks: [
          { title: "Wake up", icon: "🌞", time: "07:00", kind: "SLEEP", difficulty: "SIMPLE" },
          { title: "Make my bed", icon: "🛏️", time: "07:05", kind: "HELPING", difficulty: "SIMPLE" },
          { title: "Brush my teeth", icon: "🦷", time: "07:15", kind: "TEETH", difficulty: "NORMAL" },
          { title: "Get dressed", icon: "👕", time: "07:20", kind: "HYGIENE", difficulty: "SIMPLE" },
          { title: "Breakfast", icon: "🥣", time: "07:30", kind: "MEAL", difficulty: "NORMAL" },
        ],
      },
      {
        name: "Evening",
        icon: "🌙",
        category: "EVENING",
        daysMask: EVERY_DAY,
        tasks: [
          { title: "Dinner", icon: "🍽️", time: "18:00", kind: "MEAL", difficulty: "NORMAL" },
          { title: "Shower", icon: "🚿", time: "19:30", kind: "HYGIENE", difficulty: "NORMAL" },
          { title: "Brush my teeth", icon: "🦷", time: "20:00", kind: "TEETH", difficulty: "NORMAL" },
          { title: "Bedtime story", icon: "📚", time: "20:15", kind: "READING", difficulty: "SIMPLE" },
          { title: "Sleep", icon: "😴", time: "20:30", kind: "SLEEP", difficulty: "NORMAL" },
        ],
      },
    ],
  },
  {
    key: "school",
    name: "School Routine",
    icon: "🏫",
    description: "Bag, homework and reading on school days.",
    routines: [
      {
        name: "School Day",
        icon: "🏫",
        category: "SCHOOL",
        daysMask: WEEKDAYS,
        tasks: [
          { title: "Prepare my school bag", icon: "🎒", time: "07:50", kind: "SCHOOL", difficulty: "NORMAL" },
          { title: "Go to school", icon: "🏫", time: "08:00", kind: "SCHOOL", difficulty: "NORMAL" },
          { title: "Homework", icon: "📚", time: "16:20", kind: "HOMEWORK", difficulty: "IMPORTANT" },
          { title: "Read a book", icon: "📖", time: "17:00", kind: "READING", difficulty: "NORMAL" },
          { title: "Lay out tomorrow's clothes", icon: "👗", time: "19:30", kind: "HELPING", difficulty: "SIMPLE" },
        ],
      },
    ],
  },
  {
    key: "ramadan",
    name: "Ramadan Routine",
    icon: "🏮",
    description: "Suhoor, Iftar, Taraweeh and a charity challenge. Starts switched off — turn it on during Ramadan.",
    routines: [
      {
        name: "Ramadan",
        icon: "🏮",
        category: "RAMADAN",
        daysMask: EVERY_DAY,
        isActive: false,
        tasks: [
          { title: "Suhoor", icon: "🌙", time: "05:00", kind: "MEAL", difficulty: "NORMAL", isRequired: false },
          prayer("FAJR", "Fajr", "05:45"),
          quran("06:00", 10),
          { title: "Dhikr", icon: "📿", time: "06:20", kind: "ADHKAR", difficulty: "NORMAL" },
          { title: "Help prepare Iftar", icon: "🍲", time: "17:30", kind: "HELPING", difficulty: "IMPORTANT", coins: 8 },
          prayer("MAGHRIB", "Maghrib", "18:30"),
          { title: "Iftar with family", icon: "🍉", time: "18:35", kind: "MEAL", difficulty: "NORMAL" },
          prayer("ISHA", "Isha", "20:00"),
          { title: "Taraweeh", icon: "✨", time: "20:15", kind: "PRAYER", difficulty: "SPECIAL", isRequired: false },
          { title: "Charity challenge", icon: "💝", kind: "MANNERS", difficulty: "SPECIAL", description: "Share something or help someone today" },
        ],
      },
    ],
  },
];

export function getTemplate(key: string): TemplateSet | undefined {
  return TEMPLATES.find((t) => t.key === key);
}

/** Expand a task template into concrete DB fields. */
export function taskFields(t: TaskTemplate, sortOrder: number) {
  const difficulty = t.difficulty ?? "NORMAL";
  const preset = DIFFICULTY_PRESETS[difficulty];
  return {
    title: t.title,
    icon: t.icon,
    time: t.time ?? null,
    description: t.description ?? null,
    kind: t.kind ?? "GENERAL",
    difficulty,
    xp: t.xp ?? preset.xp,
    coins: t.coins ?? preset.coins,
    isRequired: t.isRequired ?? true,
    daysMask: t.daysMask ?? EVERY_DAY,
    prayerName: t.prayerName ?? null,
    quranMinutes: t.quranMinutes ?? null,
    sortOrder,
  };
}
