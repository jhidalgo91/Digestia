import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { z } from "zod";

const logSchema = z.object({
  patientSupplementId: z.string().min(1),
  date: z.string().min(1), // ISO date string YYYY-MM-DD
  taken: z.boolean(),
  actualTime: z.string().optional(),
  notes: z.string().max(500).optional(),
});

/**
 * POST /api/supplements/log
 * Upsert a supplement log entry for today (taken / not taken).
 */
export async function POST(request: NextRequest) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const body = await request.json();
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { patientSupplementId, date, taken, actualTime, notes } = parsed.data;

  // Verify ownership
  const patientSupplement = await prisma.patientSupplement.findFirst({
    where: {
      id: patientSupplementId,
      patient: { userId: session!.user.id },
    },
    include: { patient: true },
  });
  if (!patientSupplement) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logDate = new Date(date);
  // Normalize to start of day for consistent lookup
  logDate.setHours(0, 0, 0, 0);

  const existing = await prisma.supplementLog.findFirst({
    where: { patientSupplementId, date: logDate },
  });

  const log = existing
    ? await prisma.supplementLog.update({
      where: { id: existing.id },
      data: {
        taken,
        actualTime: actualTime ? new Date(actualTime) : null,
        notes: notes ?? null,
      },
    })
    : await prisma.supplementLog.create({
      data: {
        patientId: patientSupplement.patientId,
        patientSupplementId,
        date: logDate,
        taken,
        actualTime: actualTime ? new Date(actualTime) : null,
        notes: notes ?? null,
      },
    });

  return NextResponse.json(log, { status: 200 });
}
