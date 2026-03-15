import { POST } from "@/app/api/ai/chat/route";
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

describe("POST /api/ai/chat", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 400 when messages array is missing", async () => {
    const req = buildRequest("/api/ai/chat", {
      method: "POST",
      body: {},
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/messages array is required/i);
  });

  it("returns 400 when messages is not an array", async () => {
    const req = buildRequest("/api/ai/chat", {
      method: "POST",
      body: { messages: "not-an-array" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 503 when OPENAI_API_KEY is not configured", async () => {
    delete process.env.OPENAI_API_KEY;

    const req = buildRequest("/api/ai/chat", {
      method: "POST",
      body: { messages: [{ role: "user", content: "Hola" }] },
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/OpenAI API key not configured/i);
  });

  it("returns AI reply on success", async () => {
    const aiReply = "¡Hola! ¿En qué puedo ayudarte con tu plan nutricional?";
    global.fetch = mockOpenAIResponse(aiReply);

    const req = buildRequest("/api/ai/chat", {
      method: "POST",
      body: { messages: [{ role: "user", content: "Hola, necesito consejo" }] },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reply).toBe(aiReply);
  });

  it("returns 502 when OpenAI API returns an error", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 });

    const req = buildRequest("/api/ai/chat", {
      method: "POST",
      body: { messages: [{ role: "user", content: "Hola" }] },
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
  });

  it("includes patientContext in the system prompt", async () => {
    const aiReply = "Respuesta personalizada.";
    global.fetch = mockOpenAIResponse(aiReply);

    const patientContext = { name: "María", weight: 68, targetCalories: 1800 };
    const req = buildRequest("/api/ai/chat", {
      method: "POST",
      body: {
        messages: [{ role: "user", content: "¿Cuántas calorías necesito?" }],
        patientContext,
      },
    });
    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    const systemMessage = requestBody.messages.find(
      (m: { role: string }) => m.role === "system"
    );
    expect(systemMessage.content).toContain(JSON.stringify(patientContext));
  });

  it("sends request to correct OpenAI endpoint with bearer token", async () => {
    global.fetch = mockOpenAIResponse("ok");

    const req = buildRequest("/api/ai/chat", {
      method: "POST",
      body: { messages: [{ role: "user", content: "Test" }] },
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
