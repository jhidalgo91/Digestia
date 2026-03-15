import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IntakeCreateInput } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const date = searchParams.get("date");

  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
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
  const body: IntakeCreateInput = await request.json();

  const { patientId, date, mealType, ...rest } = body;

  if (!patientId || !date || !mealType) {
    return NextResponse.json(
      { error: "patientId, date and mealType are required" },
      { status: 400 }
    );
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
