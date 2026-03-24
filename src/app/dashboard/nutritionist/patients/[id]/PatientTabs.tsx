"use client";

import { useState } from "react";
import Link from "next/link";

type AlertType =
  | "CARBS_AT_DINNER"
  | "LOW_ADHERENCE"
  | "BAD_DIGESTION"
  | "MISSING_LOGS"
  | "EXTREME_HUNGER"
  | "GAS_LEGUMES"
  | "SUPPLEMENT_MISSED"
  | "CUSTOM";

interface PatientData {
  id: string;
  weight: number | null;
  height: number | null;
  age: number | null;
  sex: string | null;
  activityLevel: string;
  mode: string;
  workSchedule: string | null;
  usualSleepHours: number | null;
  allergies: string | null;
  intolerances: string | null;
  dietaryPreferences: string | null;
  user: { name: string | null; email: string | null; image: string | null };
  intakes: {
    id: string;
    date: string;
    mealType: string;
    status: string;
    actualDescription: string | null;
    digestiveFeedback: string | null;
  }[];
  habits: {
    id: string;
    date: string;
    sleepHours: number | null;
    waterGlasses: number | null;
    strengthSessions: number | null;
    cardioMinutes: number | null;
    naturalLightMorning: boolean | null;
    notes: string | null;
  }[];
  progressLogs: {
    id: string;
    date: string;
    weight: number | null;
    bodyFatPercent: number | null;
    muscleMassKg: number | null;
    waistCm: number | null;
    energyLevel: number | null;
    moodLevel: number | null;
  }[];
  alerts: {
    id: string;
    type: AlertType;
    message: string;
    isRead: boolean;
    createdAt: string;
  }[];
}

const TABS = ["Perfil", "Hábitos", "Progreso", "Alertas"] as const;
type Tab = (typeof TABS)[number];

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Snack",
  PRE_WORKOUT: "Pre-entreno",
  POST_WORKOUT: "Post-entreno",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  SKIPPED: "bg-red-100 text-red-600",
  MODIFIED: "bg-amber-100 text-amber-700",
  PLANNED: "bg-gray-100 text-gray-500",
};

const ALERT_ICONS: Record<AlertType, string> = {
  CARBS_AT_DINNER: "🌙",
  LOW_ADHERENCE: "📉",
  BAD_DIGESTION: "😣",
  MISSING_LOGS: "📋",
  EXTREME_HUNGER: "😤",
  GAS_LEGUMES: "💨",
  SUPPLEMENT_MISSED: "💊",
  CUSTOM: "⚠️",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

const SEX_LABELS: Record<string, string> = {
  MALE: "Hombre",
  FEMALE: "Mujer",
  OTHER: "Otro",
};

const ACTIVITY_LABELS: Record<string, string> = {
  SEDENTARY: "Sedentario",
  MODERATE: "Moderado",
  HIGH: "Alto",
};

export default function PatientTabs({ patient }: { patient: PatientData }) {
  const [activeTab, setActiveTab] = useState<Tab>("Perfil");

  const initials =
    patient.user.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/nutritionist"
          className="text-sm text-emerald-600 hover:underline"
        >
          ← Todos los pacientes
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-8">
        {patient.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={patient.user.image}
            alt=""
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-bold">
            {initials}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {patient.user.name ?? "Sin nombre"}
          </h1>
          <p className="text-sm text-gray-400">{patient.user.email}</p>
        </div>
        <span className="ml-auto text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
          {patient.mode === "SUPERVISED" ? "👨‍⚕️ Supervisado" : "🦅 Autónomo"}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab}
            {tab === "Alertas" && patient.alerts.filter((a) => !a.isRead).length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {patient.alerts.filter((a) => !a.isRead).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* PERFIL TAB */}
      {activeTab === "Perfil" && (
        <div className="space-y-5">
          <Section title="Datos físicos">
            <div className="grid grid-cols-3 gap-4">
              <ProfileField
                label="Peso"
                value={patient.weight ? `${patient.weight} kg` : null}
              />
              <ProfileField
                label="Altura"
                value={patient.height ? `${patient.height} cm` : null}
              />
              {patient.weight && patient.height && (
                <ProfileField
                  label="IMC"
                  value={(
                    patient.weight /
                    Math.pow(patient.height / 100, 2)
                  ).toFixed(1)}
                />
              )}
              <ProfileField label="Edad" value={patient.age ? `${patient.age} años` : null} />
              <ProfileField
                label="Sexo"
                value={patient.sex ? SEX_LABELS[patient.sex] : null}
              />
              <ProfileField
                label="Actividad"
                value={ACTIVITY_LABELS[patient.activityLevel]}
              />
            </div>
          </Section>

          <Section title="Rutina">
            <div className="grid grid-cols-2 gap-4">
              <ProfileField label="Horario laboral" value={patient.workSchedule} />
              <ProfileField
                label="Sueño habitual"
                value={
                  patient.usualSleepHours ? `${patient.usualSleepHours} h` : null
                }
              />
            </div>
          </Section>

          {(patient.allergies || patient.intolerances || patient.dietaryPreferences) && (
            <Section title="Restricciones alimentarias">
              <div className="space-y-3">
                <ProfileField label="Alergias" value={patient.allergies} />
                <ProfileField label="Intolerancias" value={patient.intolerances} />
                <ProfileField
                  label="Preferencias dietéticas"
                  value={patient.dietaryPreferences}
                />
              </div>
            </Section>
          )}
        </div>
      )}

      {/* HÁBITOS TAB */}
      {activeTab === "Hábitos" && (
        <div>
          {patient.habits.length === 0 ? (
            <EmptyState>Sin registros de hábitos todavía.</EmptyState>
          ) : (
            <div className="space-y-3">
              {patient.habits.map((h) => (
                <div
                  key={h.id}
                  className="bg-white rounded-xl border border-gray-200 px-5 py-4"
                >
                  <p className="text-xs font-semibold text-gray-400 mb-3">
                    {formatDate(h.date)}
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    <Stat icon="😴" label="Sueño" value={h.sleepHours ? `${h.sleepHours}h` : "—"} />
                    <Stat icon="💧" label="Agua" value={h.waterGlasses ? `${h.waterGlasses} vasos` : "—"} />
                    <Stat icon="🏋️" label="Fuerza" value={h.strengthSessions ? `${h.strengthSessions}x` : "—"} />
                    <Stat icon="🏃" label="Cardio" value={h.cardioMinutes ? `${h.cardioMinutes} min` : "—"} />
                  </div>
                  {h.naturalLightMorning && (
                    <p className="text-xs text-emerald-600 mt-2">☀️ Luz natural matutina</p>
                  )}
                  {h.notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">{h.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROGRESO TAB */}
      {activeTab === "Progreso" && (
        <div>
          {patient.progressLogs.length === 0 ? (
            <EmptyState>Sin registros de progreso todavía.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["Fecha", "Peso", "Grasa %", "Músculo", "Cintura", "Energía", "Ánimo"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left py-2 pr-4 text-xs font-semibold text-gray-400"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {patient.progressLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100">
                      <td className="py-2.5 pr-4 text-gray-500 whitespace-nowrap">
                        {formatDate(log.date)}
                      </td>
                      <td className="pr-4">{log.weight ? `${log.weight} kg` : "—"}</td>
                      <td className="pr-4">{log.bodyFatPercent ? `${log.bodyFatPercent}%` : "—"}</td>
                      <td className="pr-4">{log.muscleMassKg ? `${log.muscleMassKg} kg` : "—"}</td>
                      <td className="pr-4">{log.waistCm ? `${log.waistCm} cm` : "—"}</td>
                      <td className="pr-4">{log.energyLevel ?? "—"}/10</td>
                      <td className="pr-4">{log.moodLevel ?? "—"}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ALERTAS TAB */}
      {activeTab === "Alertas" && (
        <div>
          {patient.alerts.length === 0 ? (
            <EmptyState>Sin alertas activas. ¡Todo va bien! 🎉</EmptyState>
          ) : (
            <div className="space-y-3">
              {patient.alerts.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 rounded-xl border p-4 ${a.isRead
                      ? "bg-gray-50 border-gray-200"
                      : "bg-amber-50 border-amber-200"
                    }`}
                >
                  <span className="text-xl">{ALERT_ICONS[a.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {a.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(a.createdAt)}
                    </p>
                  </div>
                  {!a.isRead && (
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                      Nueva
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="text-center">
      <p className="text-lg">{icon}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-10 text-center">
      <p className="text-gray-400 text-sm">{children}</p>
    </div>
  );
}

// Kept here to avoid unused import warning from STATUS_COLORS
const _statusColors = STATUS_COLORS;
void _statusColors;
