import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const { role, status, id } = session.user;

  if (status === "PENDING") redirect("/auth/pending");
  if (status === "REJECTED") redirect("/auth/login");

  if (role === "ADMIN") redirect("/admin/users");
  if (role === "NUTRITIONIST") redirect("/dashboard/nutritionist");

  // PATIENT: check if profile exists
  const patient = await prisma.patient.findUnique({ where: { userId: id } });
  if (!patient) redirect("/dashboard/patient/onboarding");

  redirect("/dashboard/patient");
}
