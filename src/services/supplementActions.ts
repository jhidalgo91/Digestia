"use server";

import { prisma } from "../lib/prisma";
import { getCurrentUserId } from "../lib/getSession";
import { ToggleSupplementLogSchema, ToggleSupplementLogPayload } from "./schemas";

const MAX_EDIT_DAYS = 7;

function assertWithinEditWindow(dateISO: string) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_EDIT_DAYS);
    cutoff.setHours(0, 0, 0, 0);
    const d = new Date(dateISO + "T00:00:00");
    if (d < cutoff) {
        throw new Error(`Solo puedes editar registros de los últimos ${MAX_EDIT_DAYS} días.`);
    }
}

/** Toggle taken state for a SupplementLog. Creates or updates. */
export async function toggleSupplementLog(payload: ToggleSupplementLogPayload) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("No autenticado");

    const parsed = ToggleSupplementLogSchema.parse(payload);
    const { patientSupplementId, date, taken } = parsed;

    // Ownership check
    const ps = await prisma.patientSupplement.findUnique({
        where: { id: patientSupplementId },
        include: { patient: true },
    });
    if (!ps || ps.patient.userId !== userId) throw new Error("Sin permisos");

    assertWithinEditWindow(date);

    const existing = await prisma.supplementLog.findFirst({
        where: {
            patientSupplementId,
            date: {
                gte: new Date(date + "T00:00:00"),
                lt: new Date(date + "T23:59:59"),
            },
        },
    });

    if (existing) {
        return prisma.supplementLog.update({
            where: { id: existing.id },
            data: {
                taken,
                actualTime: taken ? new Date() : null,
            },
        });
    }

    return prisma.supplementLog.create({
        data: {
            patientId: ps.patientId,
            patientSupplementId,
            date: new Date(date + "T00:00:00"),
            taken,
            actualTime: taken ? new Date() : null,
        },
    });
}
