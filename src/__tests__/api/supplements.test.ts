import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { GET, POST } from "@/app/api/supplements/route";
import { buildRequest } from "../helpers";

describe("GET /api/supplements", () => {
  it("returns 400 when patientId is missing", async () => {
    const req = buildRequest("/api/supplements");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/patientId is required/i);
  });

  it("returns active supplements for a patientId", async () => {
    const fakeSupplements = [
      {
        id: "ps-1",
        patientId: "patient-1",
        supplementId: "supp-1",
        isActive: true,
        supplement: { id: "supp-1", name: "Creatina" },
        logs: [],
      },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.patientSupplement.findMany as any).mockResolvedValue(fakeSupplements);

    const req = buildRequest("/api/supplements", {
      searchParams: { patientId: "patient-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].supplement.name).toBe("Creatina");
  });

  it("includes supplement logs when date is provided", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.patientSupplement.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/supplements", {
      searchParams: { patientId: "patient-1", date: "2024-01-15" },
    });
    await GET(req);

    const call = (prismaMock.patientSupplement.findMany as jest.Mock).mock.calls[0][0];
    expect(call.include.logs).toBeDefined();
    expect(call.include.logs.where.date).toBeInstanceOf(Date);
  });
});

describe("POST /api/supplements", () => {
  it("returns 400 when required fields are missing", async () => {
    const req = buildRequest("/api/supplements", {
      method: "POST",
      body: { patientId: "p-1" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/patientId and supplementId are required/i);
  });

  it("creates a patient supplement and returns 201", async () => {
    const created = {
      id: "ps-new",
      patientId: "patient-1",
      supplementId: "supp-1",
      isActive: true,
      supplement: { id: "supp-1", name: "Magnesio" },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.patientSupplement.create as any).mockResolvedValue(created);

    const req = buildRequest("/api/supplements", {
      method: "POST",
      body: { patientId: "patient-1", supplementId: "supp-1" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.supplement.name).toBe("Magnesio");
  });
});
