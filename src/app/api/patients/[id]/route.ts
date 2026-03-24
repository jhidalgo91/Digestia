import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { id } = await params;

  // Resolve the requesting user's nutritionist profile
  const nutritionist = await prisma.nutritionist.findUnique({
    where: { userId: session!.user.id },
  });

  // Allow the patient themselves OR their assigned nutritionist OR an admin
  const isAdmin = session!.user.role === "ADMIN";

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, image: true, role: true } },
      intakes: {
        take: 20,
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          mealType: true,
          status: true,
          actualDescription: true,
          digestiveFeedback: true,
        },
      },
      habits: {
        take: 10,
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          sleepHours: true,
          waterGlasses: true,
          strengthSessions: true,
          cardioMinutes: true,
          naturalLightMorning: true,
          naturalLightMinutes: true,
          notes: true,
        },
      },
      progressLogs: {
        take: 10,
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          weight: true,
          bodyFatPercent: true,
          muscleMassKg: true,
          waistCm: true,
          energyLevel: true,
          hungerLevel: true,
          moodLevel: true,
        },
      },
    },
  });

  if (!patient)
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });

  // Security: only the patient themselves, their nutritionist, or an admin can read this
  const isOwnPatient = patient.userId === session!.user.id;
  const isAssignedNutritionist =
    nutritionist && patient.nutritionistId === nutritionist.id;

  if (!isOwnPatient && !isAssignedNutritionist && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch alerts separately
  const alerts = await prisma.deviationAlert.findMany({
    where: { patientId: id },
    take: 20,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      message: true,
      isRead: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ...patient, alerts });
}
