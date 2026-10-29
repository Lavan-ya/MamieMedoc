// Demo history: Jeanne took every scheduled medicine on each of the last N days.
// Fills the family dashboard's 7-Day Adherence Journey and grows her plant.
//
//   npm run seed:history                 # last 7 days, patient 2
//   npm run seed:history -- --days 14
//   npm run seed:history -- --dry-run    # print what would change
//
// Today is never touched, and the home stock is not changed. Safe to re-run:
// doses are matched on (slot, scheduled time).
import prismaClient from "@prisma/client";
import { localDateKey, localDateTime } from "../src/common/schedule.ts";

const { PrismaClient, DoseStatus } = prismaClient;
const prisma = new PrismaClient();

function option(name: string, fallback: number) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : Number(process.argv[index + 1]);
}
const days = option("days", 7);
const patientId = option("patient", 2);
const dryRun = process.argv.includes("--dry-run");

const DAY_MS = 86_400_000;
const dayKeys = Array.from({ length: days }, (_, index) =>
  localDateKey(new Date(Date.now() - (days - index) * DAY_MS)),
);
const from = localDateTime(dayKeys[0], "00:00");
const to = localDateTime(localDateKey(), "00:00"); // start of today, excluded

// Taken a few minutes after the reminder, like a real morning routine.
function takenAt(scheduledAt: Date) {
  return new Date(scheduledAt.getTime() + (2 + Math.floor(Math.random() * 20)) * 60_000);
}

const medications = await prisma.medication.findMany({
  where: { patientId, isActive: true, asNeeded: false },
  include: { slots: { where: { isActive: true } } },
});

let created = 0;
let completed = 0;
for (const medication of medications) {
  for (const slot of medication.slots) {
    for (const day of dayKeys) {
      const scheduledAt = localDateTime(day, slot.time);
      const existing = await prisma.doseEvent.findUnique({
        where: { slotId_scheduledAt: { slotId: slot.id, scheduledAt } },
      });
      if (existing?.status === DoseStatus.TAKEN) continue;
      if (existing) completed += 1;
      else created += 1;
      if (dryRun) continue;
      await prisma.doseEvent.upsert({
        where: { slotId_scheduledAt: { slotId: slot.id, scheduledAt } },
        create: { slotId: slot.id, scheduledAt, status: DoseStatus.TAKEN, takenAt: takenAt(scheduledAt) },
        update: { status: DoseStatus.TAKEN, takenAt: takenAt(scheduledAt), snoozedUntil: null },
      });
    }
  }
}

// Doses of medicines stopped since then (still in the history) count too.
const otherOpen = await prisma.doseEvent.findMany({
  where: {
    status: { in: [DoseStatus.PENDING, DoseStatus.MISSED] },
    scheduledAt: { gte: from, lt: to },
    slot: { medication: { patientId, asNeeded: false } },
  },
  select: { id: true, scheduledAt: true },
});
if (!dryRun) {
  for (const dose of otherOpen) {
    await prisma.doseEvent.update({
      where: { id: dose.id },
      data: { status: DoseStatus.TAKEN, takenAt: takenAt(dose.scheduledAt), snoozedUntil: null },
    });
  }
}

console.log(
  `${dryRun ? "[dry run] " : ""}Patient ${patientId}, ${dayKeys[0]} to ${dayKeys.at(-1)}: ` +
    `${created} doses added as taken, ${completed + otherOpen.length} missed/pending doses marked taken ` +
    `(${medications.length} active medications).`,
);
await prisma.$disconnect();
