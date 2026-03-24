"use client";

import { useState } from "react";

export const MAX_DAYS_BACK = 7;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface UseSelectedDate {
  date: string;
  setDate: (d: string) => void;
  goBack: () => void;
  goForward: () => void;
  isToday: boolean;
  canGoBack: boolean;
  isEditable: boolean; // within 7-day window
}

export function useSelectedDate(): UseSelectedDate {
  const [date, setDateRaw] = useState<string>(todayISO());

  function minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - MAX_DAYS_BACK);
    return d.toISOString().slice(0, 10);
  }

  function goBack() {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() - 1);
    const next = d.toISOString().slice(0, 10);
    if (next >= minDate()) setDateRaw(next);
  }

  function goForward() {
    const today = todayISO();
    if (date >= today) return;
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + 1);
    setDateRaw(d.toISOString().slice(0, 10));
  }

  function setDate(d: string) {
    if (d >= minDate() && d <= todayISO()) setDateRaw(d);
  }

  const isToday = date === todayISO();
  const canGoBack = date > minDate();
  const isEditable = date >= minDate();

  return { date, setDate, goBack, goForward, isToday, canGoBack, isEditable };
}
