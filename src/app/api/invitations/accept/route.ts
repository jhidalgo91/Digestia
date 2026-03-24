import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";

const bodySchema = z.object({
    code: z.string().min(1).max(20).toUpperCase(),
});

/**
 * POST /api/invitations/accept
 * Patient uses a valid invitation code to link themselves to a nutritionist.
 */
export async function POST(request: NextRequest) {
    const { session, response: authError } = await requireSession();
    if (authError) return authError;

    if (session!.user.role !== "PATIENT") {
        return NextResponse.json(
            { error: "Only patients can accept invitations" },
            { status: 403 }
        );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
        where: { userId: session!.user.id },
    });
    if (!patient) {
        return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
    }

    if (patient.nutritionistId) {
        return NextResponse.json(
            { error: "You are already linked to a nutritionist" },
            { status: 409 }
        );
    }

    const invitation = await prisma.invitationCode.findUnique({
        where: { code: parsed.data.code },
    });

    if (!invitation) {
        return NextResponse.json({ error: "Invalid invitation code" }, { status: 404 });
    }

    if (invitation.usedAt !== null) {
        return NextResponse.json({ error: "Invitation code already used" }, { status: 409 });
    }

    if (invitation.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invitation code has expired" }, { status: 410 });
    }

    // Link patient to nutritionist and mark code as used — atomic transaction
    const [updatedPatient] = await prisma.$transaction([
        prisma.patient.update({
            where: { id: patient.id },
            data: {
                nutritionistId: invitation.nutritionistId,
                mode: "SUPERVISED",
            },
        }),
        prisma.invitationCode.update({
            where: { id: invitation.id },
            data: {
                usedAt: new Date(),
                patientId: patient.id,
            },
        }),
    ]);

    return NextResponse.json({
        success: true,
        nutritionistId: updatedPatient.nutritionistId,
    });
}
