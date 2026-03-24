import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
        redirect("/");
    }

    const navItems = [
        { href: "/admin", label: "Métricas globales", icon: "📊" },
        { href: "/admin/users", label: "Usuarios", icon: "👥" },
        { href: "/admin/invitations", label: "Invitaciones", icon: "📧" },
    ];

    return (
        <div className="flex min-h-screen bg-zinc-50">
            {/* Sidebar */}
            <aside className="w-56 shrink-0 bg-zinc-900 text-white flex flex-col">
                <div className="px-5 py-5 border-b border-zinc-700">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">⚙️</span>
                        <div>
                            <p className="text-sm font-bold text-white">DigestAI</p>
                            <p className="text-xs text-zinc-400">Admin Panel</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {navItems.map(({ href, label, icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                        >
                            <span>{icon}</span>
                            {label}
                        </Link>
                    ))}
                </nav>
                <div className="px-4 py-4 border-t border-zinc-700">
                    <Link
                        href="/dashboard/patient"
                        className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                        ← Volver al app
                    </Link>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-auto">
                <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
            </main>
        </div>
    );
}
