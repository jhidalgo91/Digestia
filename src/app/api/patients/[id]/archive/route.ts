import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";

const bodySchema = z.object({
    reason: z.string().max(500).optional(),
});

/**
 * PATCH /api/patients/[id]/archive
 * Soft-delete: sets archivedAt on the patient record.
 * Only the assigned nutritionist or admin can archive.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { session, response: authError } = await requireSession();
    if (authError) return authError;

    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
        where: { id },
        include: { nutritionist: true },
    });

    if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const isAdmin = session!.user.role === "ADMIN";
    const isAssignedNutritionist =
        session!.user.role === "NUTRITIONIST" &&
        patient.nutritionist?.userId === session!.user.id;

    if (!isAdmin && !isAssignedNutritionist) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (patient.archivedAt) {
        return NextResponse.json(
            { error: "Patient is already archived" },
            { status: 409 }
        );
    }

    const updated = await prisma.patient.update({
        where: { id },
        data: {
            archivedAt: new Date(),
            archivedReason: parsed.data.reason ?? null,
        },
    });

    return NextResponse.json({ success: true, archivedAt: updated.archivedAt });
}

/**
 * DELETE /api/patients/[id]/archive
 * Restore (unarchive) a patient.
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { session, response: authError } = await requireSession();
    if (authError) return authError;

    const { id } = await params;

    const patient = await prisma.patient.findUnique({
        where: { id },
        include: { nutritionist: true },
    });

    if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const isAdmin = session!.user.role === "ADMIN";
    const isAssignedNutritionist =
        session!.user.role === "NUTRITIONIST" &&
        patient.nutritionist?.userId === session!.user.id;

    if (!isAdmin && !isAssignedNutritionist) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.patient.update({
        where: { id },
        data: { archivedAt: null, archivedReason: null },
    });

    return NextResponse.json({ success: true });
}
