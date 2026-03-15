import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const intake = await prisma.intake.findUnique({
    where: { id },
    include: { plannedMeal: true, foodItems: { include: { foodItem: true } } },
  });

  if (!intake) {
    return NextResponse.json({ error: "Intake not found" }, { status: 404 });
  }

  return NextResponse.json(intake);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const intake = await prisma.intake.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(intake);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.intake.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
