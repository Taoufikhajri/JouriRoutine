export type GameEvent =
  | { type: "task"; xp: number; coins: number; title: string; icon: string }
  | { type: "levelUp"; level: number; title: string; icon: string }
  | { type: "badge"; key: string; title: string; icon: string; description: string }
  | { type: "perfect"; bonus: number }
  | { type: "streak"; count: number }
  | { type: "chest"; chestType: "SMALL" | "GOLDEN"; coins: number; xp: number; item: { key: string; name: string; emoji: string } | null };
