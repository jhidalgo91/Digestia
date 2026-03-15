import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { GET, POST } from "@/app/api/progress/route";
import { buildRequest } from "../helpers";

describe("GET /api/progress", () => {
  it("returns 400 when patientId is missing", async () => {
    const req = buildRequest("/api/progress");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/patientId is required/i);
  });

  it("returns progress logs for a valid patientId", async () => {
    const fakeLogs = [
      { id: "prog-1", patientId: "patient-1", date: new Date(), weight: 75.5 },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.findMany as any).mockResolvedValue(fakeLogs);

    const req = buildRequest("/api/progress", {
      searchParams: { patientId: "patient-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].weight).toBe(75.5);
  });

  it("applies date range filters when provided", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/progress", {
      searchParams: {
        patientId: "patient-1",
        dateFrom: "2024-01-01",
        dateTo: "2024-03-31",
      },
    });
    await GET(req);

    const call = (prismaMock.progressLog.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.date.gte).toBeInstanceOf(Date);
    expect(call.where.date.lte).toBeInstanceOf(Date);
  });
});

describe("POST /api/progress", () => {
  it("returns 400 when required fields are missing", async () => {
    const req = buildRequest("/api/progress", {
      method: "POST",
      body: { patientId: "p-1" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/patientId and date are required/i);
  });

  it("upserts a progress log and returns 201", async () => {
    const upserted = {
      id: "prog-1",
      patientId: "patient-1",
      date: new Date("2024-02-20"),
      weight: 72.3,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.progressLog.upsert as any).mockResolvedValue(upserted);

    const req = buildRequest("/api/progress", {
      method: "POST",
      body: { patientId: "patient-1", date: "2024-02-20", weight: 72.3 },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.weight).toBe(72.3);
  });
});
