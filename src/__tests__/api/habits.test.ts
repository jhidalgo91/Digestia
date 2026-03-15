import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { GET, POST } from "@/app/api/habits/route";
import { buildRequest } from "../helpers";

describe("GET /api/habits", () => {
  it("returns 400 when patientId is missing", async () => {
    const req = buildRequest("/api/habits");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/patientId is required/i);
  });

  it("returns habit logs for a valid patientId", async () => {
    const fakeLogs = [
      { id: "log-1", patientId: "patient-1", date: new Date(), sleepHours: 7.5 },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.findMany as any).mockResolvedValue(fakeLogs);

    const req = buildRequest("/api/habits", {
      searchParams: { patientId: "patient-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].sleepHours).toBe(7.5);
  });

  it("applies date filters when dateFrom and dateTo are provided", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/habits", {
      searchParams: {
        patientId: "patient-1",
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
      },
    });
    await GET(req);

    const call = (prismaMock.habitLog.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.date.gte).toBeInstanceOf(Date);
    expect(call.where.date.lte).toBeInstanceOf(Date);
  });
});

describe("POST /api/habits", () => {
  it("returns 400 when required fields are missing", async () => {
    const req = buildRequest("/api/habits", {
      method: "POST",
      body: { patientId: "p-1" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/patientId and date are required/i);
  });

  it("upserts a habit log and returns 201", async () => {
    const upserted = {
      id: "log-1",
      patientId: "patient-1",
      date: new Date("2024-01-15"),
      sleepHours: 8,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.habitLog.upsert as any).mockResolvedValue(upserted);

    const req = buildRequest("/api/habits", {
      method: "POST",
      body: { patientId: "patient-1", date: "2024-01-15", sleepHours: 8 },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("log-1");
    expect(body.sleepHours).toBe(8);
  });
});
