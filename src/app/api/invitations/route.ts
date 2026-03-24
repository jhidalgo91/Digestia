import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";

// POST /api/invitations – Nutritionist generates a unique invitation code
export async function GET(_request: NextRequest) {
    const { session, response: authError } = await requireSession();
    if (authError) return authError;

    if (session!.user.role !== "NUTRITIONIST" && session!.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId: session!.user.id },
    });
    if (!nutritionist) {
        return NextResponse.json({ error: "Nutritionist profile not found" }, { status: 404 });
    }

    const codes = await prisma.invitationCode.findMany({
        where: { nutritionistId: nutritionist.id },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            code: true,
            expiresAt: true,
            usedAt: true,
            createdAt: true,
            patient: {
                select: {
                    id: true,
                    user: { select: { name: true, email: true } },
                },
            },
        },
    });

    return NextResponse.json(codes);
}

export async function POST(_request: NextRequest) {
    const { session, response: authError } = await requireSession();
    if (authError) return authError;

    if (session!.user.role !== "NUTRITIONIST" && session!.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId: session!.user.id },
    });
    if (!nutritionist) {
        return NextResponse.json({ error: "Nutritionist profile not found" }, { status: 404 });
    }

    // Generate a cryptographically random code: 8 uppercase alphanumeric chars
    const code = crypto.randomBytes(5).toString("hex").toUpperCase(); // 10 chars
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitationCode.create({
        data: {
            code,
            nutritionistId: nutritionist.id,
            expiresAt,
        },
    });

    return NextResponse.json(invitation, { status: 201 });
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(request: NextRequest) {
    const { session, response: authError } = await requireSession();
    if (authError) return authError;

    if (session!.user.role !== "NUTRITIONIST" && session!.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const nutritionist = await prisma.nutritionist.findUnique({
        where: { userId: session!.user.id },
    });
    if (!nutritionist) {
        return NextResponse.json({ error: "Nutritionist profile not found" }, { status: 404 });
    }

    // Only allow deleting unused codes owned by this nutritionist
    const invitation = await prisma.invitationCode.findFirst({
        where: { id: parsed.data.id, nutritionistId: nutritionist.id, usedAt: null },
    });
    if (!invitation) {
        return NextResponse.json({ error: "Invitation not found or already used" }, { status: 404 });
    }

    await prisma.invitationCode.delete({ where: { id: invitation.id } });
    return NextResponse.json({ success: true });
}
