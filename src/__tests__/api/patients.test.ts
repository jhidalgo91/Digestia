import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { GET } from "@/app/api/patients/route";
import { buildRequest } from "../helpers";

describe("GET /api/patients", () => {
  it("returns 400 when nutritionistId is missing", async () => {
    const req = buildRequest("/api/patients");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/nutritionistId is required/i);
  });

  it("returns patients for a valid nutritionistId", async () => {
    const fakePatients = [
      {
        id: "patient-1",
        nutritionistId: "nutri-1",
        user: { id: "user-1", name: "Juan García", email: "juan@example.com", image: null },
        mealPlans: [],
      },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.patient.findMany as any).mockResolvedValue(fakePatients);

    const req = buildRequest("/api/patients", {
      searchParams: { nutritionistId: "nutri-1" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].user.name).toBe("Juan García");
  });

  it("queries only patients belonging to the given nutritionist", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.patient.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/patients", {
      searchParams: { nutritionistId: "nutri-2" },
    });
    await GET(req);

    const call = (prismaMock.patient.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.nutritionistId).toBe("nutri-2");
  });
});
