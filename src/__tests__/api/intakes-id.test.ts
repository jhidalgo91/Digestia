import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { GET, PATCH, DELETE } from "@/app/api/intakes/[id]/route";
import { buildRequest } from "../helpers";

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/intakes/[id]", () => {
  it("returns 404 when intake is not found", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findUnique as any).mockResolvedValue(null);

    const req = buildRequest("/api/intakes/nonexistent");
    const res = await GET(req, mockParams("nonexistent"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/intake not found/i);
  });

  it("returns intake when found", async () => {
    const fakeIntake = { id: "intake-1", patientId: "patient-1", mealType: "DINNER" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.findUnique as any).mockResolvedValue(fakeIntake);

    const req = buildRequest("/api/intakes/intake-1");
    const res = await GET(req, mockParams("intake-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("intake-1");
  });
});

describe("PATCH /api/intakes/[id]", () => {
  it("updates an intake and returns 200", async () => {
    const updated = { id: "intake-1", status: "COMPLETED" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.update as any).mockResolvedValue(updated);

    const req = buildRequest("/api/intakes/intake-1", {
      method: "PATCH",
      body: { status: "COMPLETED" },
    });
    const res = await PATCH(req, mockParams("intake-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("COMPLETED");
  });
});

describe("DELETE /api/intakes/[id]", () => {
  it("deletes an intake and returns success", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.intake.delete as any).mockResolvedValue({});

    const req = buildRequest("/api/intakes/intake-1", { method: "DELETE" });
    const res = await DELETE(req, mockParams("intake-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
