import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { MealType } from "@prisma/client";
import DailyChecklist from "@/components/diary/DailyChecklist";

async function getTodayIntakes(patientId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let intakes = await prisma.intake.findMany({
        where: {
            patientId,
            date: { gte: today, lt: tomorrow },
        },
        include: {
            plannedMeal: true,
            foodItems: { include: { foodItem: true } },
        },
        orderBy: { date: "asc" },
    });

    // Si no hay ingestas hoy, inicializarlas desde el MealPlan activo
    if (intakes.length === 0) {
        const activePlan = await prisma.mealPlan.findFirst({
            where: { patientId, isActive: true },
            include: { plannedMeals: { orderBy: { orderIndex: "asc" } } },
        });

        if (activePlan && activePlan.plannedMeals.length > 0) {
            const dayOfWeek = today.getDay(); // 0=Dom … 6=Sáb

            const mealsForToday = activePlan.plannedMeals.filter(
                (pm) => pm.dayOfWeek === null || pm.dayOfWeek === dayOfWeek
            );

            if (mealsForToday.length > 0) {
                await prisma.intake.createMany({
                    data: mealsForToday.map((pm) => ({
                        patientId,
                        plannedMealId: pm.id,
                        date: today,
                        mealType: pm.mealType as MealType,
                        status: "PLANNED" as const,
                        planDescription: pm.description,
                    })),
                });

                // Re-fetch tras crear
                intakes = await prisma.intake.findMany({
                    where: {
                        patientId,
                        date: { gte: today, lt: tomorrow },
                    },
                    include: {
                        plannedMeal: true,
                        foodItems: { include: { foodItem: true } },
                    },
                    orderBy: { date: "asc" },
                });
            }
        }
    }

    return intakes;
}

export default async function DiaryPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) redirect("/auth/login");
    if (session.user.status === "PENDING") redirect("/auth/pending");

    const patient = await prisma.patient.findUnique({
        where: { userId: session.user.id },
        select: { id: true, mode: true },
    });

    if (!patient) redirect("/dashboard");

    const intakes = await getTodayIntakes(patient.id);

    // Serializar: los objetos Prisma con Date no se pueden pasar directamente
    // de Server → Client en Next.js App Router sin serializar.
    const serialized = intakes.map((intake) => ({
        ...intake,
        date: intake.date.toISOString(),
        createdAt: intake.createdAt.toISOString(),
        updatedAt: intake.updatedAt.toISOString(),
        plannedMeal: intake.plannedMeal
            ? {
                ...intake.plannedMeal,
            }
            : null,
        foodItems: intake.foodItems.map((fi) => ({
            ...fi,
            foodItem: { ...fi.foodItem },
        })),
    }));

    return (
        <main className="max-w-2xl mx-auto p-4">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Diario Nutricional</h1>
                <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                    })}
                </p>
                {patient.mode === "SUPERVISED" && (
                    <span className="mt-1 inline-block text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5">
                        Modo supervisado
                    </span>
                )}
            </header>

            <Suspense fallback={<DiaryLoadingSkeleton />}>
                {serialized.length === 0 ? (
                    <EmptyDiary />
                ) : (
                    // @ts-expect-error serialized dates are strings — client handles both
                    <DailyChecklist initialIntakes={serialized} />
                )}
            </Suspense>
        </main>
    );
}

function EmptyDiary() {
    return (
        <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🥗</p>
            <p className="font-medium">No hay comidas planificadas para hoy.</p>
            <p className="text-sm mt-1">
                Pide a tu nutricionista que active un plan o crea uno en Modo Autónomo.
            </p>
        </div>
    );
}

function DiaryLoadingSkeleton() {
    return (
        <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded border bg-gray-100 animate-pulse" />
            ))}
        </div>
    );
}
