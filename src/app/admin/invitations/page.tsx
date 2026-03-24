import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminInvitationsPage() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") redirect("/admin");

    const codes = await prisma.invitationCode.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            nutritionist: { select: { user: { select: { name: true, email: true } } } },
            patient: { select: { user: { select: { name: true, email: true } } } },
        },
    });

    const total = codes.length;
    const used = codes.filter((c) => c.usedAt !== null).length;
    const expired = codes.filter(
        (c) => c.usedAt === null && new Date(c.expiresAt) < new Date()
    ).length;
    const active = total - used - expired;

    return (
        <div className="min-h-screen bg-zinc-50 p-6">
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Códigos de Invitación</h1>
                        <p className="mt-1 text-sm text-zinc-500">
                            Todos los códigos generados en la plataforma.
                        </p>
                    </div>
                    <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-700">
                        ← Métricas
                    </Link>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <KPICard label="Total" value={total} color="zinc" />
                    <KPICard label="Activos" value={active} color="emerald" />
                    <KPICard label="Usados" value={used} color="blue" />
                    <KPICard label="Caducados" value={expired} color="red" />
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    {codes.length === 0 ? (
                        <div className="p-12 text-center text-zinc-400">
                            No hay códigos generados aún.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-400">
                                <tr>
                                    <th className="px-4 py-3 text-left">Código</th>
                                    <th className="px-4 py-3 text-left">Nutricionista</th>
                                    <th className="px-4 py-3 text-left">Paciente</th>
                                    <th className="px-4 py-3 text-left">Estado</th>
                                    <th className="px-4 py-3 text-left">Caduca</th>
                                    <th className="px-4 py-3 text-left">Usado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {codes.map((c) => {
                                    const now = new Date();
                                    const isExpired = !c.usedAt && new Date(c.expiresAt) < now;
                                    const isUsed = c.usedAt !== null;
                                    const isActive = !isExpired && !isUsed;

                                    const statusBadge = isUsed
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : isExpired
                                            ? "bg-red-50 text-red-600 border-red-200"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200";
                                    const statusLabel = isUsed ? "Usado" : isExpired ? "Caducado" : "Activo";

                                    return (
                                        <tr key={c.id} className="hover:bg-zinc-50 transition">
                                            <td className="px-4 py-3">
                                                <code className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono font-semibold text-zinc-800">
                                                    {c.code}
                                                </code>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-zinc-800">
                                                    {c.nutritionist?.user?.name ?? "—"}
                                                </p>
                                                <p className="text-xs text-zinc-400">{c.nutritionist?.user?.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {isUsed && c.patient ? (
                                                    <>
                                                        <p className="font-medium text-zinc-800">{c.patient.user?.name ?? "—"}</p>
                                                        <p className="text-xs text-zinc-400">{c.patient.user?.email}</p>
                                                    </>
                                                ) : (
                                                    <span className="text-zinc-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadge}`}
                                                >
                                                    {isActive && (
                                                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                    )}
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-500">
                                                {new Date(c.expiresAt).toLocaleDateString("es-ES", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="px-4 py-3 text-zinc-500">
                                                {c.usedAt
                                                    ? new Date(c.usedAt).toLocaleDateString("es-ES", {
                                                        day: "numeric",
                                                        month: "short",
                                                    })
                                                    : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

function KPICard({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: "zinc" | "emerald" | "blue" | "red";
}) {
    const colors = {
        zinc: "border-l-zinc-400",
        emerald: "border-l-emerald-400",
        blue: "border-l-blue-400",
        red: "border-l-red-400",
    };
    return (
        <div className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${colors[color]}`}>
            <p className="text-2xl font-bold text-zinc-800">{value}</p>
            <p className="text-xs text-zinc-400">{label}</p>
        </div>
    );
}
