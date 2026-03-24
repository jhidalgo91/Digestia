import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendAdminApprovalRequest } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["PATIENT", "NUTRITIONIST"]),
  bio: z.string().max(1000).optional(),
  specialty: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password, role, bio, specialty } = parsed.data;

  // Check for existing user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese correo electrónico" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // PATIENT users are approved immediately; NUTRITIONIST users require admin approval
  const status = role === "NUTRITIONIST" ? "PENDING" : "APPROVED";

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      status,
    },
  });

  // Create role-specific profile
  if (role === "NUTRITIONIST") {
    await prisma.nutritionist.create({
      data: { userId: user.id, bio, specialty },
    });
    // Notify admin
    try {
      await sendAdminApprovalRequest({ userName: name, userEmail: email, specialty });
    } catch {
      // Non-critical: do not fail registration if email fails
    }
  } else {
    await prisma.patient.create({ data: { userId: user.id } });
  }

  return NextResponse.json(
    { id: user.id, email: user.email, role: user.role, status: user.status },
    { status: 201 }
  );
}
