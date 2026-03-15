import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const date = searchParams.get("date");

  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  const where: Record<string, unknown> = {
    patientId,
    isActive: true,
  };

  const supplements = await prisma.patientSupplement.findMany({
    where,
    include: {
      supplement: true,
      logs: date
        ? {
            where: { date: new Date(date) },
          }
        : undefined,
    },
    orderBy: { scheduledTime: "asc" },
  });

  return NextResponse.json(supplements);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { patientId, supplementId, ...rest } = body;

  if (!patientId || !supplementId) {
    return NextResponse.json(
      { error: "patientId and supplementId are required" },
      { status: 400 }
    );
  }

  const patientSupplement = await prisma.patientSupplement.create({
    data: { patientId, supplementId, ...rest },
    include: { supplement: true },
  });

  return NextResponse.json(patientSupplement, { status: 201 });
}
