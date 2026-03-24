"use server";

import { prisma } from "../lib/prisma";
import { getCurrentUserId } from "../lib/getSession";
import {
  UpdateIntakeSchema,
  UpdateIntakePayload,
  EditIntakeSchema,
  EditIntakePayload,
} from "./schemas";

const MAX_EDIT_DAYS = 7;

function assertWithinEditWindow(date: Date) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_EDIT_DAYS);
  cutoff.setHours(0, 0, 0, 0);
  if (date < cutoff) {
    throw new Error(`Solo puedes editar registros de los últimos ${MAX_EDIT_DAYS} días.`);
  }
}

/** Full-field edit of an existing Intake with ownership + 7-day window check. */
export async function editIntake(payload: EditIntakePayload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("No autenticado");

  const parsed = EditIntakeSchema.parse(payload);
  const { intakeId, status, actualDescription, digestiveFeedback, processedFoodType, hasGas, extremeHunger, notes } = parsed;

  const intake = await prisma.intake.findUnique({
    where: { id: intakeId },
    include: { patient: { include: { nutritionist: true } } },
  });
  if (!intake) throw new Error("Registro no encontrado");

  // Ownership check: only the patient's own user may edit
  if (intake.patient.userId !== userId) throw new Error("Sin permisos");

  // 7-day edit window
  assertWithinEditWindow(intake.date);

  const updated = await prisma.intake.update({
    where: { id: intakeId },
    data: {
      status,
      actualDescription: actualDescription ?? intake.actualDescription,
      digestiveFeedback: digestiveFeedback ?? intake.digestiveFeedback,
      processedFoodType: processedFoodType ?? intake.processedFoodType,
      hasGas: hasGas ?? intake.hasGas,
      extremeHunger: extremeHunger ?? intake.extremeHunger,
      notes: notes ?? intake.notes,
    },
  });

  // Re-evaluate deviation alerts when status is MODIFIED
  if (status === "MODIFIED") {
    const gasTrigger = hasGas ?? intake.hasGas;
    if (gasTrigger) {
      await prisma.deviationAlert.create({
        data: {
          patientId: intake.patientId,
          nutritionistId: intake.patient?.nutritionistId ?? null,
          type: "GAS_LEGUMES",
          message: `Edición histórica: gases registrados en ${intake.mealType}`,
        },
      });
    }

    const digestBad = (digestiveFeedback ?? intake.digestiveFeedback) === "BAD";
    if (digestBad) {
      await prisma.deviationAlert.create({
        data: {
          patientId: intake.patientId,
          nutritionistId: intake.patient?.nutritionistId ?? null,
          type: "BAD_DIGESTION",
          message: `Edición histórica: mala digestión en ${intake.mealType}`,
        },
      });
    }

    const hunger = extremeHunger ?? intake.extremeHunger;
    if (hunger) {
      await prisma.deviationAlert.create({
        data: {
          patientId: intake.patientId,
          nutritionistId: intake.patient?.nutritionistId ?? null,
          type: "EXTREME_HUNGER",
          message: `Edición histórica: hambre extrema en ${intake.mealType}`,
        },
      });
    }
  }

  return updated;
}

export async function updateIntakeStatus(payload: UpdateIntakePayload) {
    const parsed = UpdateIntakeSchema.parse(payload);
    const { intakeId, status, actualDescription, digestiveMood, foodItems } = parsed;

    const intake = await prisma.intake.findUnique({
        where: { id: intakeId },
        include: {
            foodItems: { include: { foodItem: true } },
            patient: { include: { nutritionist: true } },
        },
    });

    if (!intake) throw new Error("Intake not found");

    // Resolve food item details if provided
    let dbFoodItems = intake.foodItems.map((ifi) => ifi.foodItem);
    if (foodItems && foodItems.length > 0) {
        const ids = foodItems.map((f) => f.foodItemId);
        const found = await prisma.foodItem.findMany({ where: { id: { in: ids } } });
        if (found.length > 0) dbFoodItems = found;
    }

    // hasGas if any LEGUME present
    const hasGas = dbFoodItems.some((f) => f.group === "LEGUME");

    // processedFoodType heuristics
    const anyUltra = dbFoodItems.some((f) => f.processedType === "ULTRA_PROCESSED");
    const allGood = dbFoodItems.length > 0 && dbFoodItems.every((f) => f.processedType === "GOOD_PROCESSED");
    const processedFoodType = anyUltra ? "ULTRA_PROCESSED" : allGood ? "GOOD_PROCESSED" : "NEUTRAL";

    // Update intake
    const updated = await prisma.intake.update({
        where: { id: intakeId },
        data: {
            status,
            actualDescription: actualDescription ?? intake.actualDescription,
            digestiveFeedback: digestiveMood ?? intake.digestiveFeedback,
            hasGas,
            processedFoodType,
        },
    });

    // Create deviation alerts based on business rules
    if (status === "MODIFIED") {
        const hasUnplannedCarbs = dbFoodItems.some((f) => f.group === "CARBOHYDRATE") && !((intake.planDescription || "").toLowerCase().includes("carb") || (intake.planDescription || "").toLowerCase().includes("carbo"));
        if (hasUnplannedCarbs) {
            await prisma.deviationAlert.create({
                data: {
                    patientId: intake.patientId,
                    nutritionistId: intake.patient?.nutritionistId ?? null,
                    type: "CARBS_AT_DINNER",
                    message: `Ingesta modificada: carbohidratos no planeados en ${intake.mealType}`,
                },
            });
        }

        if (hasGas) {
            await prisma.deviationAlert.create({
                data: {
                    patientId: intake.patientId,
                    nutritionistId: intake.patient?.nutritionistId ?? null,
                    type: "GAS_LEGUMES",
                    message: `Se detectaron legumbres/posible gas en la ingesta ${intake.mealType}`,
                },
            });
        }
    }

    return updated;
}
