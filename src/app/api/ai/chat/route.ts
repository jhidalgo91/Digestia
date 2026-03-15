import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/getSession";
import { z } from "zod";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const chatSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(50),
  patientContext: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/ai/chat
 * AI-powered chatbot for patient queries.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  const { response: authError } = await requireSession();
  if (authError) return authError;

  const body = await request.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { messages, patientContext } = parsed.data;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    );
  }

  const systemPrompt = `Eres DigestAI, un asistente nutricional inteligente especializado en el método del nutricionista Javier Hidalgo. 
Ayudas a los pacientes con:
- Dudas sobre su plan nutricional
- Sustituciones de alimentos inteligentes
- Comprensión de hábitos saludables
- Interpretación de su biofeedback digestivo
- Motivación y seguimiento

Contexto del paciente: ${patientContext ? JSON.stringify(patientContext) : "No disponible"}

Responde siempre en español, de manera amigable, clara y basada en evidencia científica.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.8,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Error calling OpenAI API" }, { status: 502 });
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content ?? "";

  return NextResponse.json({ reply });
}
