import { prisma } from "@/lib/prisma";

// Metric card component
function MetricCard({
    title,
    value,
    sub,
    color = "emerald",
}: {
    title: string;
    value: string | number;
    sub?: string;
    color?: "emerald" | "blue" | "amber" | "red" | "violet";
}) {
    const colorMap = {
        emerald: "border-emerald-400 text-emerald-600",
        blue: "border-blue-400 text-blue-600",
        amber: "border-amber-400 text-amber-600",
        red: "border-red-400 text-red-600",
        violet: "border-violet-400 text-violet-600",
    };
    return (
        <div className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${colorMap[color]}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</p>
            <p className={`mt-1 text-3xl font-bold ${colorMap[color]}`}>{value}</p>
            {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
        </div>
    );
}

export default async function AdminDashboardPage() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
        totalUsers,
        newUsersLast7d,
        usersByRole,
        usersBySubscription,
        totalPatients,
        supervisedPatients,
        archivedPatients,
        unresolvedAlerts,
        totalTokens,
        recentUsage,
        activeSessions,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
        prisma.user.groupBy({ by: ["subscriptionStatus"], _count: { id: true } }),
        prisma.patient.count(),
        prisma.patient.count({ where: { mode: "SUPERVISED" } }),
        prisma.patient.count({ where: { archivedAt: { not: null } } }),
        prisma.deviationAlert.count({ where: { resolvedAt: null } }),
        prisma.usageLog.aggregate({ _sum: { tokensUsed: true } }),
        prisma.usageLog.findMany({
            take: 8,
            orderBy: { createdAt: "desc" },
            select: {
                action: true,
                tokensUsed: true,
                model: true,
                createdAt: true,
                user: { select: { name: true, email: true } },
            },
        }),
        prisma.session.count({ where: { expires: { gte: thirtyDaysAgo } } }),
    ]);

    const roleMap = Object.fromEntries(usersByRole.map((r) => [r.role, r._count.id]));
    const subMap = Object.fromEntries(
        usersBySubscription.map((s) => [s.subscriptionStatus, s._count.id])
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">Panel de Administración</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Métricas globales de la plataforma DigestAI
                </p>
            </div>

            {/* KPI Grid */}
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                    Usuarios
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <MetricCard
                        title="Total usuarios"
                        value={totalUsers}
                        sub={`+${newUsersLast7d} últimos 7 días`}
                        color="emerald"
                    />
                    <MetricCard
                        title="Pacientes"
                        value={roleMap.PATIENT ?? 0}
                        sub={`${supervisedPatients} supervisados`}
                        color="blue"
                    />
                    <MetricCard
                        title="Nutricionistas"
                        value={roleMap.NUTRITIONIST ?? 0}
                        color="violet"
                    />
                    <MetricCard
                        title="Sesiones activas"
                        value={activeSessions}
                        sub="últimos 30 días"
                        color="amber"
                    />
                </div>
            </section>

            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                    Pacientes
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <MetricCard title="Total pacientes" value={totalPatients} color="blue" />
                    <MetricCard
                        title="Supervisados"
                        value={supervisedPatients}
                        sub={`${totalPatients > 0 ? Math.round((supervisedPatients / totalPatients) * 100) : 0}%`}
                        color="emerald"
                    />
                    <MetricCard
                        title="Autónomos"
                        value={totalPatients - supervisedPatients}
                        color="amber"
                    />
                    <MetricCard
                        title="Archivados"
                        value={archivedPatients}
                        color="red"
                    />
                </div>
            </section>

            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                    IA & Alertas
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <MetricCard
                        title="Tokens OpenAI"
                        value={(totalTokens._sum.tokensUsed ?? 0).toLocaleString()}
                        sub="consumo total"
                        color="violet"
                    />
                    <MetricCard
                        title="Alertas abiertas"
                        value={unresolvedAlerts}
                        sub="sin resolver"
                        color={unresolvedAlerts > 10 ? "red" : "amber"}
                    />
                </div>
            </section>

            {/* Subscriptions */}
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                    Suscripciones
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {["FREE", "PRO", "ENTERPRISE", "CANCELLED"].map((plan) => (
                        <div key={plan} className="rounded-xl bg-white p-4 shadow-sm border border-zinc-100">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{plan}</p>
                            <p className="mt-1 text-2xl font-bold text-zinc-800">{subMap[plan] ?? 0}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Recent AI usage */}
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                    Uso reciente de IA
                </h2>
                <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-400">
                            <tr>
                                <th className="px-4 py-3 text-left">Usuario</th>
                                <th className="px-4 py-3 text-left">Acción</th>
                                <th className="px-4 py-3 text-left">Modelo</th>
                                <th className="px-4 py-3 text-right">Tokens</th>
                                <th className="px-4 py-3 text-left">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {recentUsage.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                                        Sin actividad registrada aún.
                                    </td>
                                </tr>
                            ) : (
                                recentUsage.map((log, i) => (
                                    <tr key={i} className="hover:bg-zinc-50 transition">
                                        <td className="px-4 py-3 text-zinc-700">
                                            {log.user.name ?? log.user.email ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-600">{log.action}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                                                {log.model ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-zinc-700">
                                            {log.tokensUsed?.toLocaleString() ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400">
                                            {new Date(log.createdAt).toLocaleDateString("es-ES", {
                                                day: "2-digit",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
