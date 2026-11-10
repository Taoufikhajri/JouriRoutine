import type { AvatarSlot } from "@prisma/client";

export const AVATARS = [
  { key: "explorer", name: "Girl Explorer", emoji: "👧", color: "#ffd6e7" },
  { key: "hijabi", name: "Little Muslimah", emoji: "🧕", color: "#d8f3dc" },
  { key: "scientist", name: "Young Scientist", emoji: "👩‍🔬", color: "#cde7ff" },
  { key: "artist", name: "Young Artist", emoji: "👩‍🎨", color: "#fff1b8" },
  { key: "princess", name: "Princess Explorer", emoji: "👸", color: "#e9d5ff" },
  { key: "astronaut", name: "Space Explorer", emoji: "👩‍🚀", color: "#c7d2fe" },
  { key: "forest", name: "Forest Adventurer", emoji: "🧝‍♀️", color: "#bbf7d0" },
  { key: "boy-explorer", name: "Boy Explorer", emoji: "👦", color: "#bae6fd" },
] as const;

export interface AvatarItemDef {
  key: string;
  name: string;
  emoji: string;
  slot: AvatarSlot;
  cost?: number;
  achievementKey?: string;
}

export const AVATAR_ITEMS: AvatarItemDef[] = [
  { key: "hat-bow", name: "Pink Bow", emoji: "🎀", slot: "HAT" },
  { key: "hat-flower", name: "Flower Crown", emoji: "🌸", slot: "HAT", cost: 40 },
  { key: "hat-cap", name: "Explorer Cap", emoji: "🧢", slot: "HAT", cost: 30 },
  { key: "hat-crown", name: "Star Crown", emoji: "👑", slot: "HAT", achievementKey: "perfect-day" },
  { key: "acc-sparkles", name: "Sparkles", emoji: "✨", slot: "ACCESSORY" },
  { key: "acc-wand", name: "Magic Wand", emoji: "🪄", slot: "ACCESSORY", cost: 60 },
  { key: "acc-backpack", name: "Adventure Bag", emoji: "🎒", slot: "ACCESSORY", cost: 50 },
  { key: "acc-telescope", name: "Star Telescope", emoji: "🔭", slot: "ACCESSORY", cost: 70 },
  { key: "pet-kitty", name: "Kitty", emoji: "🐱", slot: "COMPANION" },
  { key: "pet-butterfly", name: "Butterfly", emoji: "🦋", slot: "COMPANION", cost: 20 },
  { key: "pet-bunny", name: "Bunny", emoji: "🐰", slot: "COMPANION", cost: 40 },
  { key: "pet-owl", name: "Wise Owl", emoji: "🦉", slot: "COMPANION", achievementKey: "book-worm" },
  { key: "pet-unicorn", name: "Unicorn", emoji: "🦄", slot: "COMPANION", achievementKey: "streak-7" },
  { key: "frame-cloud", name: "Cloud Frame", emoji: "☁️", slot: "FRAME" },
  { key: "frame-rainbow", name: "Rainbow Frame", emoji: "🌈", slot: "FRAME", cost: 80 },
  { key: "frame-moon", name: "Moon Frame", emoji: "🌙", slot: "FRAME", achievementKey: "prayer-star" },
];

export const FREE_ITEM_KEYS = AVATAR_ITEMS.filter((i) => !i.cost && !i.achievementKey).map((i) => i.key);
