"use client";

import { useState, useCallback } from "react";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "PRE_WORKOUT" | "POST_WORKOUT";
type ColorTag = "BLUE_PROTEIN" | "ORANGE_CARBS" | "GREEN_VEGGIES" | "NEUTRAL";

interface PlannedMealDraft {
  id: string; // local draft id
  dayOfWeek: number;
  mealType: MealType;
  description: string;
  colorTag: ColorTag;
  orderIndex: number;
}

const COLOR_META: Record<
  ColorTag,
  { label: string; bg: string; text: string; border: string; emoji: string; hint: string; ring: string }
> = {
  BLUE_PROTEIN: {
    label: "Proteína",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    emoji: "🔵",
    hint: "Pollo, pavo, huevos, sardinas, ternera, legumbres...",
    ring: "ring-blue-200",
  },
  ORANGE_CARBS: {
    label: "Carbohidrato",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    emoji: "🟠",
    hint: "Arroz, pasta, patata, avena, pan, fruta...",
    ring: "ring-orange-200",
  },
  GREEN_VEGGIES: {
    label: "Verdura/Fibra",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    emoji: "🟢",
    hint: "Espinacas, brócoli, zanahoria, pimiento, ensalada...",
    ring: "ring-green-200",
  },
  NEUTRAL: {
    label: "Neutral/Grasa",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    emoji: "⚪",
    hint: "Aceite, aguacate, frutos secos, queso, mantequilla...",
    ring: "ring-gray-200",
  },
};

const MEAL_META: Record<MealType, { label: string; emoji: string }> = {
  BREAKFAST: { label: "Desayuno", emoji: "☀️" },
  SNACK: { label: "Media mañana / Merienda", emoji: "🍎" },
  LUNCH: { label: "Almuerzo", emoji: "🌤️" },
  DINNER: { label: "Cena", emoji: "🌙" },
  PRE_WORKOUT: { label: "Pre-entrenamiento", emoji: "🏋️" },
  POST_WORKOUT: { label: "Post-entrenamiento", emoji: "🥤" },
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

let draftCounter = 0;

function newDraftId() {
  return `draft-${++draftCounter}`;
}

export default function MealBuilderPage() {
  const [planName, setPlanName] = useState("Mi plan semanal");
  const [meals, setMeals] = useState<PlannedMealDraft[]>([]);
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Lunes
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addingMeal, setAddingMeal] = useState<{
    dayOfWeek: number; mealType: MealType;
  } | null>(null);
  const [mealForm, setMealForm] = useState({ description: "", colorTag: "BLUE_PROTEIN" as ColorTag });

  const mealsForDay = meals.filter((m) => m.dayOfWeek === selectedDay);

  const addMeal = useCallback(() => {
    if (!addingMeal || !mealForm.description.trim()) return;
    const existing = meals.filter(
      (m) => m.dayOfWeek === addingMeal.dayOfWeek && m.mealType === addingMeal.mealType
    );
    setMeals((prev) => [
      ...prev,
      {
        id: newDraftId(),
        dayOfWeek: addingMeal.dayOfWeek,
        mealType: addingMeal.mealType,
        description: mealForm.description.trim(),
        colorTag: mealForm.colorTag,
        orderIndex: existing.length,
      },
    ]);
    setMealForm({ description: "", colorTag: "BLUE_PROTEIN" });
    setAddingMeal(null);
  }, [addingMeal, mealForm, meals]);

  const removeMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const savePlan = async () => {
    if (!planName.trim() || meals.length === 0) return;
    setSaving(true);
    setSaved(false);

    // We send the plan to the API — first we need the patientId from /api/patients/me
    const profileRes = await fetch("/api/patients/me");
    if (!profileRes.ok) { setSaving(false); return; }
    const patient = await profileRes.json();

    const res = await fetch("/api/meal-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: patient.id,
        name: planName.trim(),
        startDate: new Date().toISOString(),
        plannedMeals: meals.map(({ dayOfWeek, mealType, description, colorTag, orderIndex }) => ({
          dayOfWeek,
          mealType,
          description,
          colorTag,
          orderIndex,
        })),
      }),
    });

    setSaving(false);
    if (res.ok) setSaved(true);
  };

  const colorCount = (tag: ColorTag) =>
    mealsForDay.filter((m) => m.colorTag === tag).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">🎨 Constructor de menús</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Diseña tu semana por colores de macronutrientes
          </p>
        </div>
        <button
          onClick={savePlan}
          disabled={saving || meals.length === 0}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 transition-colors"
        >
          {saving ? "Guardando..." : saved ? "✓ Plan guardado" : "Guardar plan"}
        </button>
      </div>

      {/* Plan name */}
      <input
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
        className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        placeholder="Nombre del plan..."
      />

      {/* Color legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(COLOR_META) as ColorTag[]).map((tag) => {
          const meta = COLOR_META[tag];
          const count = colorCount(tag);
          return (
            <div key={tag} className={`rounded-xl border p-3 ${meta.bg} ${meta.border}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span>{meta.emoji}</span>
                <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
                {count > 0 && (
                  <span className={`ml-auto text-xs font-bold ${meta.text}`}>{count}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-snug">{meta.hint}</p>
            </div>
          );
        })}
      </div>

      {/* Day selector */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        {DAYS.map((day, i) => {
          const dayMeals = meals.filter((m) => m.dayOfWeek === i);
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(i)}
              className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${selectedDay === i
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              {day.slice(0, 3)}
              {dayMeals.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center ${selectedDay === i ? "bg-white text-emerald-700" : "bg-emerald-500 text-white"
                  }`}>
                  {dayMeals.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Meals for selected day */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">{DAYS[selectedDay]}</h2>

        {(Object.keys(MEAL_META) as MealType[]).map((mealType) => {
          const meta = MEAL_META[mealType];
          const slotMeals = mealsForDay.filter((m) => m.mealType === mealType);
          const isAdding = addingMeal?.dayOfWeek === selectedDay && addingMeal.mealType === mealType;

          return (
            <div key={mealType} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span>{meta.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                </div>
                <button
                  onClick={() => {
                    setAddingMeal({ dayOfWeek: selectedDay, mealType });
                    setMealForm({ description: "", colorTag: "BLUE_PROTEIN" });
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  + Añadir plato
                </button>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-50">
                {slotMeals.map((m) => {
                  const cm = COLOR_META[m.colorTag];
                  return (
                    <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 ${cm.bg}`}>
                      <span className="text-base shrink-0">{cm.emoji}</span>
                      <p className={`flex-1 text-sm ${cm.text}`}>{m.description}</p>
                      <button
                        onClick={() => removeMeal(m.id)}
                        className="text-gray-300 hover:text-red-400 text-xs shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}

                {slotMeals.length === 0 && !isAdding && (
                  <div className="px-4 py-3 text-xs text-gray-400 italic">Sin platos</div>
                )}

                {/* Inline add form */}
                {isAdding && (
                  <div className="px-4 py-3 bg-gray-50 space-y-2">
                    <textarea
                      autoFocus
                      value={mealForm.description}
                      onChange={(e) => setMealForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe el plato..."
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-zinc-900 placeholder:text-gray-400 dark:bg-zinc-700 dark:text-white dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {(Object.keys(COLOR_META) as ColorTag[]).map((tag) => {
                        const cm = COLOR_META[tag];
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setMealForm((f) => ({ ...f, colorTag: tag }))}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${mealForm.colorTag === tag
                                ? `${cm.bg} ${cm.text} ${cm.border} ${cm.ring} ring-2 ring-offset-1`
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            {cm.emoji} {cm.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setAddingMeal(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={addMeal}
                        disabled={!mealForm.description.trim()}
                        className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-40"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
