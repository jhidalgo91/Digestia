import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const isRead = searchParams.get("isRead");

  const where: Record<string, unknown> = {};
  if (patientId) where.patientId = patientId;
  if (isRead !== null) where.isRead = isRead === "true";

  const alerts = await prisma.deviationAlert.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(alerts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const alert = await prisma.deviationAlert.create({
    data: body,
  });

  return NextResponse.json(alert, { status: 201 });
}
