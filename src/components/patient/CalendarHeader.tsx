"use client";

import { MAX_DAYS_BACK } from "@/hooks/useSelectedDate";

interface CalendarHeaderProps {
  date: string;
  isToday: boolean;
  canGoBack: boolean;
  onBack: () => void;
  onForward: () => void;
  /** Optional extra content (e.g. a label or badge) */
  children?: React.ReactNode;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getDayLabel(iso: string, isToday: boolean): string {
  if (isToday) return "Hoy";
  const today = new Date();
  const d = new Date(iso + "T12:00:00");
  const diffMs = today.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0);
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays === 1) return "Ayer";
  return `Hace ${diffDays} días`;
}

export default function CalendarHeader({
  date,
  isToday,
  canGoBack,
  onBack,
  onForward,
  children,
}: CalendarHeaderProps) {
  const label = getDayLabel(date, isToday);

  return (
    <div className="flex items-center gap-3">
      {/* Back arrow */}
      <button
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Día anterior"
        className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ←
      </button>

      {/* Date display */}
      <div className="flex-1 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-semibold text-gray-900 capitalize">
            {formatDate(date)}
          </span>
          {!isToday && (
            <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
              {label}
            </span>
          )}
        </div>
        {!isToday && (
          <p className="text-xs text-gray-400 mt-0.5">
            Puedes editar hasta {MAX_DAYS_BACK} días atrás
          </p>
        )}
      </div>

      {/* Forward arrow */}
      <button
        onClick={onForward}
        disabled={isToday}
        aria-label="Día siguiente"
        className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        →
      </button>

      {children}
    </div>
  );
}
