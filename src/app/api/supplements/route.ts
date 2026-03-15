import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { z } from "zod";

const supplementCreateSchema = z.object({
  patientId: z.string().min(1),
  supplementId: z.string().min(1),
  doseMg: z.number().min(0).optional(),
  doseUnit: z.string().max(50).optional(),
  scheduledTime: z.string().max(50).optional(),
  frequency: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const date = searchParams.get("date");

  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  // Ownership check
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: session!.user.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const body = await request.json();
  const parsed = supplementCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { patientId, supplementId, ...rest } = parsed.data;

  // Ownership check
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: session!.user.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const patientSupplement = await prisma.patientSupplement.create({
    data: { patientId, supplementId, ...rest },
    include: { supplement: true },
  });

  return NextResponse.json(patientSupplement, { status: 201 });
}
