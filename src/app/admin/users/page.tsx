"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
  nutritionist: { bio: string | null; specialty: string | null } | null;
}

const FILTER_LABELS: Record<string, string> = {
  PENDING: "⏳ Pendientes",
  APPROVED: "✅ Aprobados",
  REJECTED: "❌ Rechazados",
  ALL: "Todos",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");

  async function fetchUsers() {
    setLoading(true);
    const params = new URLSearchParams({ role: "NUTRITIONIST" });
    if (filter !== "ALL") params.set("status", filter);
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      setUsers(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(userId: string, status: "APPROVED" | "REJECTED") {
    setActionLoading(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(null);
    if (res.ok) {
      await fetchUsers();
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          Panel de administración — Nutricionistas
        </h1>

        {/* Filter tabs */}
        <div className="mb-4 flex gap-2">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === s
                  ? "bg-emerald-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {FILTER_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-zinc-500">Cargando…</p>
        ) : users.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-zinc-800 p-8 text-center text-zinc-500">
            No hay usuarios en este estado.
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl bg-white dark:bg-zinc-800 p-5 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-100">
                    {user.name ?? "—"}
                  </p>
                  <p className="text-sm text-zinc-500">{user.email}</p>
                  {user.nutritionist?.specialty && (
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Especialidad: {user.nutritionist.specialty}
                    </p>
                  )}
                  {user.nutritionist?.bio && (
                    <p className="mt-0.5 text-xs text-zinc-400 max-w-sm truncate">
                      {user.nutritionist.bio}
                    </p>
                  )}
                  <span className="mt-1 inline-block text-xs text-zinc-400">
                    {FILTER_LABELS[user.status] ?? user.status}
                  </span>
                </div>

                {user.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(user.id, "APPROVED")}
                      disabled={actionLoading === user.id}
                      className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => updateStatus(user.id, "REJECTED")}
                      disabled={actionLoading === user.id}
                      className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-60"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
