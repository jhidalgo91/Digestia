import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { z } from "zod";

const plannedMealSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT"]),
  description: z.string().min(1).max(2000),
  colorTag: z.enum(["BLUE_PROTEIN", "ORANGE_CARBS", "GREEN_VEGGIES", "NEUTRAL"]).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

const mealPlanSchema = z.object({
  patientId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  plannedMeals: z.array(plannedMealSchema).optional(),
});

export async function GET(request: NextRequest) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  // Ownership check
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: session!.user.id },
  });
  if (!patient && session!.user.role === "PATIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plans = await prisma.mealPlan.findMany({
    where: { patientId, isActive: true },
    include: { plannedMeals: { orderBy: [{ dayOfWeek: "asc" }, { orderIndex: "asc" }] } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(plans);
}

export async function POST(request: NextRequest) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const body = await request.json();
  const parsed = mealPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { patientId, name, description, startDate, endDate, plannedMeals } = parsed.data;

  // Ownership check: own patient or nutritionist
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      OR: [
        { userId: session!.user.id },
        { nutritionist: { userId: session!.user.id } },
      ],
    },
  });
  if (!patient && session!.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve nutritionist id if applicable
  const nutritionist =
    session!.user.role === "NUTRITIONIST"
      ? await prisma.nutritionist.findUnique({ where: { userId: session!.user.id } })
      : null;

  const plan = await prisma.mealPlan.create({
    data: {
      patientId,
      nutritionistId: nutritionist?.id ?? null,
      name,
      description: description ?? null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isActive: true,
      plannedMeals: plannedMeals && plannedMeals.length > 0
        ? {
          create: plannedMeals.map((m) => ({
            dayOfWeek: m.dayOfWeek ?? null,
            mealType: m.mealType,
            description: m.description,
            colorTag: m.colorTag ?? "NEUTRAL",
            orderIndex: m.orderIndex ?? 0,
          })),
        }
        : undefined,
    },
    include: { plannedMeals: true },
  });

  return NextResponse.json(plan, { status: 201 });
}
