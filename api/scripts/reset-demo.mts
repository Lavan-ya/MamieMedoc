// Demo reset: wipes one patient's medicines, prescriptions, doses and refills,
// then recreates a clean demo (3 medicines + N days of perfect history).
// Jeanne herself, her family profiles, logins and push subscriptions are kept,
// so her id (2) does not change and the frontend keeps working.
//
//   npm run reset:demo                    # patient 2, 6 days of history
//   npm run reset:demo -- --days 13
//   npm run reset:demo -- --dry-run       # only print what would be deleted
//
// Shared database: tell the team before running it.
import prismaClient from "@prisma/client";
import { addDays, localDateKey, localDateTime } from "../src/common/schedule.ts";

const { PrismaClient, DoseStatus, PrescriptionStatus, TimeOfDay } = prismaClient;
const prisma = new PrismaClient();

function option(name: string, fallback: number) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : Number(process.argv[index + 1]);
}
const patientId = option("patient", 2);
const days = option("days", 6);
const dryRun = process.argv.includes("--dry-run");

// Taken a few minutes after the reminder, like a real routine.
const takenAt = (scheduledAt: Date) =>
  new Date(scheduledAt.getTime() + (3 + Math.floor(Math.random() * 15)) * 60_000);

const DEMO_MEDICATIONS = [
  {
    name: "Kardégic", strength: "75 mg", form: "Sachet", doseQuantity: 1, doseUnit: "sachet",
    activeIngredient: "Acétylsalicylate de lysine", purpose: "Blood thinner",
    instruction: "dissolved in a glass of water", mealInstruction: "After breakfast",
    appearance: "White paper sachet", stockDoses: 21,
    slots: [{ timeOfDay: TimeOfDay.MORNING, time: "08:00" }],
  },
  {
    name: "Metformin", strength: "500 mg", form: "Tablet", doseQuantity: 1, doseUnit: "tablet",
    activeIngredient: "Metformin hydrochloride", purpose: "Glycemic regulation",
    instruction: "with a glass of water", mealInstruction: "During lunch",
    stockDoses: 5, // low stock -> refill alert for the demo
    slots: [{ timeOfDay: TimeOfDay.MIDDAY, time: "12:30" }],
  },
  {
    name: "Calcidiol", strength: "3 drops", form: "Drops", doseQuantity: 3, doseUnit: "drops",
    purpose: "Vitamin D", instruction: "in a little water", mealInstruction: "Before sleep",
    stockDoses: 25,
    slots: [{ timeOfDay: TimeOfDay.EVENING, time: "20:00" }],
  },
];

const patient = await prisma.patient.findUnique({ where: { id: patientId } });
if (!patient) {
  console.error(`Patient ${patientId} not found. Nothing changed.`);
  process.exit(1);
}

const ofPatient = { medication: { patientId } };
const counts = {
  refillRequests: await prisma.refillRequest.count({ where: ofPatient }),
  doseEvents: await prisma.doseEvent.count({ where: { slot: ofPatient } }),
  scheduleSlots: await prisma.scheduleSlot.count({ where: ofPatient }),
  medications: await prisma.medication.count({ where: { patientId } }),
  prescriptions: await prisma.prescription.count({ where: { patientId } }),
};
console.log(`Patient ${patientId}: ${patient.firstName} ${patient.lastName}`);
console.log("Will delete:", counts);
if (dryRun) {
  console.log("Dry run: nothing changed.");
  await prisma.$disconnect();
  process.exit(0);
}

const today = localDateKey();
const now = new Date();

await prisma.$transaction(
  async (tx) => {
    // FK-safe order; only this patient's rows.
    await tx.refillRequest.deleteMany({ where: ofPatient });
    await tx.doseEvent.deleteMany({ where: { slot: ofPatient } });
    await tx.scheduleSlot.deleteMany({ where: ofPatient });
    await tx.medication.deleteMany({ where: { patientId } });
    await tx.prescription.deleteMany({ where: { patientId } });

    const prescription = await tx.prescription.create({
      data: {
        patientId,
        doctorName: "Dr. Vasseur",
        doctorSpecialty: "General practitioner",
        pharmacyName: "Pharmacie du Parc",
        issuedAt: localDateTime(addDays(today, -days - 1), "09:00"),
        status: PrescriptionStatus.ACTIVE,
        ocrConfidence: 98.4,
      },
    });

    const doses: { slotId: number; scheduledAt: Date; status: any; takenAt: Date | null }[] = [];
    for (const { slots, ...fields } of DEMO_MEDICATIONS) {
      const medication = await tx.medication.create({
        data: {
          ...fields,
          patientId,
          prescriptionId: prescription.id,
          matchedInDatabase: true,
          slots: { create: slots },
        },
        include: { slots: true },
      });
      for (const slot of medication.slots) {
        // Past days: every dose taken on time.
        for (let offset = days; offset >= 1; offset -= 1) {
          const scheduledAt = localDateTime(addDays(today, -offset), slot.time);
          doses.push({ slotId: slot.id, scheduledAt, status: DoseStatus.TAKEN, takenAt: takenAt(scheduledAt) });
        }
        // Today: doses whose time has passed are taken; later ones stay
        // pending (the app creates them) so they can be ticked live in the demo.
        const todayAt = localDateTime(today, slot.time);
        if (todayAt < now) {
          doses.push({ slotId: slot.id, scheduledAt: todayAt, status: DoseStatus.TAKEN, takenAt: takenAt(todayAt) });
        }
      }
    }
    await tx.doseEvent.createMany({ data: doses });
    console.log(`Created 1 prescription, ${DEMO_MEDICATIONS.length} medicines, ${doses.length} dose events.`);
  },
  { timeout: 30_000 },
);

console.log("Demo data ready. Reload the app.");
await prisma.$disconnect();
