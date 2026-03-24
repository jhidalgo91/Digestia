import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";

/**
 * GET /api/nutritionist/analytics
 * Returns per-patient compliance metrics for the requesting nutritionist.
 */
export async function GET() {
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

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const patients = await prisma.patient.findMany({
        where: {
            nutritionistId: nutritionist.id,
            archivedAt: null,
        },
        select: {
            id: true,
            user: { select: { name: true, email: true, image: true } },
            intakes: {
                where: { date: { gte: sevenDaysAgo } },
                select: { date: true, status: true, digestiveFeedback: true, hasGas: true, extremeHunger: true },
            },
            habits: {
                where: { date: { gte: sevenDaysAgo } },
                select: { date: true, sleepHours: true, waterGlasses: true },
            },
            alerts: {
                where: { resolvedAt: null },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { id: true, type: true, message: true, createdAt: true, isRead: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const analytics = patients.map((p) => {
        const totalExpectedMeals = 7 * 3; // 3 meals/day over 7 days (baseline)
        const completedIntakes = p.intakes.filter((i) => i.status === "COMPLETED").length;
        const adherencePct =
            p.intakes.length > 0 ? Math.round((completedIntakes / totalExpectedMeals) * 100) : 0;

        // Days with any intake logged in last 7 days
        const daysWithLogs = new Set(
            p.intakes.map((i) => new Date(i.date).toDateString())
        ).size;
        const missingDays = 7 - daysWithLogs;

        const criticalCount =
            p.intakes.filter((i) => i.hasGas).length +
            p.intakes.filter((i) => i.digestiveFeedback === "BAD").length +
            p.intakes.filter((i) => i.extremeHunger).length +
            (missingDays >= 3 ? 1 : 0);

        const semaphore =
            criticalCount >= 3 || missingDays >= 5
                ? "RED"
                : criticalCount >= 1 || missingDays >= 3 || adherencePct < 50
                    ? "AMBER"
                    : "GREEN";

        return {
            id: p.id,
            user: p.user,
            adherencePct,
            daysWithLogs,
            missingDays,
            criticalAlerts: criticalCount,
            openAlerts: p.alerts,
            semaphore,
            gasEvents: p.intakes.filter((i) => i.hasGas).length,
            badDigestionEvents: p.intakes.filter((i) => i.digestiveFeedback === "BAD").length,
            extremeHungerEvents: p.intakes.filter((i) => i.extremeHunger).length,
        };
    });

    // Sort: RED first, then AMBER, then GREEN
    const order = { RED: 0, AMBER: 1, GREEN: 2 };
    analytics.sort((a, b) => order[a.semaphore as keyof typeof order] - order[b.semaphore as keyof typeof order]);

    return NextResponse.json(analytics);
}
