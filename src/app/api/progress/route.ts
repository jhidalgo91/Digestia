import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProgressLogCreateInput } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
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
  const body: ProgressLogCreateInput = await request.json();
  const { patientId, date, ...rest } = body;

  if (!patientId || !date) {
    return NextResponse.json(
      { error: "patientId and date are required" },
      { status: 400 }
    );
  }

  const log = await prisma.progressLog.upsert({
    where: { patientId_date: { patientId, date: new Date(date) } },
    create: { patientId, date: new Date(date), ...rest },
    update: { ...rest },
  });

  return NextResponse.json(log, { status: 201 });
}
