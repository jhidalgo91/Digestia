import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { z } from "zod";

const habitCreateSchema = z.object({
  patientId: z.string().min(1),
  date: z.string().min(1),
  sleepHours: z.number().min(0).max(24).optional(),
  bedtime: z.string().optional(),
  wakeTime: z.string().optional(),
  lastMealTime: z.string().optional(),
  breakfastTime: z.string().optional(),
  waterGlasses: z.number().int().min(0).optional(),
  strengthSessions: z.number().int().min(0).optional(),
  cardioMinutes: z.number().min(0).optional(),
  cardioAvgBpm: z.number().int().min(0).optional(),
  naturalLightMinutes: z.number().min(0).optional(),
  naturalLightMorning: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

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

  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const habits = await prisma.habitLog.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(habits);
}

export async function POST(request: NextRequest) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const body = await request.json();
  const parsed = habitCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { patientId, date, ...rest } = parsed.data;

  // Ownership check
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: session!.user.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const habitFields = {
    ...(rest.bedtime ? { bedtime: new Date(rest.bedtime) } : {}),
    ...(rest.wakeTime ? { wakeTime: new Date(rest.wakeTime) } : {}),
    ...(rest.lastMealTime ? { lastMealTime: new Date(rest.lastMealTime) } : {}),
    ...(rest.breakfastTime ? { breakfastTime: new Date(rest.breakfastTime) } : {}),
    sleepHours: rest.sleepHours,
    waterGlasses: rest.waterGlasses,
    strengthSessions: rest.strengthSessions,
    cardioMinutes: rest.cardioMinutes,
    cardioAvgBpm: rest.cardioAvgBpm,
    naturalLightMinutes: rest.naturalLightMinutes,
    naturalLightMorning: rest.naturalLightMorning,
    notes: rest.notes,
  };

  const habit = await prisma.habitLog.upsert({
    where: { patientId_date: { patientId, date: new Date(date) } },
    create: { patientId, date: new Date(date), ...habitFields },
    update: habitFields,
  });

  return NextResponse.json(habit, { status: 201 });
}
