"use client";

import { useEffect, useState, useCallback } from "react";
import CalendarHeader from "@/components/patient/CalendarHeader";
import { useSelectedDate } from "@/hooks/useSelectedDate";
import { toggleSupplementLog } from "@/services/supplementActions";

interface Supplement {
  name: string;
  defaultDoseUnit: string | null;
}

interface PatientSupplement {
  id: string;
  supplementId: string;
  doseMg: number | null;
  doseUnit: string | null;
  scheduledTime: string | null;
  frequency: string | null;
  isActive: boolean;
  supplement: Supplement;
  logs: SupplementLog[];
}

interface SupplementLog {
  id: string;
  taken: boolean;
  actualTime: string | null;
  date: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function SupplementsPage() {
  const { date, goBack, goForward, isToday, canGoBack, isEditable } = useSelectedDate();
  const [supplements, setSupplements] = useState<PatientSupplement[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    dose: "",
    doseUnit: "mg",
    scheduledTime: "",
    frequency: "Diario",
  });

  const fetchSupplements = useCallback(async (pid: string) => {
    const res = await fetch(`/api/supplements?patientId=${pid}&date=${date}`);
    if (res.ok) setSupplements(await res.json());
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetch("/api/patients/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setPatientId(data.id);
          fetchSupplements(data.id);
        }
      });
  }, [fetchSupplements]);

  const toggleTaken = async (ps: PatientSupplement) => {
    if (!isEditable) return;
    const currentLog = ps.logs?.[0];
    const newTaken = !currentLog?.taken;
    setSaving(ps.id);
    try {
      await toggleSupplementLog({
        patientSupplementId: ps.id,
        date,
        taken: newTaken,
      });
      setSupplements((prev) =>
        prev.map((s) =>
          s.id === ps.id
            ? {
              ...s,
              logs: [{
                id: currentLog?.id ?? "new",
                taken: newTaken,
                actualTime: newTaken ? new Date().toISOString() : null,
                date,
              }],
            }
            : s
        )
      );
    } finally {
      setSaving(null);
    }
  };

  const handleAddSupplement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !addForm.name.trim()) return;
    setSaving("add");

    // First, create the supplement catalog entry + patient link via the supplements API
    // We'll POST with a temporary supplementId; the server needs to handle name-based creation.
    // For simplicity, we use a special endpoint that creates both.
    const res = await fetch("/api/supplements/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        supplementName: addForm.name.trim(),
        doseMg: addForm.dose ? parseFloat(addForm.dose) : undefined,
        doseUnit: addForm.doseUnit,
        scheduledTime: addForm.scheduledTime,
        frequency: addForm.frequency,
      }),
    });

    if (res.ok) {
      setAddForm({ name: "", dose: "", doseUnit: "mg", scheduledTime: "", frequency: "Diario" });
      setShowAddForm(false);
      fetchSupplements(patientId);
    }
    setSaving(null);
  };

  const takenCount = supplements.filter((s) => s.logs?.[0]?.taken).length;
  const total = supplements.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">💊 Pastillero digital</h1>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="text-sm bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            + Añadir
          </button>
        </div>

        <CalendarHeader
          date={date}
          isToday={isToday}
          canGoBack={canGoBack}
          onBack={goBack}
          onForward={goForward}
        />

        {/* Progress bar */}
        {total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="font-medium text-zinc-500 mb-1">Progreso del día</span>
              <span className="font-medium text-emerald-700">{takenCount}/{total}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: total > 0 ? `${(takenCount / total) * 100}%` : "0%" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSupplement}
          className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3"
        >
          <h3 className="text-sm font-semibold text-emerald-800">Nuevo suplemento</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Nombre *</label>
              <input
                required
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Vitamina D3, Magnesio..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dosis</label>
              <input
                type="number"
                min={0}
                value={addForm.dose}
                onChange={(e) => setAddForm((f) => ({ ...f, dose: e.target.value }))}
                placeholder="Ej: 1000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Unidad</label>
              <select
                value={addForm.doseUnit}
                onChange={(e) => setAddForm((f) => ({ ...f, doseUnit: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {["mg", "mcg", "g", "UI", "ml", "cápsula(s)", "comprimido(s)"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hora programada</label>
              <input
                type="time"
                value={addForm.scheduledTime}
                onChange={(e) => setAddForm((f) => ({ ...f, scheduledTime: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Frecuencia</label>
              <select
                value={addForm.frequency}
                onChange={(e) => setAddForm((f) => ({ ...f, frequency: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {["Diario", "Cada 12h", "Cada 8h", "Días alternos", "Semanal", "Con comidas"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving === "add"}
              className="text-sm bg-emerald-600 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving === "add" ? "Guardando..." : "Añadir suplemento"}
            </button>
          </div>
        </form>
      )}

      {/* Supplements list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : supplements.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-4xl block mb-3">💊</span>
          <p className="font-medium text-gray-600">Sin suplementos configurados</p>
          <p className="text-sm mt-1">
            Añade tus suplementos o espera a que tu nutricionista los asigne.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {supplements.map((ps) => {
            const taken = ps.logs?.[0]?.taken ?? false;
            const isSaving = saving === ps.id;
            return (
              <div
                key={ps.id}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${taken
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-gray-200"
                  }`}
              >
                {/* Checkbox toggle */}
                <button
                  onClick={() => toggleTaken(ps)}
                  disabled={isSaving || !isEditable}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${taken
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-gray-300 hover:border-emerald-400"
                    } ${isSaving ? "opacity-50" : ""}`}
                >
                  {taken && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${taken ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {ps.supplement.name}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {ps.doseMg && (
                      <span className="text-xs text-gray-500">
                        {ps.doseMg} {ps.doseUnit ?? "mg"}
                      </span>
                    )}
                    {ps.scheduledTime && (
                      <span className="text-xs text-gray-500">🕐 {ps.scheduledTime}</span>
                    )}
                    {ps.frequency && (
                      <span className="text-xs text-gray-500">🔁 {ps.frequency}</span>
                    )}
                  </div>
                </div>

                {taken && ps.logs?.[0]?.actualTime && (
                  <span className="text-xs text-emerald-600 shrink-0">
                    ✓ {new Date(ps.logs[0].actualTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* All done banner */}
      {total > 0 && takenCount === total && (
        <div className="text-center py-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-emerald-700 font-semibold text-sm">
            🎉 ¡Has tomado todos tus suplementos de este día!
          </p>
        </div>
      )}
    </div>
  );
}
