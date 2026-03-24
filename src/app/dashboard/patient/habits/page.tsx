"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import CalendarHeader from "@/components/patient/CalendarHeader";
import { useSelectedDate } from "@/hooks/useSelectedDate";
import { upsertHabitLog } from "@/services/habitActions";

interface HabitLog {
  id: string;
  date: string;
  sleepHours: number | null;
  bedtime: string | null;
  wakeTime: string | null;
  lastMealTime: string | null;
  breakfastTime: string | null;
  waterGlasses: number | null;
  strengthSessions: number | null;
  cardioMinutes: number | null;
  cardioAvgBpm: number | null;
  naturalLightMinutes: number | null;
  naturalLightMorning: boolean | null;
  notes: string | null;
}

interface Patient {
  id: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function timeFromISO(iso: string | null): string {
  if (!iso) return "";
  // Extract HH:MM from ISO string
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeToISO(time: string, dateStr: string): string {
  return `${dateStr}T${time}:00`;
}

interface FormState {
  sleepHours: string;
  bedtime: string;
  wakeTime: string;
  lastMealTime: string;
  breakfastTime: string;
  waterGlasses: number;
  strengthSessions: number;
  cardioMinutes: string;
  cardioAvgBpm: string;
  naturalLightMinutes: string;
  naturalLightMorning: boolean;
  notes: string;
}

const defaultForm: FormState = {
  sleepHours: "",
  bedtime: "",
  wakeTime: "",
  lastMealTime: "",
  breakfastTime: "",
  waterGlasses: 0,
  strengthSessions: 0,
  cardioMinutes: "",
  cardioAvgBpm: "",
  naturalLightMinutes: "",
  naturalLightMorning: false,
  notes: "",
};

function habitToForm(h: HabitLog): FormState {
  return {
    sleepHours: h.sleepHours?.toString() ?? "",
    bedtime: timeFromISO(h.bedtime),
    wakeTime: timeFromISO(h.wakeTime),
    lastMealTime: timeFromISO(h.lastMealTime),
    breakfastTime: timeFromISO(h.breakfastTime),
    waterGlasses: h.waterGlasses ?? 0,
    strengthSessions: h.strengthSessions ?? 0,
    cardioMinutes: h.cardioMinutes?.toString() ?? "",
    cardioAvgBpm: h.cardioAvgBpm?.toString() ?? "",
    naturalLightMinutes: h.naturalLightMinutes?.toString() ?? "",
    naturalLightMorning: h.naturalLightMorning ?? false,
    notes: h.notes ?? "",
  };
}

export default function HabitsPage() {
  const router = useRouter();
  const { date, goBack, goForward, isToday, canGoBack, isEditable } = useSelectedDate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  const loadData = useCallback(async () => {
    try {
      const pRes = await fetch("/api/patients/me");
      if (pRes.status === 404) {
        router.push("/dashboard/patient/onboarding");
        return;
      }
      const p: Patient = await pRes.json();
      setPatient(p);

      const hRes = await fetch(
        `/api/habits?patientId=${p.id}&dateFrom=${date}&dateTo=${date}`
      );
      const habits: HabitLog[] = await hRes.json();
      if (habits.length > 0) setForm(habitToForm(habits[0]));
      else setForm(defaultForm);
    } catch {
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [router, date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;
    setError("");
    setSaving(true);

    try {
      await upsertHabitLog({
        patientId: patient.id,
        date,
        sleepHours: form.sleepHours ? Number(form.sleepHours) : undefined,
        bedtime: form.bedtime ? timeToISO(form.bedtime, date) : undefined,
        wakeTime: form.wakeTime ? timeToISO(form.wakeTime, date) : undefined,
        lastMealTime: form.lastMealTime ? timeToISO(form.lastMealTime, date) : undefined,
        breakfastTime: form.breakfastTime ? timeToISO(form.breakfastTime, date) : undefined,
        waterGlasses: form.waterGlasses || undefined,
        strengthSessions: form.strengthSessions || undefined,
        cardioMinutes: form.cardioMinutes ? Number(form.cardioMinutes) : undefined,
        cardioAvgBpm: form.cardioAvgBpm ? Number(form.cardioAvgBpm) : undefined,
        naturalLightMinutes: form.naturalLightMinutes ? Number(form.naturalLightMinutes) : undefined,
        naturalLightMorning: form.naturalLightMorning || undefined,
        notes: form.notes || undefined,
      });
      setSaved(true);
    } catch {
      setError("Error al guardar los hábitos");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 form-control";

  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Cargando…
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hábitos del día</h1>
      </div>

      <CalendarHeader
        date={date}
        isToday={isToday}
        canGoBack={canGoBack}
        onBack={goBack}
        onForward={goForward}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sueño */}
        <Section title="😴 Sueño">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className={labelCls}>Horas dormidas</label>
              <input
                type="number"
                value={form.sleepHours}
                onChange={(e) => update("sleepHours", e.target.value)}
                className={inputCls}
                placeholder="7"
                min="0"
                max="24"
                step="0.5"
              />
            </div>
            <div>
              <label className={labelCls}>Me acosté</label>
              <input
                type="time"
                value={form.bedtime}
                onChange={(e) => update("bedtime", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Me levanté</label>
              <input
                type="time"
                value={form.wakeTime}
                onChange={(e) => update("wakeTime", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </Section>

        {/* Ayuno / comidas */}
        <Section title="⏱️ Ayuno intermitente">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Última comida anoche</label>
              <input
                type="time"
                value={form.lastMealTime}
                onChange={(e) => update("lastMealTime", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Primera comida hoy</label>
              <input
                type="time"
                value={form.breakfastTime}
                onChange={(e) => update("breakfastTime", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </Section>

        {/* Hidratación */}
        <Section title="💧 Hidratación">
          <div>
            <label className={labelCls}>
              Vasos de agua: <strong>{form.waterGlasses}</strong>
            </label>
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() =>
                  update("waterGlasses", Math.max(0, form.waterGlasses - 1))
                }
                className="w-9 h-9 rounded-full border border-gray-300 text-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                −
              </button>
              <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => update("waterGlasses", i + 1)}
                    className={`text-lg transition-transform ${i < form.waterGlasses
                      ? "opacity-100 scale-110"
                      : "opacity-30"
                      }`}
                  >
                    💧
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  update("waterGlasses", Math.min(20, form.waterGlasses + 1))
                }
                className="w-9 h-9 rounded-full border border-gray-300 text-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </Section>

        {/* Ejercicio */}
        <Section title="🏋️ Ejercicio">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Sesiones de fuerza</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "strengthSessions",
                      Math.max(0, form.strengthSessions - 1)
                    )
                  }
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold"
                >
                  −
                </button>
                <span className="text-lg font-bold text-gray-900 w-6 text-center">
                  {form.strengthSessions}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    update("strengthSessions", form.strengthSessions + 1)
                  }
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Cardio (min)</label>
              <input
                type="number"
                value={form.cardioMinutes}
                onChange={(e) => update("cardioMinutes", e.target.value)}
                className={inputCls}
                placeholder="30"
                min="0"
              />
            </div>
            <div>
              <label className={labelCls}>BPM medio</label>
              <input
                type="number"
                value={form.cardioAvgBpm}
                onChange={(e) => update("cardioAvgBpm", e.target.value)}
                className={inputCls}
                placeholder="140"
                min="0"
                max="250"
              />
            </div>
          </div>
        </Section>

        {/* Luz natural */}
        <Section title="🌞 Luz natural">
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className={labelCls}>Minutos al aire libre</label>
              <input
                type="number"
                value={form.naturalLightMinutes}
                onChange={(e) => update("naturalLightMinutes", e.target.value)}
                className={inputCls}
                placeholder="20"
                min="0"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.naturalLightMorning}
                  onChange={(e) => update("naturalLightMorning", e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <span className="text-sm text-gray-700">
                  Luz natural por la mañana
                </span>
              </label>
            </div>
          </div>
        </Section>

        {/* Notas */}
        <Section title="📝 Notas">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className={`${inputCls} resize-none`}
            placeholder="Cómo te has sentido hoy…"
          />
        </Section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {!isEditable && (
          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-center">
            ⚠️ Solo puedes editar registros de los últimos 7 días
          </p>
        )}
        <button
          type="submit"
          disabled={saving || !isEditable}
          className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          {saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar hábitos"}
        </button>
      </form>
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
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}
