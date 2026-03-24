"use server";

import { prisma } from "../lib/prisma";
import { getCurrentUserId } from "../lib/getSession";
import { UpsertHabitLogSchema, UpsertHabitLogPayload } from "./schemas";

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

/** Upsert (create-or-update) a HabitLog for a given patient+date. */
export async function upsertHabitLog(payload: UpsertHabitLogPayload) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("No autenticado");

    const parsed = UpsertHabitLogSchema.parse(payload);
    const { patientId, date, ...fields } = parsed;

    // Ownership check
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient || patient.userId !== userId) throw new Error("Sin permisos");

    assertWithinEditWindow(date);

    const existing = await prisma.habitLog.findUnique({
        where: { patientId_date: { patientId, date: new Date(date + "T00:00:00") } },
    });

    if (existing) {
        return prisma.habitLog.update({
            where: { id: existing.id },
            data: {
                sleepHours: fields.sleepHours ?? existing.sleepHours,
                bedtime: fields.bedtime ? new Date(fields.bedtime) : existing.bedtime,
                wakeTime: fields.wakeTime ? new Date(fields.wakeTime) : existing.wakeTime,
                lastMealTime: fields.lastMealTime ? new Date(fields.lastMealTime) : existing.lastMealTime,
                breakfastTime: fields.breakfastTime ? new Date(fields.breakfastTime) : existing.breakfastTime,
                waterGlasses: fields.waterGlasses ?? existing.waterGlasses,
                strengthSessions: fields.strengthSessions ?? existing.strengthSessions,
                cardioMinutes: fields.cardioMinutes ?? existing.cardioMinutes,
                cardioAvgBpm: fields.cardioAvgBpm ?? existing.cardioAvgBpm,
                naturalLightMinutes: fields.naturalLightMinutes ?? existing.naturalLightMinutes,
                naturalLightMorning: fields.naturalLightMorning ?? existing.naturalLightMorning,
                notes: fields.notes ?? existing.notes,
            },
        });
    }

    return prisma.habitLog.create({
        data: {
            patientId,
            date: new Date(date + "T00:00:00"),
            sleepHours: fields.sleepHours,
            bedtime: fields.bedtime ? new Date(fields.bedtime) : null,
            wakeTime: fields.wakeTime ? new Date(fields.wakeTime) : null,
            lastMealTime: fields.lastMealTime ? new Date(fields.lastMealTime) : null,
            breakfastTime: fields.breakfastTime ? new Date(fields.breakfastTime) : null,
            waterGlasses: fields.waterGlasses,
            strengthSessions: fields.strengthSessions,
            cardioMinutes: fields.cardioMinutes,
            cardioAvgBpm: fields.cardioAvgBpm,
            naturalLightMinutes: fields.naturalLightMinutes,
            naturalLightMorning: fields.naturalLightMorning,
            notes: fields.notes,
        },
    });
}
