"use client";

import React, { useState } from "react";
import { updateIntakeStatus } from "../../services/intakeActions";
import type { Intake as IntakeType } from "@prisma/client";

type Props = {
    initialIntakes: IntakeType[];
};

export default function DailyChecklist({ initialIntakes }: Props) {
    const [intakes, setIntakes] = useState(initialIntakes);
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const mark = async (id: string, status: "COMPLETED" | "MODIFIED" | "SKIPPED", extra?: { mood?: "GOOD" | "NEUTRAL" | "BAD" }) => {
        setLoading((s) => ({ ...s, [id]: true }));
        try {
            const payload: any = { intakeId: id, status };
            if (extra?.mood) payload.digestiveMood = extra.mood;
            if (status === "MODIFIED") {
                const descr = window.prompt("Describe brevemente la modificación:");
                if (descr) payload.actualDescription = descr;
            }

            const updated = await updateIntakeStatus(payload);
            setIntakes((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
        } catch (e: any) {
            console.error(e);
            alert(e?.message ?? "Error al actualizar la ingesta");
        } finally {
            setLoading((s) => ({ ...s, [id]: false }));
        }
    };

    return (
        <div className="grid gap-3">
            {intakes.map((intake) => (
                <article key={intake.id} className="p-3 border rounded">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-semibold">{intake.mealType}</div>
                            <div className="text-sm text-muted-foreground">{intake.planDescription ?? "Sin plan"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button disabled={!!loading[intake.id]} onClick={() => mark(intake.id, "COMPLETED")} className="btn">
                                {loading[intake.id] ? "..." : "Completado"}
                            </button>
                            <button disabled={!!loading[intake.id]} onClick={() => mark(intake.id, "MODIFIED")} className="btn-ghost">
                                Modificar
                            </button>
                        </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                        <div className="flex gap-2">
                            <button onClick={() => mark(intake.id, intake.status as any, { mood: "GOOD" })} aria-label="Buena digestión">
                                😃
                            </button>
                            <button onClick={() => mark(intake.id, intake.status as any, { mood: "NEUTRAL" })} aria-label="Digestión neutra">
                                😐
                            </button>
                            <button onClick={() => mark(intake.id, intake.status as any, { mood: "BAD" })} aria-label="Mala digestión">
                                🤢
                            </button>
                        </div>

                        <div className="text-sm text-muted-foreground">Estado: {intake.status}</div>
                    </div>
                </article>
            ))}
        </div>
    );
}
