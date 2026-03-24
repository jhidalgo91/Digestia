import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type Semaphore = "green" | "yellow" | "red";

function calcAdherence(
  intakeDates: Date[]
): { percent: number; semaphore: Semaphore; daysActive: number } {
  const sevenDays = new Set(
    intakeDates.map((d) => new Date(d).toISOString().slice(0, 10))
  );
  const daysActive = sevenDays.size;
  const percent = Math.round((daysActive / 7) * 100);
  const semaphore: Semaphore =
    percent >= 70 ? "green" : percent >= 40 ? "yellow" : "red";
  return { percent, semaphore, daysActive };
}

const SEMAPHORE_STYLES: Record<
  Semaphore,
  { dot: string; bg: string; text: string }
> = {
  green: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  yellow: {
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  red: {
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
  },
};

export default async function NutritionistDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  if (session.user.role !== "NUTRITIONIST" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const nutritionist = await prisma.nutritionist.findUnique({
    where: { userId: session.user.id },
  });

  if (!nutritionist) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-4xl mb-4">🔧</p>
          <p className="text-gray-600">
            Tu perfil de nutricionista no está configurado todavía.
          </p>
        </div>
      </div>
    );
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const patients = await prisma.patient.findMany({
    where: { nutritionistId: nutritionist.id },
    include: {
      user: { select: { name: true, email: true, image: true } },
      intakes: {
        where: {
          date: { gte: sevenDaysAgo },
          status: "COMPLETED",
        },
        select: { date: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis pacientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Adherencia de los últimos 7 días
          </p>
        </div>
        <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {patients.length} paciente{patients.length !== 1 ? "s" : ""}
        </span>
      </div>

      {patients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-semibold text-gray-700">Aún no tienes pacientes</p>
          <p className="text-sm text-gray-400 mt-1">
            Cuando un paciente se vincule a tu cuenta, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => {
            const { percent, semaphore, daysActive } = calcAdherence(
              p.intakes.map((i) => i.date)
            );
            const styles = SEMAPHORE_STYLES[semaphore];
            const initials =
              p.user.name
                ?.split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() ?? "?";

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4"
              >
                {/* Avatar */}
                {p.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.user.image}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                    {initials}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {p.user.name ?? "Sin nombre"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {p.user.email}
                  </p>
                </div>

                {/* Semaphore */}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${styles.bg}`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${styles.dot}`}
                  />
                  <span className={`text-sm font-semibold ${styles.text}`}>
                    {percent}%
                  </span>
                  <span className={`text-xs ${styles.text} opacity-70`}>
                    {daysActive}/7 días
                  </span>
                </div>

                {/* Link */}
                <Link
                  href={`/dashboard/nutritionist/patients/${p.id}`}
                  className="text-sm text-emerald-600 hover:text-emerald-800 font-medium ml-2 whitespace-nowrap"
                >
                  Ver ficha →
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-xs text-gray-400">
        {(
          [
            { semaphore: "green" as Semaphore, label: "≥ 70% adherencia" },
            { semaphore: "yellow" as Semaphore, label: "40–69%" },
            { semaphore: "red" as Semaphore, label: "< 40%" },
          ] as const
        ).map(({ semaphore, label }) => (
          <div key={semaphore} className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${SEMAPHORE_STYLES[semaphore].dot}`}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
