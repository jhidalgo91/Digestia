import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { z } from "zod";

const addSchema = z.object({
  patientId: z.string().min(1),
  supplementName: z.string().min(1).max(200),
  doseMg: z.number().min(0).optional(),
  doseUnit: z.string().max(50).optional(),
  scheduledTime: z.string().max(10).optional(),
  frequency: z.string().max(100).optional(),
});

/**
 * POST /api/supplements/add
 * Creates (or reuses) a Supplement catalog entry and links it to the patient.
 */
export async function POST(request: NextRequest) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const body = await request.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { patientId, supplementName, doseMg, doseUnit, scheduledTime, frequency } = parsed.data;

  // Ownership check
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: session!.user.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find or create the supplement in the catalog (by name, case-insensitive)
  let supplement = await prisma.supplement.findFirst({
    where: { name: { equals: supplementName } },
  });
  if (!supplement) {
    supplement = await prisma.supplement.create({
      data: { name: supplementName, defaultDoseUnit: doseUnit ?? null },
    });
  }

  const patientSupplement = await prisma.patientSupplement.create({
    data: {
      patientId,
      supplementId: supplement.id,
      doseMg: doseMg ?? null,
      doseUnit: doseUnit ?? null,
      scheduledTime: scheduledTime || null,
      frequency: frequency ?? null,
      isActive: true,
    },
    include: { supplement: true },
  });

  return NextResponse.json(patientSupplement, { status: 201 });
}
