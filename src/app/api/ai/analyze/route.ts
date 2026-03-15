import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/getSession";
import { z } from "zod";

const analyzeSchema = z.object({
  patientId: z.string().min(1),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
import { getAuthSession } from "@/lib/auth";

/**
 * POST /api/ai/analyze
 * Sends daily summary data to OpenAI and returns personalized feedback.
 * Requires an authenticated session.
 */
export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (session instanceof NextResponse) return session;

  const body = await request.json();
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { patientId, dateFrom, dateTo } = parsed.data;

  // Ownership check: verify the patient belongs to the authenticated user
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: session!.user.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Gather data for AI analysis
  const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = dateTo ? new Date(dateTo) : new Date();

  const [intakes, habits, progress] = await Promise.all([
    prisma.intake.findMany({
      where: { patientId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    }),
    prisma.habitLog.findMany({
      where: { patientId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    }),
    prisma.progressLog.findMany({
      where: { patientId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    }),
  ]);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    );
  }

  const prompt = buildAnalysisPrompt({ intakes, habits, progress });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un nutricionista experto. Analiza los datos nutricionales del paciente y proporciona feedback personalizado en español. Sé específico, motivador y basado en evidencia.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Error calling OpenAI API" },
      { status: 502 }
    );
  }

  const data = await response.json();
  const feedback = data.choices?.[0]?.message?.content ?? "";

  return NextResponse.json({ feedback, analyzedPeriod: { from, to } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAnalysisPrompt(data: { intakes: any[]; habits: any[]; progress: any[] }): string {
  const completedIntakes = data.intakes.filter((i) => i.status === "COMPLETED").length;
  const totalIntakes = data.intakes.length;
  const adherence = totalIntakes > 0 ? Math.round((completedIntakes / totalIntakes) * 100) : 0;

  const badDigestion = data.intakes.filter((i) => i.digestiveFeedback === "BAD").length;
  const extremeHungerCount = data.intakes.filter((i) => i.extremeHunger).length;

  const avgSleep =
    data.habits.length > 0
      ? (data.habits.reduce((a, h) => a + (h.sleepHours ?? 0), 0) / data.habits.length).toFixed(1)
      : "N/A";

  const latestWeight = data.progress.at(-1)?.weight ?? "N/A";

  return `Analiza los siguientes datos del paciente:
- Adherencia al plan: ${adherence}% (${completedIntakes}/${totalIntakes} comidas completadas)
- Episodios de mala digestión: ${badDigestion}
- Episodios de hambre extrema: ${extremeHungerCount}
- Horas de sueño promedio: ${avgSleep}h
- Último peso registrado: ${latestWeight} kg

Por favor proporciona:
1. Un resumen del estado actual (2-3 frases)
2. 3 recomendaciones específicas para mejorar
3. Alertas o señales de advertencia si las hay`;
}
