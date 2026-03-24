import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { sendAlertEmail } from "@/lib/notifications";
import { z } from "zod";

const alertCreateSchema = z.object({
  patientId: z.string().optional(),
  nutritionistId: z.string().optional(),
  type: z.enum([
    "CARBS_AT_DINNER",
    "LOW_ADHERENCE",
    "BAD_DIGESTION",
    "MISSING_LOGS",
    "EXTREME_HUNGER",
    "GAS_LEGUMES",
    "SUPPLEMENT_MISSED",
    "CUSTOM",
  ]),
  message: z.string().min(1).max(2000),
});

export async function GET(request: NextRequest) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const isRead = searchParams.get("isRead");

  // Users can only query their own patient's alerts
  const where: Record<string, unknown> = {};
  if (patientId) {
    // Verify ownership: the patient must belong to the session user
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId: session!.user.id },
    });
    if (!patient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    where.patientId = patientId;
  } else {
    // Default: only return alerts for the session user's own patient
    const ownPatientId = await getSessionPatientId(session!.user.id);
    where.patientId = ownPatientId ?? "__none__";
  }
  if (isRead !== null) where.isRead = isRead === "true";

  const alerts = await prisma.deviationAlert.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(alerts);
}

export async function POST(request: NextRequest) {
  const { response: authError } = await requireSession();
  if (authError) return authError;

  const body = await request.json();
  const parsed = alertCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const alert = await prisma.deviationAlert.create({
    data: parsed.data,
  });

  // Send email notification to the patient (fire-and-forget)
  if (parsed.data.patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: parsed.data.patientId },
      include: { user: { select: { email: true, name: true } } },
    });
    if (patient?.user.email) {
      sendAlertEmail({
        toEmail: patient.user.email,
        toName: patient.user.name ?? "Paciente",
        alertType: parsed.data.type,
        message: parsed.data.message,
      }).catch(() => {
        // Ignore email errors — alert is already saved
      });
    }
  }

  return NextResponse.json(alert, { status: 201 });
}

async function getSessionPatientId(userId: string): Promise<string | null> {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    select: { id: true },
  });
  return patient?.id ?? null;
}
