import { z } from "zod";

// ─── Intake status update (legacy) ──────────────────────────────────────────
export const UpdateIntakeSchema = z.object({
    intakeId: z.string().min(1),
    status: z.enum(["COMPLETED", "MODIFIED", "SKIPPED"]),
    actualDescription: z.string().optional(),
    digestiveMood: z.enum(["GOOD", "NEUTRAL", "BAD"]).optional(),
    foodItems: z
        .array(
            z.object({
                foodItemId: z.string().min(1),
                grams: z.number().optional(),
            }),
        )
        .optional(),
});

export type UpdateIntakePayload = z.infer<typeof UpdateIntakeSchema>;

// ─── Full intake edit (historical editing) ───────────────────────────────────
export const EditIntakeSchema = z.object({
  intakeId: z.string().min(1),
  status: z.enum(["COMPLETED", "MODIFIED", "SKIPPED"]),
  actualDescription: z.string().optional(),
  digestiveFeedback: z.enum(["GOOD", "NEUTRAL", "BAD"]).optional(),
  processedFoodType: z.enum(["GOOD_PROCESSED", "ULTRA_PROCESSED", "NEUTRAL"]).optional(),
  hasGas: z.boolean().optional(),
  extremeHunger: z.boolean().optional(),
  notes: z.string().optional(),
});
export type EditIntakePayload = z.infer<typeof EditIntakeSchema>;

// ─── HabitLog upsert ─────────────────────────────────────────────────────────
export const UpsertHabitLogSchema = z.object({
  patientId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleepHours: z.number().min(0).max(24).optional(),
  bedtime: z.string().optional(),
  wakeTime: z.string().optional(),
  lastMealTime: z.string().optional(),
  breakfastTime: z.string().optional(),
  waterGlasses: z.number().int().min(0).optional(),
  strengthSessions: z.number().int().min(0).optional(),
  cardioMinutes: z.number().min(0).optional(),
  cardioAvgBpm: z.number().int().min(0).optional(),
  naturalLightMinutes: z.number().int().min(0).optional(),
  naturalLightMorning: z.boolean().optional(),
  notes: z.string().optional(),
});
export type UpsertHabitLogPayload = z.infer<typeof UpsertHabitLogSchema>;

// ─── SupplementLog toggle ────────────────────────────────────────────────────
export const ToggleSupplementLogSchema = z.object({
  patientSupplementId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taken: z.boolean(),
});
export type ToggleSupplementLogPayload = z.infer<typeof ToggleSupplementLogSchema>;
