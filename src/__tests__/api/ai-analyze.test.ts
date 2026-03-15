import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { POST } from "@/app/api/ai/analyze/route";
import { buildRequest } from "../helpers";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

function mockOpenAIResponse(content: string) {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        choices: [{ message: { content } }],
      }),
  });
}

describe("POST /api/ai/analyze", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 400 when patientId is missing", async () => {
    const req = buildRequest("/api/ai/analyze", {
      method: "POST",
      body: {},
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/patientId is required/i);
  });

  it("returns 503 when OPENAI_API_KEY is not configured", async () => {
    delete process.env.OPENAI_API_KEY;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/ai/analyze", {
      method: "POST",
      body: { patientId: "patient-1" },
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/OpenAI API key not configured/i);
  });

  it("returns feedback from OpenAI on success", async () => {
    const aiContent = "Tu adherencia ha sido excelente esta semana.";
    global.fetch = mockOpenAIResponse(aiContent);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValue([
      { status: "COMPLETED", digestiveFeedback: "GOOD", extremeHunger: false },
      { status: "COMPLETED", digestiveFeedback: "NEUTRAL", extremeHunger: false },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.findMany as any).mockResolvedValue([
      { sleepHours: 7.5 },
      { sleepHours: 8 },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.findMany as any).mockResolvedValue([{ weight: 75 }]);

    const req = buildRequest("/api/ai/analyze", {
      method: "POST",
      body: { patientId: "patient-1" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.feedback).toBe(aiContent);
    expect(body.analyzedPeriod).toBeDefined();
    expect(body.analyzedPeriod.from).toBeDefined();
    expect(body.analyzedPeriod.to).toBeDefined();
  });

  it("returns 502 when OpenAI API returns an error response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/ai/analyze", {
      method: "POST",
      body: { patientId: "patient-1" },
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
  });

  it("uses custom date range when dateFrom and dateTo are provided", async () => {
    const aiContent = "Análisis de período específico.";
    global.fetch = mockOpenAIResponse(aiContent);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/ai/analyze", {
      method: "POST",
      body: {
        patientId: "patient-1",
        dateFrom: "2024-01-01",
        dateTo: "2024-01-07",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(new Date(body.analyzedPeriod.from).getFullYear()).toBe(2024);
  });

  it("sends POST request to correct OpenAI endpoint", async () => {
    global.fetch = mockOpenAIResponse("feedback");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/ai/analyze", {
      method: "POST",
      body: { patientId: "patient-1" },
    });
    await POST(req);

    expect(global.fetch).toHaveBeenCalledWith(
      OPENAI_API_URL,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      })
    );
  });
});
