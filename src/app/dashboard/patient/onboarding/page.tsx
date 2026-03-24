"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "AUTONOMOUS" | "SUPERVISED";
type Sex = "MALE" | "FEMALE" | "OTHER";
type ActivityLevel = "SEDENTARY" | "MODERATE" | "HIGH";

interface FormState {
  mode: Mode;
  weight: string;
  height: string;
  age: string;
  sex: Sex | "";
  activityLevel: ActivityLevel;
  workSchedule: string;
  usualSleepHours: string;
  allergies: string;
  intolerances: string;
  dietaryPreferences: string;
}

const STEPS = ["Modo", "Datos físicos", "Horarios", "Restricciones"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    mode: "AUTONOMOUS",
    weight: "",
    height: "",
    age: "",
    sex: "",
    activityLevel: "MODERATE",
    workSchedule: "",
    usualSleepHours: "",
    allergies: "",
    intolerances: "",
    dietaryPreferences: "",
  });

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFinish() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/patients/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: form.mode,
          weight: form.weight ? Number(form.weight) : undefined,
          height: form.height ? Number(form.height) : undefined,
          age: form.age ? Number(form.age) : undefined,
          sex: form.sex || undefined,
          activityLevel: form.activityLevel,
          workSchedule: form.workSchedule || undefined,
          usualSleepHours: form.usualSleepHours
            ? Number(form.usualSleepHours)
            : undefined,
          allergies: form.allergies || undefined,
          intolerances: form.intolerances || undefined,
          dietaryPreferences: form.dietaryPreferences || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      router.push("/dashboard/patient");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
      setLoading(false);
    }
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 form-control";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8">
        {/* Progress steps */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                      ? "bg-emerald-600 text-white ring-2 ring-emerald-200"
                      : "bg-gray-200 text-gray-400"
                  }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-6 transition-colors ${i < step ? "bg-emerald-400" : "bg-gray-200"
                    }`}
                />
              )}
            </div>
          ))}
          <span className="ml-3 text-sm text-gray-500 font-medium">
            {STEPS[step]}
          </span>
        </div>

        {/* Step 0: Mode */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              ¿Cómo quieres usar DigestAI?
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  {
                    value: "AUTONOMOUS" as Mode,
                    label: "Autónomo",
                    desc: "Sigo el plan por mi cuenta",
                    icon: "🦅",
                  },
                  {
                    value: "SUPERVISED" as Mode,
                    label: "Supervisado",
                    desc: "Con mi nutricionista",
                    icon: "👨‍⚕️",
                  },
                ] as const
              ).map(({ value, label, desc, icon }) => (
                <button
                  key={value}
                  onClick={() => update("mode", value)}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${form.mode === value
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <span className="text-3xl">{icon}</span>
                  <p className="font-semibold mt-2 text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Basic data */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Datos físicos</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Peso (kg)</label>
                <input
                  type="number"
                  value={form.weight}
                  onChange={(e) => update("weight", e.target.value)}
                  className={inputCls}
                  placeholder="70"
                  min="1"
                  max="500"
                />
              </div>
              <div>
                <label className={labelCls}>Altura (cm)</label>
                <input
                  type="number"
                  value={form.height}
                  onChange={(e) => update("height", e.target.value)}
                  className={inputCls}
                  placeholder="170"
                  min="50"
                  max="250"
                />
              </div>
              <div>
                <label className={labelCls}>Edad</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                  className={inputCls}
                  placeholder="30"
                  min="1"
                  max="120"
                />
              </div>
              <div>
                <label className={labelCls}>Sexo</label>
                <select
                  value={form.sex}
                  onChange={(e) => update("sex", e.target.value as Sex)}
                  className={inputCls}
                >
                  <option value="">Seleccionar</option>
                  <option value="MALE">Hombre</option>
                  <option value="FEMALE">Mujer</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Nivel de actividad</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "SEDENTARY" as ActivityLevel, label: "Sedentario", icon: "🪑" },
                    { value: "MODERATE" as ActivityLevel, label: "Moderado", icon: "🚶" },
                    { value: "HIGH" as ActivityLevel, label: "Alto", icon: "🏃" },
                  ] as const
                ).map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => update("activityLevel", value)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${form.activityLevel === value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                  >
                    <span className="block text-xl mb-1">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Horarios y rutina
            </h2>
            <div>
              <label className={labelCls}>Horario laboral</label>
              <input
                type="text"
                value={form.workSchedule}
                onChange={(e) => update("workSchedule", e.target.value)}
                className={inputCls}
                placeholder="Ej: 9h–18h, turno de tarde…"
              />
            </div>
            <div>
              <label className={labelCls}>Horas de sueño habitual</label>
              <input
                type="number"
                value={form.usualSleepHours}
                onChange={(e) => update("usualSleepHours", e.target.value)}
                className={inputCls}
                placeholder="7"
                min="1"
                max="24"
                step="0.5"
              />
            </div>
          </div>
        )}

        {/* Step 3: Diet restrictions */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Restricciones alimentarias
            </h2>
            <div>
              <label className={labelCls}>Alergias</label>
              <input
                type="text"
                value={form.allergies}
                onChange={(e) => update("allergies", e.target.value)}
                className={inputCls}
                placeholder="Ej: frutos secos, marisco…"
              />
            </div>
            <div>
              <label className={labelCls}>Intolerancias</label>
              <input
                type="text"
                value={form.intolerances}
                onChange={(e) => update("intolerances", e.target.value)}
                className={inputCls}
                placeholder="Ej: lactosa, gluten…"
              />
            </div>
            <div>
              <label className={labelCls}>Preferencias dietéticas</label>
              <input
                type="text"
                value={form.dietaryPreferences}
                onChange={(e) => update("dietaryPreferences", e.target.value)}
                className={inputCls}
                placeholder="Ej: vegetariano, sin procesados…"
              />
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:invisible transition-colors"
          >
            ← Atrás
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Guardando…" : "¡Empezar! 🚀"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
