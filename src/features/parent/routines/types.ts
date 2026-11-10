export interface BuilderTask {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  time: string | null;
  kind: string;
  difficulty: string;
  xp: number;
  coins: number;
  isRequired: boolean;
  isActive: boolean;
  daysMask: number;
  prayerName: string | null;
  quranMinutes: number | null;
  quranPages: number | null;
  quranSurah: string | null;
}

export interface BuilderRoutine {
  id: string;
  name: string;
  icon: string;
  category: string;
  isActive: boolean;
  daysMask: number;
  tasks: BuilderTask[];
}
