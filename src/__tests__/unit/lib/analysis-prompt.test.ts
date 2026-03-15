/**
 * Unit tests for the buildAnalysisPrompt helper (extracted from analyze route).
 * These test the prompt-building logic in isolation by inspecting the actual
 * fetch call made by the route.
 */
import "../../../__mocks__/prisma";
import { prismaMock } from "../../../__mocks__/prisma";
import { POST } from "@/app/api/ai/analyze/route";
import { buildRequest } from "../../helpers";

describe("buildAnalysisPrompt (via POST /api/ai/analyze)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("calculates 100% adherence when all intakes are COMPLETED", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValue([
      { status: "COMPLETED", digestiveFeedback: "GOOD", extremeHunger: false },
      { status: "COMPLETED", digestiveFeedback: "GOOD", extremeHunger: false },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/ai/analyze", {
      method: "POST",
      body: { patientId: "patient-1" },
    });
    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    const userMessage = requestBody.messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("100%");
    expect(userMessage.content).toContain("2/2");
  });

  it("calculates 0% adherence when no intakes exist", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
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
    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    const userMessage = requestBody.messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("0%");
  });

  it("counts bad digestion episodes correctly", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValue([
      { status: "COMPLETED", digestiveFeedback: "BAD", extremeHunger: false },
      { status: "COMPLETED", digestiveFeedback: "BAD", extremeHunger: false },
      { status: "COMPLETED", digestiveFeedback: "GOOD", extremeHunger: false },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/ai/analyze", {
      method: "POST",
      body: { patientId: "patient-1" },
    });
    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    const userMessage = requestBody.messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("Episodios de mala digestión: 2");
  });

  it("calculates average sleep hours correctly", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.findMany as any).mockResolvedValue([
      { sleepHours: 6 },
      { sleepHours: 8 },
      { sleepHours: 7 },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/ai/analyze", {
      method: "POST",
      body: { patientId: "patient-1" },
    });
    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    const userMessage = requestBody.messages.find((m: { role: string }) => m.role === "user");
    // Average of 6+8+7 = 21/3 = 7.0
    expect(userMessage.content).toContain("7.0h");
  });

  it("includes latest weight from progress logs", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.findMany as any).mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.findMany as any).mockResolvedValue([
      { weight: 80 },
      { weight: 79.5 },
    ]);

    const req = buildRequest("/api/ai/analyze", {
      method: "POST",
      body: { patientId: "patient-1" },
    });
    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    const userMessage = requestBody.messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("79.5 kg");
  });

  it("shows N/A for sleep when no habit logs exist", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
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
    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    const userMessage = requestBody.messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("N/Ah");
  });
});
