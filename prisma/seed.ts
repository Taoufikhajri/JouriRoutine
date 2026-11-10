/**
 * Development seed. Creates a demo family that works right after install.
 *
 *   ⚠️  DEVELOPMENT-ONLY CREDENTIALS — never use these in production.
 *   Parent:  parent@example.com / DemoParent123!
 *   Child:   family code STAR-1234, username Jouri, PIN 1234
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_REWARDS } from "../src/server/catalog/rewards";
import { applyTemplate, grantStarterItems, syncCatalogs } from "../src/server/services/family";
import { completeMission } from "../src/server/services/missions";
import { scheduledRoutines, updateStreak } from "../src/server/services/progress";
import { addDays, todayIn } from "../src/lib/dates";

const db = new PrismaClient();

// Deterministic pseudo-random so the demo looks the same every time.
let seedState = 42;
const rnd = () => {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
};

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed demo data in production.");

  console.log("🧹 Clearing database…");
  await db.family.deleteMany();
  await db.user.deleteMany();

  console.log("📚 Syncing catalogs (badges, avatars, items)…");
  await syncCatalogs(db);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const family = await db.family.create({
    data: { name: "Our Family", loginCode: "STAR-1234", timezone, onboardedAt: new Date() },
  });

  await db.user.create({
    data: {
      role: "PARENT",
      email: "parent@example.com",
      passwordHash: await bcrypt.hash("DemoParent123!", 12),
      parentProfile: { create: { familyId: family.id, displayName: "Mom" } },
    },
  });

  const childUser = await db.user.create({
    data: {
      role: "CHILD",
      username: "jouri",
      passwordHash: await bcrypt.hash("1234", 10),
      childProfile: { create: { familyId: family.id, name: "Jouri", loginName: "jouri", age: 7, avatarKey: "hijabi" } },
    },
    include: { childProfile: true },
  });
  const child = childUser.childProfile!;

  console.log("🗓  Applying routine templates…");
  await applyTemplate(db, child.id, "muslim-daily");
  await applyTemplate(db, child.id, "weekend");
  await applyTemplate(db, child.id, "ramadan"); // switched off by default
  await grantStarterItems(db, child.id);

  await db.reward.createMany({ data: DEFAULT_REWARDS.map((r, i) => ({ ...r, familyId: family.id, sortOrder: i })) });

  await db.quranMemorization.createMany({
    data: [
      { childId: child.id, surah: "Al-Fatiha", progress: 100, sortOrder: 0 },
      { childId: child.id, surah: "Al-Ikhlas", progress: 80, sortOrder: 1 },
      { childId: child.id, surah: "Al-Falaq", progress: 40, sortOrder: 2 },
      { childId: child.id, surah: "An-Nas", progress: 20, sortOrder: 3 },
    ],
  });

  console.log("⭐ Generating 10 days of history…");
  const today = todayIn(timezone);
  for (let back = 10; back >= 1; back--) {
    const date = addDays(today, -back);
    // Day -10 and -9 are "getting started" days; the last 7 days build a streak.
    const rate = back >= 9 ? 0.55 : back === 4 ? 0.88 : 1;
    const routines = await scheduledRoutines(db, child.id, date);
    for (const r of routines) {
      for (const t of r.tasks) {
        const chance = t.isRequired ? rate : rate * 0.6;
        if (rnd() < chance) {
          await completeMission(db, child.id, t.id, date);
          // Backdate to roughly the scheduled time so history looks natural.
          const [h, m] = (t.time ?? "12:00").split(":").map(Number);
          const at = new Date(`${date}T00:00:00`);
          at.setHours(h, m + ((h * 7 + m) % 9));
          await db.taskCompletion.updateMany({ where: { childId: child.id, taskId: t.id, date }, data: { completedAt: at } });
        }
      }
    }
  }
  await updateStreak(db, child.id, today);

  // One pending wish so the approval flow is visible right away.
  const iceCream = await db.reward.findFirstOrThrow({ where: { familyId: family.id, title: "Ice cream" } });
  await db.rewardRedemption.create({
    data: { childId: child.id, rewardId: iceCream.id, cost: iceCream.cost, rewardTitle: iceCream.title, rewardIcon: iceCream.icon },
  });
  await db.notification.updateMany({ where: { familyId: family.id }, data: { readAt: new Date() } });
  await db.notification.create({
    data: { familyId: family.id, type: "REWARD_REQUESTED", title: "🍦 Jouri would like: Ice cream", body: "50 coins — waiting for your approval" },
  });

  const final = await db.childProfile.findUniqueOrThrow({ where: { id: child.id } });
  console.log(`✅ Seeded. Jouri: ${final.xp} XP, ${final.coins} coins, streak ${final.currentStreak}.`);
  console.log("\n⚠️  DEVELOPMENT-ONLY demo credentials:");
  console.log("   Parent → parent@example.com / DemoParent123!");
  console.log("   Child  → family code STAR-1234 · username Jouri · PIN 1234\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
