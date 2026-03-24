"use client";

import { useEffect, useState, useCallback } from "react";

type AlertType =
  | "CARBS_AT_DINNER"
  | "LOW_ADHERENCE"
  | "BAD_DIGESTION"
  | "MISSING_LOGS"
  | "EXTREME_HUNGER"
  | "GAS_LEGUMES"
  | "SUPPLEMENT_MISSED"
  | "CUSTOM";

interface DeviationAlert {
  id: string;
  type: AlertType;
  message: string;
  isRead: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

const ALERT_META: Record<AlertType, { label: string; icon: string; color: string }> = {
  CARBS_AT_DINNER: { label: "Carbohidratos en cena", icon: "🍞", color: "text-orange-600 bg-orange-50 border-orange-200" },
  LOW_ADHERENCE: { label: "Baja adherencia", icon: "📉", color: "text-red-600 bg-red-50 border-red-200" },
  BAD_DIGESTION: { label: "Digestión deficiente", icon: "😣", color: "text-amber-600 bg-amber-50 border-amber-200" },
  MISSING_LOGS: { label: "Registros incompletos", icon: "📋", color: "text-blue-600 bg-blue-50 border-blue-200" },
  EXTREME_HUNGER: { label: "Hambre extrema", icon: "🔥", color: "text-red-700 bg-red-50 border-red-300" },
  GAS_LEGUMES: { label: "Gases con legumbres", icon: "💨", color: "text-purple-600 bg-purple-50 border-purple-200" },
  SUPPLEMENT_MISSED: { label: "Suplemento olvidado", icon: "💊", color: "text-teal-600 bg-teal-50 border-teal-200" },
  CUSTOM: { label: "Aviso del nutricionista", icon: "👨‍⚕️", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<DeviationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "resolved">("all");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter === "unread" ? "?isRead=false" : "";
      const res = await fetch(`/api/alerts${params}`);
      if (res.ok) setAlerts(await res.json());
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markAsRead = async (id: string) => {
    // Use PATCH via inline fetch - mark as read by PATCH on the alert
    const res = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    if (res.ok) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );
    }
  };

  const markAllRead = async () => {
    const unread = alerts.filter((a) => !a.isRead);
    await Promise.all(unread.map((a) => markAsRead(a.id)));
  };

  const filtered = alerts.filter((a) => {
    if (filter === "unread") return !a.isRead;
    if (filter === "resolved") return !!a.resolvedAt;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Alertas de desviación</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tu nutricionista y el sistema te avisan cuando algo requiere atención
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-emerald-600 hover:underline"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["all", "unread", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {f === "all" ? "Todas" : f === "unread" ? `Sin leer${unreadCount > 0 ? ` (${unreadCount})` : ""}` : "Resueltas"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-4xl block mb-3">✅</span>
          <p className="font-medium text-gray-600">
            {filter === "unread" ? "No tienes alertas sin leer" : "No hay alertas aquí"}
          </p>
          <p className="text-sm mt-1">¡Sigue con tu buen trabajo!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const meta = ALERT_META[alert.type];
            return (
              <div
                key={alert.id}
                className={`relative rounded-xl border p-4 transition-opacity ${meta.color} ${alert.isRead ? "opacity-70" : ""
                  }`}
              >
                {!alert.isRead && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-current opacity-70" />
                )}
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {meta.label}
                      </span>
                      {alert.resolvedAt && (
                        <span className="text-xs bg-white/60 rounded-full px-2 py-0.5 border">
                          Resuelta
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1 text-gray-700">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(alert.createdAt).toLocaleDateString("es-ES", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {!alert.isRead && (
                  <button
                    onClick={() => markAsRead(alert.id)}
                    className="mt-3 text-xs font-medium underline underline-offset-2 hover:no-underline"
                  >
                    Marcar como leída
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
