import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { GET, POST } from "@/app/api/alerts/route";
import { buildRequest } from "../helpers";

describe("GET /api/alerts", () => {
  it("returns all alerts when no filters are applied", async () => {
    const fakeAlerts = [
      { id: "alert-1", patientId: "patient-1", alertType: "CARBS_EXCESS", isRead: false },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.deviationAlert.findMany as any).mockResolvedValue(fakeAlerts);

    const req = buildRequest("/api/alerts");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].alertType).toBe("CARBS_EXCESS");
  });

  it("filters alerts by patientId", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.deviationAlert.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/alerts", {
      searchParams: { patientId: "patient-1" },
    });
    await GET(req);

    const call = (prismaMock.deviationAlert.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.patientId).toBe("patient-1");
  });

  it("filters alerts by isRead status", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.deviationAlert.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/alerts", {
      searchParams: { isRead: "false" },
    });
    await GET(req);

    const call = (prismaMock.deviationAlert.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.isRead).toBe(false);
  });

  it("sets isRead to true when isRead param is 'true'", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.deviationAlert.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/alerts", {
      searchParams: { isRead: "true" },
    });
    await GET(req);

    const call = (prismaMock.deviationAlert.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.isRead).toBe(true);
  });
});

describe("POST /api/alerts", () => {
  it("creates an alert and returns 201", async () => {
    const created = {
      id: "alert-new",
      patientId: "patient-1",
      alertType: "SLEEP_DEFICIT",
      isRead: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.deviationAlert.create as any).mockResolvedValue(created);

    const req = buildRequest("/api/alerts", {
      method: "POST",
      body: { patientId: "patient-1", alertType: "SLEEP_DEFICIT" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.alertType).toBe("SLEEP_DEFICIT");
  });
});
