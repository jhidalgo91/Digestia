import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nutritionistId = searchParams.get("nutritionistId");

  if (!nutritionistId) {
    return NextResponse.json(
      { error: "nutritionistId is required" },
      { status: 400 }
    );
  }

  const patients = await prisma.patient.findMany({
    where: { nutritionistId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      mealPlans: { where: { isActive: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(patients);
}
