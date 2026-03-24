"use client";

import { useEffect, useState, useCallback, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CalendarHeader from "@/components/patient/CalendarHeader";
import { useSelectedDate } from "@/hooks/useSelectedDate";
import { editIntake } from "@/services/intakeActions";

type IntakeStatus = "PLANNED" | "COMPLETED" | "MODIFIED" | "SKIPPED";
type DigestiveMood = "GOOD" | "NEUTRAL" | "BAD";
type ProcessedType = "GOOD_PROCESSED" | "ULTRA_PROCESSED" | "NEUTRAL";
type MealType =
  | "BREAKFAST"
  | "LUNCH"
  | "DINNER"
  | "SNACK"
  | "PRE_WORKOUT"
  | "POST_WORKOUT";

interface Intake {
  id: string;
  mealType: MealType;
  status: IntakeStatus;
  actualDescription: string | null;
  digestiveFeedback: DigestiveMood | null;
  hasGas: boolean | null;
  processedFoodType: ProcessedType | null;
  extremeHunger: boolean;
  notes: string | null;
}

interface Patient {
  id: string;
  user: { name: string | null };
}

const MEAL_SLOTS: { type: MealType; label: string; icon: string; time: string }[] = [
  { type: "BREAKFAST", label: "Desayuno", icon: "☀️", time: "8:00" },
  { type: "SNACK", label: "Media mañana", icon: "🍎", time: "11:00" },
  { type: "LUNCH", label: "Almuerzo", icon: "🌤️", time: "14:00" },
  { type: "DINNER", label: "Cena", icon: "🌙", time: "21:00" },
];

const STATUS_LABELS: Record<IntakeStatus, { label: string; color: string }> = {
  PLANNED: { label: "Pendiente", color: "text-gray-500 bg-gray-100" },
  COMPLETED: { label: "Completado", color: "text-emerald-700 bg-emerald-100" },
  MODIFIED: { label: "Modificado", color: "text-amber-700 bg-amber-100" },
  SKIPPED: { label: "Saltado", color: "text-red-600 bg-red-100" },
};

const DIGESTION_OPTIONS: { value: DigestiveMood; label: string; icon: string }[] = [
  { value: "GOOD", label: "Bien", icon: "😊" },
  { value: "NEUTRAL", label: "Normal", icon: "😐" },
  { value: "BAD", label: "Mal", icon: "😣" },
];

const PROCESSED_OPTIONS: { value: ProcessedType; label: string; color: string; dot: string; hint: string }[] = [
  { value: "GOOD_PROCESSED", label: "Procesado bueno", color: "border-emerald-500 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", hint: "Yogur, conservas natural, embutido artesano..." },
  { value: "NEUTRAL", label: "Sin procesar", color: "border-gray-400 bg-gray-50 text-gray-600", dot: "bg-gray-400", hint: "Alimentos enteros, frescos, no procesados" },
  { value: "ULTRA_PROCESSED", label: "Ultraprocesado", color: "border-red-500 bg-red-50 text-red-600", dot: "bg-red-500", hint: "Snacks, bollería, refrescos, comida rápida..." },
];

interface IntakeFormFields {
  desc: string;
  digestion: DigestiveMood | "";
  processedType: ProcessedType | "";
  hasGas: boolean;
  extremeHunger: boolean;
}

const blankForm = (): IntakeFormFields => ({
  desc: "",
  digestion: "",
  processedType: "",
  hasGas: false,
  extremeHunger: false,
});

function intakeToForm(intake: Intake): IntakeFormFields {
  return {
    desc: intake.actualDescription ?? "",
    digestion: intake.digestiveFeedback ?? "",
    processedType: intake.processedFoodType ?? "",
    hasGas: intake.hasGas ?? false,
    extremeHunger: intake.extremeHunger,
  };
}

type FormTarget = null | MealType | { intakeId: string; type: MealType };

export default function PatientHomePage() {
  const router = useRouter();
  const { date, goBack, goForward, isToday, canGoBack, isEditable } = useSelectedDate();
  const [isPending, startTransition] = useTransition();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [formFields, setFormFields] = useState<IntakeFormFields>(blankForm());
  const [saving, setSaving] = useState(false);

  const [optimisticIntakes, addOptimistic] = useOptimistic(
    intakes,
    (state, update: { id: string; status: IntakeStatus }) =>
      state.map((i) => (i.id === update.id ? { ...i, status: update.status } : i))
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const pRes = await fetch("/api/patients/me");
      if (pRes.status === 404) {
        router.push("/dashboard/patient/onboarding");
        return;
      }
      if (!pRes.ok) throw new Error("Error al cargar perfil");
      const p: Patient = await pRes.json();
      setPatient(p);

      const iRes = await fetch(`/api/intakes?patientId=${p.id}&date=${date}`);
      if (!iRes.ok) throw new Error("Error al cargar comidas");
      setIntakes(await iRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [router, date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openNewForm(mealType: MealType) {
    setFormTarget(mealType);
    setFormFields(blankForm());
  }

  function openEditForm(intake: Intake) {
    setFormTarget({ intakeId: intake.id, type: intake.mealType });
    setFormFields(intakeToForm(intake));
  }

  function updateField<K extends keyof IntakeFormFields>(key: K, value: IntakeFormFields[K]) {
    setFormFields((f) => ({ ...f, [key]: value }));
  }

  async function addIntake(mealType: MealType) {
    if (!patient) return;
    setSaving(true);
    try {
      const res = await fetch("/api/intakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          date: `${date}T12:00:00`,
          mealType,
          status: "COMPLETED",
          actualDescription: formFields.desc || undefined,
          digestiveFeedback: formFields.digestion || undefined,
          processedFoodType: formFields.processedType || undefined,
          hasGas: formFields.hasGas,
          extremeHunger: formFields.extremeHunger,
        }),
      });
      if (res.ok) {
        const alertPromises: Promise<unknown>[] = [];
        if (formFields.hasGas) {
          alertPromises.push(
            fetch("/api/alerts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                patientId: patient.id,
                type: "GAS_LEGUMES",
                message: `Has registrado gases en la comida del ${MEAL_SLOTS.find((s) => s.type === mealType)?.label ?? mealType}. Considera reducir legumbres, crucíferas o aumentar la masticación.`,
              }),
            })
          );
        }
        if (formFields.digestion === "BAD") {
          alertPromises.push(
            fetch("/api/alerts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                patientId: patient.id,
                type: "BAD_DIGESTION",
                message: `Digestión deficiente registrada en ${MEAL_SLOTS.find((s) => s.type === mealType)?.label ?? mealType}. Revisa los alimentos consumidos.`,
              }),
            })
          );
        }
        if (formFields.extremeHunger) {
          alertPromises.push(
            fetch("/api/alerts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                patientId: patient.id,
                type: "EXTREME_HUNGER",
                message: `Has registrado hambre extrema. Considera revisar tus porciones o el espaciado entre comidas.`,
              }),
            })
          );
        }
        if (alertPromises.length > 0) await Promise.allSettled(alertPromises);
      }
    } catch {
      // ignore, reload anyway
    }
    setFormTarget(null);
    setFormFields(blankForm());
    setSaving(false);
    loadData();
  }

  async function saveEdit() {
    if (typeof formTarget !== "object" || formTarget === null) return;
    const { intakeId } = formTarget as { intakeId: string; type: MealType };
    setSaving(true);
    try {
      await editIntake({
        intakeId,
        status: "MODIFIED",
        actualDescription: formFields.desc || undefined,
        digestiveFeedback: (formFields.digestion as DigestiveMood) || undefined,
        processedFoodType: (formFields.processedType as ProcessedType) || undefined,
        hasGas: formFields.hasGas,
        extremeHunger: formFields.extremeHunger,
      });
    } catch {
      // ignore
    }
    setFormTarget(null);
    setFormFields(blankForm());
    setSaving(false);
    loadData();
  }

  function quickStatus(id: string, status: IntakeStatus) {
    startTransition(async () => {
      addOptimistic({ id, status });
      await fetch(`/api/intakes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadData();
    });
  }

  const completedCount = optimisticIntakes.filter((i) => i.status === "COMPLETED").length;

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Cargando…
      </div>
    );
  if (error)
    return <div className="p-8 text-red-600">{error}</div>;

  const isEditForm = typeof formTarget === "object" && formTarget !== null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Hola, {patient?.user.name?.split(" ")[0] ?? "👋"}!
        </h1>
      </div>

      {/* Date navigation */}
      <CalendarHeader
        date={date}
        isToday={isToday}
        canGoBack={canGoBack}
        onBack={goBack}
        onForward={goForward}
      />

      {/* Progress summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 my-6 flex items-center gap-4">
        <div className="text-4xl">
          {completedCount === 0
            ? "🍽️"
            : completedCount < MEAL_SLOTS.length
              ? "✨"
              : "🏆"}
        </div>
        <div>
          <p className="text-sm text-gray-500">Comidas de este día</p>
          <p className="text-2xl font-bold text-gray-900">
            {completedCount}
            <span className="text-gray-400 text-base font-normal">
              /{MEAL_SLOTS.length}
            </span>
          </p>
        </div>
        <div className="ml-auto flex gap-1">
          {MEAL_SLOTS.map((slot) => {
            const intake = optimisticIntakes.find((i) => i.mealType === slot.type);
            const done = intake?.status === "COMPLETED";
            return (
              <div
                key={slot.type}
                className={`w-3 h-3 rounded-full ${done ? "bg-emerald-500" : "bg-gray-200"}`}
                title={slot.label}
              />
            );
          })}
        </div>
      </div>

      {/* Meal checklist */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Registro del día
      </h2>
      <div className="space-y-3">
        {MEAL_SLOTS.map((slot) => {
          const intake = optimisticIntakes.find((i) => i.mealType === slot.type);
          const isFormOpen =
            formTarget === slot.type ||
            (isEditForm &&
              (formTarget as { intakeId: string; type: MealType }).type === slot.type);

          return (
            <div
              key={slot.type}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              {/* Slot header */}
              <div className="flex items-center gap-3 px-5 py-4">
                <span className="text-xl">{slot.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {slot.label}
                    <span className="text-gray-400 font-normal ml-1.5 text-xs">
                      ~{slot.time}
                    </span>
                  </p>
                  {intake?.actualDescription && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {intake.actualDescription}
                    </p>
                  )}
                </div>
                {intake ? (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[intake.status].color}`}
                  >
                    {STATUS_LABELS[intake.status].label}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Sin registrar</span>
                )}
              </div>

              {/* Actions */}
              <div className="px-5 pb-4 flex flex-wrap gap-2">
                {intake ? (
                  <>
                    {intake.status !== "COMPLETED" && isEditable && (
                      <button
                        onClick={() => quickStatus(intake.id, "COMPLETED")}
                        disabled={isPending}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors disabled:opacity-60"
                      >
                        ✓ Completado
                      </button>
                    )}
                    {intake.status !== "SKIPPED" && isEditable && (
                      <button
                        onClick={() => quickStatus(intake.id, "SKIPPED")}
                        disabled={isPending}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 font-medium transition-colors disabled:opacity-60"
                      >
                        ✗ Saltado
                      </button>
                    )}
                    {isEditable && !isFormOpen && (
                      <button
                        onClick={() => openEditForm(intake)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-colors"
                      >
                        ✏️ Editar
                      </button>
                    )}
                  </>
                ) : (
                  isEditable && !isFormOpen && (
                    <button
                      onClick={() => openNewForm(slot.type)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
                    >
                      + Registrar
                    </button>
                  )
                )}
              </div>

              {/* Inline form (new or edit) */}
              {isFormOpen && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                  {isEditForm && (
                    <p className="text-xs font-semibold text-blue-600 mb-1">✏️ Editando registro</p>
                  )}
                  <textarea
                    rows={2}
                    value={formFields.desc}
                    onChange={(e) => updateField("desc", e.target.value)}
                    placeholder="¿Qué comiste? (opcional)"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none bg-white text-zinc-900 placeholder:text-gray-400 dark:bg-zinc-700 dark:text-white dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                  />

                  {/* Semaforización de procesados */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      🚦 Tipo de alimento
                    </p>
                    <div className="space-y-1.5">
                      {PROCESSED_OPTIONS.map(({ value, label, color, dot, hint }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            updateField("processedType", formFields.processedType === value ? "" : value)
                          }
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all text-left ${
                            formFields.processedType === value
                              ? color
                              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              formFields.processedType === value ? dot : "bg-gray-300"
                            }`}
                          />
                          <span className="font-semibold">{label}</span>
                          <span className="text-gray-400 font-normal ml-1 hidden sm:inline">{hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Digestión */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Digestión</p>
                    <div className="flex gap-2 flex-wrap">
                      {DIGESTION_OPTIONS.map(({ value, label, icon }) => (
                        <button
                          key={value}
                          onClick={() =>
                            updateField("digestion", formFields.digestion === value ? "" : value)
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-colors ${
                            formFields.digestion === value
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 text-gray-600"
                          }`}
                        >
                          {icon} {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Biofeedback */}
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formFields.hasGas}
                        onChange={(e) => updateField("hasGas", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs text-gray-700">💨 Gases / hinchazón</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formFields.extremeHunger}
                        onChange={(e) => updateField("extremeHunger", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                      />
                      <span className="text-xs text-gray-700">🔥 Hambre extrema</span>
                    </label>
                  </div>

                  {/* IA substitution shortcut (only on new intake) */}
                  {!isEditForm && formFields.desc && (
                    <Link
                      href={`/dashboard/patient/chat?q=${encodeURIComponent(
                        `Necesito una sustitución para: ${formFields.desc}`
                      )}`}
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
                      target="_blank"
                    >
                      🤖 Pedir sustitución a la IA
                    </Link>
                  )}

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => {
                        setFormTarget(null);
                        setFormFields(blankForm());
                      }}
                      className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (isEditForm) {
                          saveEdit();
                        } else {
                          addIntake(slot.type);
                        }
                      }}
                      disabled={saving}
                      className="text-xs px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 font-medium"
                    >
                      {saving ? "Guardando…" : isEditForm ? "Actualizar" : "Guardar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
