import "dotenv/config";

import {
  DoseStatus,
  PrescriptionStatus,
  PrismaClient,
  RefillStatus,
  TimeOfDay,
} from "@prisma/client";

const prisma = new PrismaClient();
const TIME_ZONE = "Europe/Paris";

type ParisDate = {
  year: number;
  month: number;
  day: number;
};

type DoseEventInput = {
  slotId: number;
  scheduledAt: Date;
  status: DoseStatus;
  takenAt: Date | null;
};

function dateParts(date: Date, withTime = false) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23" as const,
        }
      : {}),
  });

  return Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
}

function parisToday(): ParisDate {
  const parts = dateParts(new Date());
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function addDays(date: ParisDate, days: number): ParisDate {
  const shifted = new Date(
    Date.UTC(date.year, date.month - 1, date.day + days),
  );

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function parisOffsetMs(date: Date) {
  const parts = dateParts(date, true);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - date.getTime();
}

function parisDateTime(
  date: ParisDate,
  hours: number,
  minutes: number,
): Date {
  const utcGuess = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    hours,
    minutes,
    0,
  );
  const firstOffset = parisOffsetMs(new Date(utcGuess));
  const firstResult = new Date(utcGuess - firstOffset);
  const secondOffset = parisOffsetMs(firstResult);

  return secondOffset === firstOffset
    ? firstResult
    : new Date(utcGuess - secondOffset);
}

function formatParisDate(date: ParisDate) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parisDateTime(date, 12, 0));
}

async function main() {
  const today = parisToday();
  const issuedOn = addDays(today, -10);

  console.log(
    `Seeding demo data for ${formatParisDate(today)} (${TIME_ZONE})...`,
  );

  const counts = await prisma.$transaction(async (tx) => {
    // Delete in FK-safe order. _prisma_migrations is never touched.
    await tx.refillRequest.deleteMany();
    await tx.doseEvent.deleteMany();
    await tx.scheduleSlot.deleteMany();
    await tx.medication.deleteMany();
    await tx.prescription.deleteMany();
    await tx.familyMember.deleteMany();
    await tx.patient.deleteMany();

    const patient = await tx.patient.create({
      data: {
        firstName: "Jeanne",
        lastName: "Dupont",
        birthDate: parisDateTime({ year: 1944, month: 3, day: 12 }, 0, 0),
        avatarUrl: "/images/jeanne.jpg",
      },
    });

    const lavanya = await tx.familyMember.create({
      data: {
        patientId: patient.id,
        firstName: "Lavanya",
        relation: "Daughter",
        phone: "+33 6 00 00 00 01",
        avatarUrl: "/images/lavanya.jpg",
        availability: "Available now",
        isPrimaryCaregiver: true,
        callOrder: 1,
      },
    });

    await tx.familyMember.create({
      data: {
        patientId: patient.id,
        firstName: "Amar",
        relation: "Son",
        phone: "+33 6 00 00 00 02",
        avatarUrl: "/images/amar.jpg",
        availability: "At home today",
        callOrder: 2,
      },
    });

    await tx.familyMember.create({
      data: {
        patientId: patient.id,
        firstName: "Sophie",
        relation: "Home nurse",
        phone: "+33 6 00 00 00 03",
        avatarUrl: "/images/sophie.jpg",
        callOrder: 3,
      },
    });

    const prescription = await tx.prescription.create({
      data: {
        patientId: patient.id,
        doctorName: "Dr. Vasseur",
        doctorSpecialty: "General practitioner",
        pharmacyName: "Pharmacie du Parc",
        issuedAt: parisDateTime(issuedOn, 9, 0),
        status: PrescriptionStatus.ACTIVE,
      },
    });

    const kardegic = await tx.medication.create({
      data: {
        patientId: patient.id,
        prescriptionId: prescription.id,
        name: "Kardégic",
        strength: "75 mg",
        form: "Sachet",
        doseQuantity: 1,
        doseUnit: "sachet",
        instruction: "dissolved in a glass of water",
        mealInstruction: "After breakfast",
        appearance: "White paper sachet",
        stockDoses: 20,
        slots: {
          create: [{ timeOfDay: TimeOfDay.MORNING, time: "08:00" }],
        },
      },
      include: { slots: true },
    });

    const tahor = await tx.medication.create({
      data: {
        patientId: patient.id,
        prescriptionId: prescription.id,
        name: "Tahor",
        strength: "20 mg",
        form: "Tablet",
        doseQuantity: 1,
        doseUnit: "tablet",
        instruction: "with a glass of water",
        mealInstruction: "During lunch",
        stockDoses: 4,
        slots: {
          create: [{ timeOfDay: TimeOfDay.MIDDAY, time: "12:30" }],
        },
      },
      include: { slots: true },
    });

    const calcidiol = await tx.medication.create({
      data: {
        patientId: patient.id,
        prescriptionId: prescription.id,
        name: "Calcidiol",
        strength: "3 drops",
        form: "Drops",
        doseQuantity: 3,
        doseUnit: "drops",
        instruction: "in a little water",
        mealInstruction: "Before sleep",
        stockDoses: 25,
        slots: {
          create: [{ timeOfDay: TimeOfDay.EVENING, time: "20:00" }],
        },
      },
      include: { slots: true },
    });

    await tx.refillRequest.create({
      data: {
        medicationId: tahor.id,
        familyMemberId: lavanya.id,
        plannedFor: "Thursday afternoon",
        status: RefillStatus.PLANNED,
      },
    });

    const doseEvents: DoseEventInput[] = [];

    for (const medication of [kardegic, tahor, calcidiol]) {
      const slot = medication.slots[0];
      if (!slot) {
        throw new Error(`No schedule slot created for ${medication.name}`);
      }

      const [hours, minutes] = slot.time.split(":").map(Number);

      for (let dayOffset = 14; dayOffset >= 1; dayOffset -= 1) {
        const day = addDays(today, -dayOffset);
        const scheduledAt = parisDateTime(day, hours, minutes);

        doseEvents.push({
          slotId: slot.id,
          scheduledAt,
          status: DoseStatus.TAKEN,
          takenAt: new Date(scheduledAt.getTime() + 5 * 60 * 1000),
        });
      }

      doseEvents.push({
        slotId: slot.id,
        scheduledAt: parisDateTime(today, hours, minutes),
        status: DoseStatus.PENDING,
        takenAt: null,
      });
    }

    await tx.doseEvent.createMany({ data: doseEvents });

    const [
      patients,
      familyMembers,
      prescriptions,
      medications,
      scheduleSlots,
      doseEventCount,
      refillRequests,
    ] = await Promise.all([
      tx.patient.count(),
      tx.familyMember.count(),
      tx.prescription.count(),
      tx.medication.count(),
      tx.scheduleSlot.count(),
      tx.doseEvent.count(),
      tx.refillRequest.count(),
    ]);

    return {
      patients,
      familyMembers,
      prescriptions,
      medications,
      scheduleSlots,
      doseEvents: doseEventCount,
      refillRequests,
    };
  });

  console.log("Seed complete.");
  console.log(JSON.stringify(counts, null, 2));
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
