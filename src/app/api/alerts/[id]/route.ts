import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { z } from "zod";

const patchSchema = z.object({
  isRead: z.boolean().optional(),
  resolvedAt: z.string().datetime().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify the alert belongs to the session user's patient
  const alert = await prisma.deviationAlert.findUnique({ where: { id } });
  if (!alert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (alert.patientId) {
    const patient = await prisma.patient.findFirst({
      where: { id: alert.patientId, userId: session!.user.id },
    });
    // Allow if patient is own, or if user is NUTRITIONIST/ADMIN
    if (!patient && session!.user.role === "PATIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.deviationAlert.update({
    where: { id },
    data: {
      ...(parsed.data.isRead !== undefined ? { isRead: parsed.data.isRead } : {}),
      ...(parsed.data.resolvedAt ? { resolvedAt: new Date(parsed.data.resolvedAt) } : {}),
    },
  });

  return NextResponse.json(updated);
}
