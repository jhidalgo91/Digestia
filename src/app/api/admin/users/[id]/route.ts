import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { sendApprovalNotification } from "@/lib/email";

const patchSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]).optional(),
  role: z.enum(["PATIENT", "NUTRITIONIST", "ADMIN"]).optional(),
  subscriptionStatus: z.enum(["FREE", "PRO", "ENTERPRISE", "CANCELLED"]).optional(),
}).refine(
  (d) => d.status !== undefined || d.role !== undefined || d.subscriptionStatus !== undefined,
  { message: "At least one field must be provided" }
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  if (session!.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const { status, role, subscriptionStatus } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, status: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(role && { role }),
      ...(subscriptionStatus && { subscriptionStatus }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      subscriptionStatus: true,
    },
  });

  // Notify the user by email when approval status changes
  try {
    if (status && status !== user.status && user.email && user.name) {
      await sendApprovalNotification({
        userName: user.name,
        userEmail: user.email,
        approved: status === "APPROVED",
      });
    }
  } catch {
    // Non-critical: do not fail the update if email fails
  }

  return NextResponse.json(updated);
}
