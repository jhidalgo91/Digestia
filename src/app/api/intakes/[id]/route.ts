import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { z } from "zod";

const intakePatchSchema = z.object({
  mealType: z
    .enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT"])
    .optional(),
  status: z.enum(["PLANNED", "COMPLETED", "MODIFIED", "SKIPPED"]).optional(),
  planDescription: z.string().max(2000).optional(),
  actualDescription: z.string().max(2000).optional(),
  photoUrl: z.string().url().optional(),
  digestiveFeedback: z.enum(["GOOD", "NEUTRAL", "BAD"]).optional(),
  hasGas: z.boolean().optional(),
  processedFoodType: z
    .enum(["GOOD_PROCESSED", "ULTRA_PROCESSED", "NEUTRAL"])
    .optional(),
  extraFat10g: z.number().int().min(0).optional(),
  extraProtein10g: z.number().int().min(0).optional(),
  extraFruit: z.number().int().min(0).optional(),
  extremeHunger: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { id } = await params;
  const intake = await prisma.intake.findUnique({
    where: { id },
    include: { plannedMeal: true, foodItems: { include: { foodItem: true } } },
  });

  if (!intake) {
    return NextResponse.json({ error: "Intake not found" }, { status: 404 });
  }

  // Ownership check: verify the patient belongs to the session user
  const patient = await prisma.patient.findFirst({
    where: { id: intake.patientId, userId: session!.user.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(intake);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { id } = await params;

  // Fetch first to check ownership
  const existing = await prisma.intake.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Intake not found" }, { status: 404 });
  }

  const patient = await prisma.patient.findFirst({
    where: { id: existing.patientId, userId: session!.user.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = intakePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const intake = await prisma.intake.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(intake);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { id } = await params;

  const existing = await prisma.intake.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Intake not found" }, { status: 404 });
  }

  const patient = await prisma.patient.findFirst({
    where: { id: existing.patientId, userId: session!.user.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.intake.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
