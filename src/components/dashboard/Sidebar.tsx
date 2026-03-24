"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navByRole: Record<string, { href: string; label: string; icon: string }[]> = {
  PATIENT: [
    { href: "/dashboard/patient", label: "Inicio", icon: "🏠" },
    { href: "/dashboard/patient/habits", label: "Hábitos del día", icon: "📋" },
    { href: "/dashboard/patient/weekly", label: "Resumen semanal", icon: "📅" },
    { href: "/dashboard/patient/chat", label: "Asistente IA", icon: "🤖" },
    { href: "/dashboard/patient/supplements", label: "Pastillero", icon: "💊" },
    { href: "/dashboard/patient/alerts", label: "Alertas", icon: "🔔" },
  ],
  NUTRITIONIST: [
    { href: "/dashboard/nutritionist", label: "Mis pacientes", icon: "👥" },
    { href: "/dashboard/nutritionist/analytics", label: "Analytics", icon: "📊" },
    { href: "/dashboard/nutritionist/invitations", label: "Invitaciones", icon: "🔗" },
    { href: "/dashboard/nutritionist/meal-builder", label: "Constructor de menús", icon: "🎨" },
  ],
  ADMIN: [
    { href: "/admin", label: "Métricas", icon: "📈" },
    { href: "/admin/users", label: "Usuarios", icon: "⚙️" },
    { href: "/admin/invitations", label: "Invitaciones", icon: "🔗" },
  ],
};

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const role = session?.user?.role ?? "PATIENT";
  const nav = navByRole[role] ?? navByRole.PATIENT;
  const user = session?.user;

  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-white flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥗</span>
          <span className="text-lg font-bold text-emerald-700">DigestAI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon }) => {
          // Exact-match roots to avoid "/admin" matching "/admin/users"
          const exactRoots = ["/dashboard/patient", "/dashboard/nutritionist", "/admin"];
          const active = exactRoots.includes(href)
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        {user && (
          <div className="flex items-center gap-2.5 mb-3">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold">
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user.name ?? "Usuario"}</p>
              <p className="text-xs text-gray-400 capitalize">{role.toLowerCase()}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full text-left text-xs text-gray-400 hover:text-red-500 transition-colors px-1"
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  );
}
