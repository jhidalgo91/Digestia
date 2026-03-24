"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Alert {
    id: string;
    type: string;
    message: string;
    createdAt: string;
    isRead: boolean;
}

interface PatientAnalytics {
    id: string;
    user: { name: string | null; email: string | null; image: string | null };
    adherencePct: number;
    daysWithLogs: number;
    missingDays: number;
    criticalAlerts: number;
    openAlerts: Alert[];
    semaphore: "GREEN" | "AMBER" | "RED";
    gasEvents: number;
    badDigestionEvents: number;
    extremeHungerEvents: number;
}

const SEMAPHORE_CONFIG = {
    GREEN: {
        dot: "w-3 h-3 rounded-full bg-emerald-400",
        badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        label: "Bien",
        ring: "ring-emerald-200",
    },
    AMBER: {
        dot: "w-3 h-3 rounded-full bg-amber-400",
        badge: "bg-amber-50 text-amber-700 border border-amber-200",
        label: "Atención",
        ring: "ring-amber-200",
    },
    RED: {
        dot: "w-3 h-3 rounded-full bg-red-500 animate-pulse",
        badge: "bg-red-50 text-red-700 border border-red-200",
        label: "Crítico",
        ring: "ring-red-200",
    },
};

const ALERT_TYPE_LABELS: Record<string, string> = {
    GAS_LEGUMES: "💨 Gases",
    BAD_DIGESTION: "😣 Mala digestión",
    EXTREME_HUNGER: "🔥 Hambre extrema",
    MISSING_LOGS: "📭 Sin registros",
    LOW_ADHERENCE: "📉 Baja adherencia",
    SUPPLEMENT_MISSED: "💊 Suplemento olvidado",
    CARBS_AT_DINNER: "🌙 Carbos en cena",
    CUSTOM: "⚠️ Alerta",
};

export default function NutritionistAnalyticsPage() {
    const [data, setData] = useState<PatientAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/nutritionist/analytics")
            .then((r) => r.json())
            .then((d) => {
                setData(Array.isArray(d) ? d : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const red = data.filter((p) => p.semaphore === "RED").length;
    const amber = data.filter((p) => p.semaphore === "AMBER").length;
    const green = data.filter((p) => p.semaphore === "GREEN").length;

    return (
        <div className="min-h-screen bg-zinc-50 p-6">
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Analytics — Mis pacientes</h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Semáforos de cumplimiento últimos 7 días. Ordenados por criticidad.
                    </p>
                </div>

                {/* Summary bar */}
                {!loading && data.length > 0 && (
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 border border-red-200">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            {red} crítico{red !== 1 && "s"}
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 border border-amber-200">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            {amber} con atención
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 border border-emerald-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            {green} bien
                        </div>
                    </div>
                )}

                {/* Patient cards */}
                {loading ? (
                    <div className="rounded-xl bg-white p-12 text-center text-zinc-400 shadow-sm">
                        Cargando datos…
                    </div>
                ) : data.length === 0 ? (
                    <div className="rounded-xl bg-white p-12 text-center text-zinc-400 shadow-sm">
                        <p className="mb-2 text-4xl">👥</p>
                        <p className="font-medium text-zinc-600">Aún no tienes pacientes vinculados.</p>
                        <p className="mt-1 text-sm">
                            Ve a{" "}
                            <Link
                                href="/dashboard/nutritionist"
                                className="text-emerald-600 hover:underline"
                            >
                                Mis pacientes
                            </Link>{" "}
                            para generar códigos de invitación.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.map((patient) => {
                            const cfg = SEMAPHORE_CONFIG[patient.semaphore];
                            const isOpen = expanded === patient.id;

                            return (
                                <div
                                    key={patient.id}
                                    className={`rounded-xl bg-white shadow-sm ring-1 ${cfg.ring} overflow-hidden`}
                                >
                                    {/* Summary row */}
                                    <button
                                        onClick={() => setExpanded(isOpen ? null : patient.id)}
                                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-zinc-50 transition"
                                    >
                                        {/* Semaphore dot */}
                                        <span className={cfg.dot} title={cfg.label} />

                                        {/* Avatar + name */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {patient.user.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={patient.user.image}
                                                    alt=""
                                                    className="h-9 w-9 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700">
                                                    {patient.user.name?.[0]?.toUpperCase() ?? "?"}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-semibold text-zinc-800 truncate">
                                                    {patient.user.name ?? patient.user.email ?? "Paciente"}
                                                </p>
                                                <p className="text-xs text-zinc-400 truncate">{patient.user.email}</p>
                                            </div>
                                        </div>

                                        {/* Metrics pills */}
                                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                                            <span
                                                className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600"
                                                title="Adherencia 7 días"
                                            >
                                                📊 {patient.adherencePct}%
                                            </span>
                                            {patient.missingDays >= 3 && (
                                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                                                    📭 {patient.missingDays}d sin registro
                                                </span>
                                            )}
                                            {patient.gasEvents > 0 && (
                                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                                                    💨 {patient.gasEvents}
                                                </span>
                                            )}
                                            {patient.badDigestionEvents > 0 && (
                                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                                                    😣 {patient.badDigestionEvents}
                                                </span>
                                            )}
                                        </div>

                                        {/* Semaphore badge + expand icon */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cfg.badge}`}>
                                                {cfg.label}
                                            </span>
                                            <svg
                                                className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Expanded detail */}
                                    {isOpen && (
                                        <div className="border-t border-zinc-100 px-5 py-4 space-y-4">
                                            {/* Biofeedback grid */}
                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                <MetricTile label="Adherencia" value={`${patient.adherencePct}%`} />
                                                <MetricTile label="Días con registro" value={`${patient.daysWithLogs}/7`} />
                                                <MetricTile
                                                    label="Eventos de gases"
                                                    value={patient.gasEvents}
                                                    warn={patient.gasEvents > 2}
                                                />
                                                <MetricTile
                                                    label="Mala digestión"
                                                    value={patient.badDigestionEvents}
                                                    warn={patient.badDigestionEvents > 1}
                                                />
                                            </div>

                                            {/* Open alerts */}
                                            {patient.openAlerts.length > 0 && (
                                                <div>
                                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                        Alertas abiertas
                                                    </p>
                                                    <ul className="space-y-1.5">
                                                        {patient.openAlerts.map((a) => (
                                                            <li
                                                                key={a.id}
                                                                className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
                                                            >
                                                                <span className="shrink-0 text-base">
                                                                    {ALERT_TYPE_LABELS[a.type]?.split(" ")[0] ?? "⚠️"}
                                                                </span>
                                                                <span>{a.message}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* CTA */}
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/dashboard/nutritionist/patients/${patient.id}`}
                                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition"
                                                >
                                                    Ver ficha completa
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function MetricTile({
    label,
    value,
    warn = false,
}: {
    label: string;
    value: string | number;
    warn?: boolean;
}) {
    return (
        <div
            className={`rounded-lg p-3 text-center ${warn ? "bg-red-50" : "bg-zinc-50"
                }`}
        >
            <p className="text-lg font-bold text-zinc-800">{value}</p>
            <p className={`text-xs ${warn ? "text-red-500" : "text-zinc-400"}`}>{label}</p>
        </div>
    );
}
