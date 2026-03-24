import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { updateIntakeStatus } from "@/services/intakeActions";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeIntake(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        id: "intake-1",
        patientId: "patient-1",
        mealType: "LUNCH",
        status: "PLANNED",
        planDescription: "Ensalada + proteína",
        actualDescription: null,
        digestiveFeedback: null,
        hasGas: false,
        processedFoodType: null,
        foodItems: [],
        patient: { nutritionistId: null },
        ...overrides,
    };
}

function makeUpdated(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        id: "intake-1",
        patientId: "patient-1",
        status: "COMPLETED",
        hasGas: false,
        processedFoodType: "NEUTRAL",
        ...overrides,
    };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("updateIntakeStatus", () => {
    describe("LEGUMBRES → hasGas = true + alerta GAS_LEGUMES", () => {
        it("activa hasGas cuando el payload incluye un FoodItem del grupo LEGUME (COMPLETED)", async () => {
            const legume = {
                id: "fi-lentejas",
                name: "Lentejas",
                group: "LEGUME",
                processedType: "NEUTRAL",
            };

            const intakeWithLegume = makeIntake({
                foodItems: [{ foodItem: legume }],
            });

            (prismaMock.intake.findUnique as jest.Mock).mockResolvedValue(intakeWithLegume);
            (prismaMock.intake.update as jest.Mock).mockResolvedValue(
                makeUpdated({ hasGas: true, status: "COMPLETED" })
            );
            (prismaMock.deviationAlert.create as jest.Mock).mockResolvedValue({});

            const result = await updateIntakeStatus({
                intakeId: "intake-1",
                status: "COMPLETED",
            });

            expect(result.hasGas).toBe(true);

            // Se actualiza la ingesta con hasGas = true
            const updateCall = (prismaMock.intake.update as jest.Mock).mock.calls[0][0];
            expect(updateCall.data.hasGas).toBe(true);
        });

        it("crea DeviationAlert GAS_LEGUMES cuando status es MODIFIED y hay legumbres", async () => {
            const legume = {
                id: "fi-garbanzos",
                name: "Garbanzos",
                group: "LEGUME",
                processedType: "NEUTRAL",
            };

            const intakeWithLegume = makeIntake({
                status: "PLANNED",
                planDescription: "Pollo a la plancha",
                foodItems: [{ foodItem: legume }],
            });

            (prismaMock.intake.findUnique as jest.Mock).mockResolvedValue(intakeWithLegume);
            (prismaMock.intake.update as jest.Mock).mockResolvedValue(
                makeUpdated({ hasGas: true, status: "MODIFIED" })
            );
            (prismaMock.deviationAlert.create as jest.Mock).mockResolvedValue({});

            await updateIntakeStatus({
                intakeId: "intake-1",
                status: "MODIFIED",
                actualDescription: "Agregué garbanzos",
            });

            const alertCalls = (prismaMock.deviationAlert.create as jest.Mock).mock.calls;
            const gasAlert = alertCalls.find(
                ([call]: [{ data: { type: string } }]) => call.data.type === "GAS_LEGUMES"
            );
            expect(gasAlert).toBeDefined();
        });
    });

    describe("CARBOHIDRATOS no planeados → alerta CARBS_AT_DINNER", () => {
        it("crea alerta CARBS_AT_DINNER cuando status es MODIFIED y hay carbohidratos no planeados", async () => {
            const carb = {
                id: "fi-arroz",
                name: "Arroz blanco",
                group: "CARBOHYDRATE",
                processedType: "NEUTRAL",
            };

            const intakeNoPlan = makeIntake({
                planDescription: "Solo proteína",
                foodItems: [{ foodItem: carb }],
            });

            (prismaMock.intake.findUnique as jest.Mock).mockResolvedValue(intakeNoPlan);
            (prismaMock.intake.update as jest.Mock).mockResolvedValue(
                makeUpdated({ status: "MODIFIED" })
            );
            (prismaMock.deviationAlert.create as jest.Mock).mockResolvedValue({});

            await updateIntakeStatus({
                intakeId: "intake-1",
                status: "MODIFIED",
                actualDescription: "Añadí arroz",
            });

            const alertCalls = (prismaMock.deviationAlert.create as jest.Mock).mock.calls;
            const carbAlert = alertCalls.find(
                ([call]: [{ data: { type: string } }]) => call.data.type === "CARBS_AT_DINNER"
            );
            expect(carbAlert).toBeDefined();
        });
    });

    describe("Estado COMPLETED sin legumbres → hasGas = false, sin alertas", () => {
        it("no activa hasGas cuando no hay legumbres", async () => {
            const protein = {
                id: "fi-pollo",
                name: "Pechuga de pollo",
                group: "PROTEIN",
                processedType: "NEUTRAL",
            };

            const intake = makeIntake({ foodItems: [{ foodItem: protein }] });

            (prismaMock.intake.findUnique as jest.Mock).mockResolvedValue(intake);
            (prismaMock.intake.update as jest.Mock).mockResolvedValue(
                makeUpdated({ hasGas: false, status: "COMPLETED" })
            );

            const result = await updateIntakeStatus({
                intakeId: "intake-1",
                status: "COMPLETED",
            });

            expect(result.hasGas).toBe(false);
            expect(prismaMock.deviationAlert.create).not.toHaveBeenCalled();
        });
    });

    describe("Validación con Zod", () => {
        it("lanza error si intakeId está vacío", async () => {
            await expect(
                updateIntakeStatus({ intakeId: "", status: "COMPLETED" })
            ).rejects.toThrow();
        });

        it("lanza error si status no es válido", async () => {
            await expect(
                // @ts-expect-error — test de validación intencional
                updateIntakeStatus({ intakeId: "intake-1", status: "INVALID_STATUS" })
            ).rejects.toThrow();
        });
    });

    describe("Semaforización de procesados", () => {
        it("marca ULTRA_PROCESSED si algún alimento es ultra-procesado", async () => {
            const ultra = {
                id: "fi-salchichas",
                name: "Salchichas Frankfurt",
                group: "PROTEIN",
                processedType: "ULTRA_PROCESSED",
            };

            const intake = makeIntake({ foodItems: [{ foodItem: ultra }] });

            (prismaMock.intake.findUnique as jest.Mock).mockResolvedValue(intake);
            (prismaMock.intake.update as jest.Mock).mockResolvedValue(
                makeUpdated({ processedFoodType: "ULTRA_PROCESSED", status: "COMPLETED" })
            );

            await updateIntakeStatus({ intakeId: "intake-1", status: "COMPLETED" });

            const updateCall = (prismaMock.intake.update as jest.Mock).mock.calls[0][0];
            expect(updateCall.data.processedFoodType).toBe("ULTRA_PROCESSED");
        });

        it("marca GOOD_PROCESSED si todos los alimentos son buenos procesados", async () => {
            const good = {
                id: "fi-pavo",
                name: "Pechuga de pavo 99%",
                group: "PROTEIN",
                processedType: "GOOD_PROCESSED",
            };

            const intake = makeIntake({ foodItems: [{ foodItem: good }] });

            (prismaMock.intake.findUnique as jest.Mock).mockResolvedValue(intake);
            (prismaMock.intake.update as jest.Mock).mockResolvedValue(
                makeUpdated({ processedFoodType: "GOOD_PROCESSED" })
            );

            await updateIntakeStatus({ intakeId: "intake-1", status: "COMPLETED" });

            const updateCall = (prismaMock.intake.update as jest.Mock).mock.calls[0][0];
            expect(updateCall.data.processedFoodType).toBe("GOOD_PROCESSED");
        });
    });
});
