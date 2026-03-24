"use client";

import { useEffect, useState, useCallback } from "react";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  role: "PATIENT" | "NUTRITIONIST" | "ADMIN";
  status: "PENDING" | "APPROVED" | "REJECTED";
  subscriptionStatus: "FREE" | "PRO" | "ENTERPRISE" | "CANCELLED";
  createdAt: string;
  nutritionist: { bio: string | null; specialty: string | null } | null;
}

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type RoleFilter = "ALL" | "PATIENT" | "NUTRITIONIST" | "ADMIN";

const ROLE_COLORS: Record<string, string> = {
  PATIENT: "bg-emerald-100 text-emerald-900 border border-emerald-300",
  NUTRITIONIST: "bg-violet-100 text-violet-900 border border-violet-300",
  ADMIN: "bg-blue-100 text-blue-900 border border-blue-300",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900 border border-amber-300",
  APPROVED: "bg-green-100 text-green-900 border border-green-300",
  REJECTED: "bg-red-100 text-red-900 border border-red-300",
};

const SUB_COLORS: Record<string, string> = {
  FREE: "bg-zinc-100 text-zinc-700 border border-zinc-300",
  PRO: "bg-blue-100 text-blue-900 border border-blue-300",
  ENTERPRISE: "bg-violet-100 text-violet-900 border border-violet-300",
  CANCELLED: "bg-red-100 text-red-900 border border-red-300",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, [statusFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function updateUser(
    id: string,
    patch: Partial<{ status: string; role: string; subscriptionStatus: string }>
  ) {
    setActionLoading(id);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await fetchUsers();
    setActionLoading(null);
  }

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.nutritionist?.specialty?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Gestión de usuarios</h1>
        <p className="mt-1 text-sm text-zinc-500">
          CRUD completo — roles, estados de cuenta y suscripciones.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email…"
          aria-label="Buscar usuarios"
          className="min-w-[200px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filtrar por estado"
          className="min-w-[160px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          style={{ color: 'rgb(17,24,39)', WebkitTextFillColor: 'rgb(17,24,39)', opacity: 1 }}
        >
          <option value="ALL">Todos los estados</option>
          <option value="PENDING">Pendientes</option>
          <option value="APPROVED">Aprobados</option>
          <option value="REJECTED">Rechazados</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          aria-label="Filtrar por rol"
          className="min-w-[160px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          style={{ color: 'rgb(17,24,39)', WebkitTextFillColor: 'rgb(17,24,39)', opacity: 1 }}
        >
          <option value="ALL">Todos los roles</option>
          <option value="PATIENT">Paciente</option>
          <option value="NUTRITIONIST">Nutricionista</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-zinc-400">Cargando usuarios…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-400">
            No se encontraron usuarios.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-600 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Suscripción</th>
                <th className="px-4 py-3 text-left">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50 transition">
                  <td className="px-4 py-3 min-w-[180px]">
                    <p className="font-semibold text-zinc-900">{user.name ?? "Sin nombre"}</p>
                    <p className="text-xs text-zinc-500">{user.email ?? "—"}</p>
                    {user.nutritionist?.specialty && (
                      <p className="text-xs text-zinc-500">
                        Esp: {user.nutritionist.specialty}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      disabled={actionLoading === user.id}
                      onChange={(e) => updateUser(user.id, { role: e.target.value })}
                      className={`${ROLE_COLORS[user.role]} rounded-full px-2.5 py-1 pr-8 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-zinc-900 bg-white`}
                      style={{ color: 'rgb(17,24,39)', WebkitTextFillColor: 'rgb(17,24,39)', opacity: 1 }}
                    >
                      <option value="PATIENT">Paciente</option>
                      <option value="NUTRITIONIST">Nutricionista</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.status}
                      disabled={actionLoading === user.id}
                      onChange={(e) => updateUser(user.id, { status: e.target.value })}
                      className={`${STATUS_COLORS[user.status]} rounded-full px-2.5 py-1 pr-8 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-zinc-900 bg-white`}
                      style={{ color: 'rgb(17,24,39)', WebkitTextFillColor: 'rgb(17,24,39)', opacity: 1 }}
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="APPROVED">Aprobado</option>
                      <option value="REJECTED">Rechazado</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.subscriptionStatus}
                      disabled={actionLoading === user.id}
                      onChange={(e) =>
                        updateUser(user.id, { subscriptionStatus: e.target.value })
                      }
                      className={`${SUB_COLORS[user.subscriptionStatus]} rounded-full px-2.5 py-1 pr-8 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-zinc-900 bg-white`}
                      style={{ color: 'rgb(17,24,39)', WebkitTextFillColor: 'rgb(17,24,39)', opacity: 1 }}
                    >
                      <option value="FREE">Free</option>
                      <option value="PRO">Pro</option>
                      <option value="ENTERPRISE">Enterprise</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-zinc-400">
        {filtered.length} usuario{filtered.length !== 1 ? "s" : ""} mostrados
        {actionLoading && " — guardando cambios…"}
      </p>
    </div>
  );
}
