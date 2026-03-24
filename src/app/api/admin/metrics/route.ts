import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";

/**
 * GET /api/admin/metrics
 * Global platform metrics for the Admin dashboard.
 */
export async function GET() {
    const { session, response: authError } = await requireSession();
    if (authError) return authError;

    if (session!.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
        totalUsers,
        activeUsersLast30d,
        usersByRole,
        usersBySubscription,
        totalPatients,
        supervisedPatients,
        archivedPatients,
        totalAlerts,
        unresolvedAlerts,
        totalUsageTokens,
        recentUsage,
        newUsersLast7d,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.session.count({
            where: { expires: { gte: thirtyDaysAgo } },
        }),
        prisma.user.groupBy({
            by: ["role"],
            _count: { id: true },
        }),
        prisma.user.groupBy({
            by: ["subscriptionStatus"],
            _count: { id: true },
        }),
        prisma.patient.count(),
        prisma.patient.count({ where: { mode: "SUPERVISED" } }),
        prisma.patient.count({ where: { archivedAt: { not: null } } }),
        prisma.deviationAlert.count(),
        prisma.deviationAlert.count({ where: { resolvedAt: null } }),
        prisma.usageLog.aggregate({ _sum: { tokensUsed: true } }),
        prisma.usageLog.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            select: {
                action: true,
                tokensUsed: true,
                model: true,
                createdAt: true,
                user: { select: { name: true, email: true } },
            },
        }),
        prisma.user.count({
            where: { createdAt: { gte: sevenDaysAgo } },
        }),
    ]);

    return NextResponse.json({
        users: {
            total: totalUsers,
            activeLastMonth: activeUsersLast30d,
            newLast7Days: newUsersLast7d,
            byRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count.id])),
            bySubscription: Object.fromEntries(
                usersBySubscription.map((s) => [s.subscriptionStatus, s._count.id])
            ),
        },
        patients: {
            total: totalPatients,
            supervised: supervisedPatients,
            autonomous: totalPatients - supervisedPatients,
            archived: archivedPatients,
        },
        alerts: {
            total: totalAlerts,
            unresolved: unresolvedAlerts,
        },
        ai: {
            totalTokensUsed: totalUsageTokens._sum.tokensUsed ?? 0,
            recentUsage,
        },
    });
}
