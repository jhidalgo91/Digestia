import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PatientTabs from "./PatientTabs";

export default async function PatientFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const nutritionist = await prisma.nutritionist.findUnique({
    where: { userId: session.user.id },
  });

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, image: true } },
      intakes: {
        take: 20,
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          mealType: true,
          status: true,
          actualDescription: true,
          digestiveFeedback: true,
        },
      },
      habits: {
        take: 10,
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          sleepHours: true,
          waterGlasses: true,
          strengthSessions: true,
          cardioMinutes: true,
          naturalLightMorning: true,
          notes: true,
        },
      },
      progressLogs: {
        take: 10,
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          weight: true,
          bodyFatPercent: true,
          muscleMassKg: true,
          waistCm: true,
          energyLevel: true,
          moodLevel: true,
        },
      },
    },
  });

  if (!patient) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isAssigned = nutritionist && patient.nutritionistId === nutritionist.id;
  if (!isAdmin && !isAssigned) redirect("/dashboard/nutritionist");

  const alerts = await prisma.deviationAlert.findMany({
    where: { patientId: id },
    take: 20,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      message: true,
      isRead: true,
      createdAt: true,
    },
  });

  // Serialize for client component (Dates → ISO strings)
  const serialized = JSON.parse(
    JSON.stringify({ ...patient, alerts })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;

  return <PatientTabs patient={serialized} />;
}
