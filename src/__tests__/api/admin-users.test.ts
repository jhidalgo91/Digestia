import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { GET } from "@/app/api/admin/users/route";
import { PATCH } from "@/app/api/admin/users/[id]/route";
import { buildRequest } from "../helpers";
import { getServerSession } from "next-auth";

// Mock email utility
jest.mock("@/lib/email", () => ({
  sendAdminApprovalRequest: jest.fn().mockResolvedValue(undefined),
  sendApprovalNotification: jest.fn().mockResolvedValue(undefined),
}));

const adminSession = {
  user: {
    id: "admin-user-id",
    email: "admin@example.com",
    name: "Admin",
    role: "ADMIN",
    status: "APPROVED",
  },
};

const patientSession = {
  user: {
    id: "patient-user-id",
    email: "patient@example.com",
    name: "Patient",
    role: "PATIENT",
    status: "APPROVED",
  },
};

describe("GET /api/admin/users", () => {
  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const req = buildRequest("/api/admin/users");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not ADMIN", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(patientSession);
    const req = buildRequest("/api/admin/users");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns users list for ADMIN", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(adminSession);
    const fakeUsers = [
      {
        id: "user-1",
        name: "Nutri A",
        email: "nutri@example.com",
        role: "NUTRITIONIST",
        status: "PENDING",
        createdAt: new Date(),
        nutritionist: { bio: null, specialty: "Sports" },
      },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.user.findMany as any).mockResolvedValue(fakeUsers);

    const req = buildRequest("/api/admin/users");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].role).toBe("NUTRITIONIST");
  });

  it("passes status and role filters to Prisma", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(adminSession);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.user.findMany as any).mockResolvedValue([]);

    const req = buildRequest("/api/admin/users", {
      searchParams: { status: "PENDING", role: "NUTRITIONIST" },
    });
    await GET(req);

    const call = (prismaMock.user.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.status).toBe("PENDING");
    expect(call.where.role).toBe("NUTRITIONIST");
  });
});

describe("PATCH /api/admin/users/[id]", () => {
  function buildPatchRequest(id: string, body: unknown) {
    return buildRequest(`/api/admin/users/${id}`, { method: "PATCH", body });
  }

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const req = buildPatchRequest("user-1", { status: "APPROVED" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "user-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not ADMIN", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(patientSession);
    const req = buildPatchRequest("user-1", { status: "APPROVED" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "user-1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid status value", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(adminSession);
    const req = buildPatchRequest("user-1", { status: "INVALID" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "user-1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when user not found", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(adminSession);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.user.findUnique as any).mockResolvedValue(null);
    const req = buildPatchRequest("nonexistent", { status: "APPROVED" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(res.status).toBe(404);
  });

  it("approves a user and returns the updated record", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(adminSession);
    const fakeUser = {
      id: "user-1",
      name: "Nutri A",
      email: "nutri@example.com",
      status: "PENDING",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.user.findUnique as any).mockResolvedValue(fakeUser);
    const updatedUser = { ...fakeUser, status: "APPROVED", role: "NUTRITIONIST" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.user.update as any).mockResolvedValue(updatedUser);

    const req = buildPatchRequest("user-1", { status: "APPROVED" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "user-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("APPROVED");
  });

  it("rejects a user and returns the updated record", async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(adminSession);
    const fakeUser = {
      id: "user-2",
      name: "Nutri B",
      email: "nutrib@example.com",
      status: "PENDING",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.user.findUnique as any).mockResolvedValue(fakeUser);
    const updatedUser = { ...fakeUser, status: "REJECTED", role: "NUTRITIONIST" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.user.update as any).mockResolvedValue(updatedUser);

    const req = buildPatchRequest("user-2", { status: "REJECTED" });
    const res = await PATCH(req, { params: Promise.resolve({ id: "user-2" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("REJECTED");
  });
});
