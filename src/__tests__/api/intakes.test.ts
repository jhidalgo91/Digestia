import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { GET, POST } from "@/app/api/intakes/route";
import { buildRequest } from "../helpers";

describe("GET /api/intakes", () => {
  it("returns 400 when patientId is missing", async () => {
    const req = buildRequest("/api/intakes");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/patientId is required/i);
  });

  it("returns intakes for a valid patientId", async () => {
    const fakeIntakes = [
      { id: "intake-1", patientId: "patient-1", mealType: "BREAKFAST", date: new Date() },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValue(fakeIntakes);

    const req = buildRequest("/api/intakes", {
      searchParams: { patientId: "patient-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("intake-1");
  });

  it("filters intakes by date when date param is provided", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/intakes", {
      searchParams: { patientId: "patient-1", date: "2024-01-15" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const call = (prismaMock.intake.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.date).toBeDefined();
    expect(call.where.date.gte).toBeInstanceOf(Date);
    expect(call.where.date.lte).toBeInstanceOf(Date);
  });
});

describe("POST /api/intakes", () => {
  it("returns 400 when required fields are missing", async () => {
    const req = buildRequest("/api/intakes", { method: "POST", body: { patientId: "p-1" } });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/patientId, date and mealType are required/i);
  });

  it("creates an intake and returns 201", async () => {
    const created = {
      id: "intake-new",
      patientId: "patient-1",
      date: new Date("2024-01-15"),
      mealType: "LUNCH",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.create as any).mockResolvedValue(created);

    const req = buildRequest("/api/intakes", {
      method: "POST",
      body: { patientId: "patient-1", date: "2024-01-15T12:00:00Z", mealType: "LUNCH" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("intake-new");
  });

  it("returns 400 when mealType is missing", async () => {
    const req = buildRequest("/api/intakes", {
      method: "POST",
      body: { patientId: "p-1", date: "2024-01-15" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
