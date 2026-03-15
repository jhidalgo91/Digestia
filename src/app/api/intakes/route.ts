import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { z } from "zod";

const intakeCreateSchema = z.object({
  patientId: z.string().min(1),
  date: z.string().min(1),
  mealType: z.enum([
    "BREAKFAST",
    "LUNCH",
    "DINNER",
    "SNACK",
    "PRE_WORKOUT",
    "POST_WORKOUT",
  ]),
  plannedMealId: z.string().optional(),
  status: z
    .enum(["PLANNED", "COMPLETED", "MODIFIED", "SKIPPED"])
    .optional(),
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

export async function GET(request: NextRequest) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const date = searchParams.get("date");

  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  // Ownership check
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: session!.user.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where: Record<string, unknown> = { patientId };

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }

  const intakes = await prisma.intake.findMany({
    where,
    include: { plannedMeal: true, foodItems: { include: { foodItem: true } } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(intakes);
}

export async function POST(request: NextRequest) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const body = await request.json();
  const parsed = intakeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { patientId, date, mealType, ...rest } = parsed.data;

  // Ownership check
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: session!.user.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const intake = await prisma.intake.create({
    data: {
      patientId,
      date: new Date(date),
      mealType,
      ...rest,
    },
  });

  return NextResponse.json(intake, { status: 201 });
}
