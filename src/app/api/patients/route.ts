import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";

export async function GET(request: NextRequest) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const nutritionistId = searchParams.get("nutritionistId");

  if (!nutritionistId) {
    return NextResponse.json(
      { error: "nutritionistId is required" },
      { status: 400 }
    );
  }

  // Ownership check: the nutritionist record must belong to the session user
  const nutritionist = await prisma.nutritionist.findFirst({
    where: { id: nutritionistId, userId: session!.user.id },
  });
  if (!nutritionist) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
