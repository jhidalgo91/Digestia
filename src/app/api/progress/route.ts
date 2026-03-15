import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { z } from "zod";

const progressCreateSchema = z.object({
  patientId: z.string().min(1),
  date: z.string().min(1),
  weight: z.number().min(0).max(500).optional(),
  bodyFatPercent: z.number().min(0).max(100).optional(),
  muscleMassKg: z.number().min(0).max(200).optional(),
  waistCm: z.number().min(0).max(300).optional(),
  hipCm: z.number().min(0).max(300).optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
  hungerLevel: z.number().int().min(1).max(10).optional(),
  moodLevel: z.number().int().min(1).max(10).optional(),
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

  const logs = await prisma.progressLog.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const body = await request.json();
  const parsed = progressCreateSchema.safeParse(body);
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

  const log = await prisma.progressLog.upsert({
    where: { patientId_date: { patientId, date: new Date(date) } },
    create: { patientId, date: new Date(date), ...rest },
    update: { ...rest },
  });

  return NextResponse.json(log, { status: 201 });
}
