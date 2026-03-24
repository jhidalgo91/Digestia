import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

/** 7 canary meal slots per day × 7 days */
const EXPECTED_PER_DAY = 3; // breakfast, lunch, dinner
const DAYS = 7;

function dayLabel(date: Date) {
    return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
}

export default async function PatientWeeklySummaryPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/auth/login");

    const patient = await prisma.patient.findFirst({
        where: { userId: session.user.id, archivedAt: null },
        select: { id: true },
    });

    if (!patient) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
                <div className="rounded-xl bg-white shadow-sm p-10 text-center max-w-sm">
                    <p className="text-4xl mb-3">🙈</p>
                    <p className="font-semibold text-zinc-700">No se encontró tu perfil de paciente.</p>
                    <Link href="/dashboard/patient" className="mt-4 inline-block text-sm text-emerald-600 hover:underline">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    // Build 7-day window
    const now = new Date();
    const days: Date[] = Array.from({ length: DAYS }, (_, i) => {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        d.setDate(now.getDate() - (DAYS - 1 - i));
        return d;
    });

    const windowStart = days[0];
    const windowEnd = new Date(now);
    windowEnd.setHours(23, 59, 59, 999);

    // Parallel queries
    const [intakes, supplements, alerts] = await Promise.all([
        prisma.intake.findMany({
            where: {
                patientId: patient.id,
                createdAt: { gte: windowStart, lte: windowEnd },
            },
            select: {
                createdAt: true,
                mealType: true,
                hasGas: true,
                digestiveFeedback: true,
                extremeHunger: true,
            },
            orderBy: { createdAt: "asc" },
        }),
        prisma.patientSupplement.findMany({
            where: { patientId: patient.id, isActive: true },
            select: {
                supplement: { select: { name: true } },
                logs: { where: { date: { gte: windowStart, lte: windowEnd }, taken: true }, select: { id: true } },
            },
        }),
        prisma.deviationAlert.findMany({
            where: {
                patientId: patient.id,
                createdAt: { gte: windowStart, lte: windowEnd },
            },
            select: { type: true, message: true, createdAt: true, isRead: true },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    // Build day-keyed stats
    type DayStat = {
        date: Date;
        label: string;
        intakeCount: number;
        adherencePct: number;
        gasEvents: number;
        badDigestionEvents: number;
        hasLog: boolean;
    };

    const dayStats: DayStat[] = days.map((dayDate) => {
        const iso = dayDate.toISOString().slice(0, 10);
        const dayIntakes = intakes.filter((i) => i.createdAt.toISOString().slice(0, 10) === iso);
        const gasEvents = dayIntakes.filter((i) => i.hasGas === true).length;
        const badDigestion = dayIntakes.filter((i) => i.digestiveFeedback === "BAD").length;

        return {
            date: dayDate,
            label: dayLabel(dayDate),
            intakeCount: dayIntakes.length,
            adherencePct: Math.round((dayIntakes.length / EXPECTED_PER_DAY) * 100),
            gasEvents,
            badDigestionEvents: badDigestion,
            hasLog: dayIntakes.length > 0,
        };
    });

    const totalIntakes = dayStats.reduce((s, d) => s + d.intakeCount, 0);
    const globalAdherence = Math.round((totalIntakes / (DAYS * EXPECTED_PER_DAY)) * 100);
    const totalGas = dayStats.reduce((s, d) => s + d.gasEvents, 0);
    const totalBadDigestion = dayStats.reduce((s, d) => s + d.badDigestionEvents, 0);
    const daysWithLogs = dayStats.filter((d) => d.hasLog).length;

    const overallStatus =
        globalAdherence >= 70 && totalGas === 0 && totalBadDigestion === 0
            ? "green"
            : globalAdherence >= 40 || daysWithLogs >= 4
                ? "amber"
                : "red";

    const STATUS_MAP = {
        green: { emoji: "🟢", label: "¡Excelente semana!", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
        amber: { emoji: "🟡", label: "Semana con áreas a mejorar", color: "text-amber-700 bg-amber-50 border-amber-200" },
        red: { emoji: "🔴", label: "Semana difícil — ¡sigue adelante!", color: "text-red-700 bg-red-50 border-red-200" },
    };
    const status = STATUS_MAP[overallStatus];

    return (
        <div className="min-h-screen bg-zinc-50 p-6">
            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Resumen semanal</h1>
                        <p className="mt-1 text-sm text-zinc-500">
                            {days[0].toLocaleDateString("es-ES", { day: "numeric", month: "long" })} —{" "}
                            {days[DAYS - 1].toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                    <Link
                        href="/dashboard/patient"
                        className="text-sm text-emerald-600 hover:underline"
                    >
                        ← Inicio
                    </Link>
                </div>

                {/* Overall status banner */}
                <div className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${status.color}`}>
                    <span className="text-3xl">{status.emoji}</span>
                    <div>
                        <p className="font-semibold">{status.label}</p>
                        <p className="text-sm opacity-80">Adherencia global: {globalAdherence}%</p>
                    </div>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <KPICard label="Adherencia" value={`${globalAdherence}%`} emoji="📊" />
                    <KPICard label="Días registrados" value={`${daysWithLogs}/7`} emoji="📅" />
                    <KPICard label="Eventos de gas" value={totalGas} emoji="💨" warn={totalGas > 2} />
                    <KPICard label="Mala digestión" value={totalBadDigestion} emoji="😣" warn={totalBadDigestion > 1} />
                </div>

                {/* Day-by-day grid */}
                <section>
                    <h2 className="mb-3 text-base font-semibold text-zinc-700">Día a día</h2>
                    <div className="grid grid-cols-7 gap-2">
                        {dayStats.map((d) => {
                            const color = !d.hasLog
                                ? "bg-zinc-100 text-zinc-400"
                                : d.adherencePct >= 100
                                    ? "bg-emerald-100 text-emerald-800"
                                    : d.adherencePct >= 50
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-red-50 text-red-700";
                            return (
                                <div key={d.label} className={`flex flex-col items-center rounded-lg p-2 text-center ${color}`}>
                                    <span className="text-[11px] font-medium uppercase">{d.label}</span>
                                    <span className="mt-1 text-lg font-bold">{d.hasLog ? `${d.intakeCount}` : "—"}</span>
                                    <span className="text-[10px] opacity-70">{d.hasLog ? "comidas" : "sin datos"}</span>
                                    {d.gasEvents > 0 && <span className="mt-0.5 text-xs">💨{d.gasEvents}</span>}
                                    {d.badDigestionEvents > 0 && <span className="mt-0.5 text-xs">😣{d.badDigestionEvents}</span>}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Supplements */}
                {supplements.length > 0 && (
                    <section>
                        <h2 className="mb-3 text-base font-semibold text-zinc-700">Suplementos esta semana</h2>
                        <div className="space-y-2">
                            {supplements.map((s) => {
                                const taken = (s.logs as { id: string }[]).length;
                                const pct = Math.round((taken / DAYS) * 100);
                                return (
                                    <div key={s.supplement.name} className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm">
                                        <span className="text-xl">💊</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-800 truncate">{s.supplement.name}</p>
                                            <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-100">
                                                <div
                                                    className="h-1.5 rounded-full bg-emerald-400 transition-all"
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-zinc-600 shrink-0">{taken}/{DAYS}d</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Recent alerts */}
                {alerts.length > 0 && (
                    <section>
                        <h2 className="mb-3 text-base font-semibold text-zinc-700">Alertas de la semana</h2>
                        <ul className="space-y-2">
                            {alerts.slice(0, 5).map((a, i) => (
                                <li
                                    key={i}
                                    className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${a.isRead ? "bg-zinc-50 text-zinc-500" : "bg-red-50 text-red-700"
                                        }`}
                                >
                                    <span>{a.isRead ? "✅" : "⚠️"}</span>
                                    <span>{a.message}</span>
                                    <span className="ml-auto text-xs opacity-60 shrink-0">
                                        {new Date(a.createdAt).toLocaleDateString("es-ES", { weekday: "short", day: "numeric" })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </div>
    );
}

function KPICard({
    label,
    value,
    emoji,
    warn = false,
}: {
    label: string;
    value: string | number;
    emoji: string;
    warn?: boolean;
}) {
    return (
        <div className={`rounded-xl p-4 text-center shadow-sm ${warn ? "bg-red-50" : "bg-white"}`}>
            <p className="text-2xl">{emoji}</p>
            <p className={`mt-1 text-xl font-bold ${warn ? "text-red-600" : "text-zinc-800"}`}>{value}</p>
            <p className={`text-xs ${warn ? "text-red-400" : "text-zinc-400"}`}>{label}</p>
        </div>
    );
}
