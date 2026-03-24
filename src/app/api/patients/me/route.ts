import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { z } from "zod";

export async function GET() {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const patient = await prisma.patient.findUnique({
    where: { userId: session!.user.id },
    include: { user: { select: { name: true, email: true, image: true } } },
  });

  if (!patient)
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  return NextResponse.json(patient);
}

const OnboardingSchema = z.object({
  mode: z.enum(["AUTONOMOUS", "SUPERVISED"]).default("AUTONOMOUS"),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  age: z.number().int().positive().optional(),
  sex: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  activityLevel: z.enum(["SEDENTARY", "MODERATE", "HIGH"]).default("MODERATE"),
  workSchedule: z.string().max(200).optional(),
  usualSleepHours: z.number().min(0).max(24).optional(),
  allergies: z.string().max(1000).optional(),
  intolerances: z.string().max(1000).optional(),
  dietaryPreferences: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const existing = await prisma.patient.findUnique({
    where: { userId: session!.user.id },
  });
  if (existing)
    return NextResponse.json({ error: "Perfil ya existe" }, { status: 409 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = OnboardingSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );

  const patient = await prisma.patient.create({
    data: { userId: session!.user.id, ...parsed.data },
  });

  return NextResponse.json(patient, { status: 201 });
}
