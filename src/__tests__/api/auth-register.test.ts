import "../../__mocks__/prisma";
import { prismaMock } from "../../__mocks__/prisma";
import { POST } from "@/app/api/auth/register/route";
import { buildRequest } from "../helpers";

// Mock bcryptjs to avoid slow hashing in tests
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock email utility
jest.mock("@/lib/email", () => ({
  sendAdminApprovalRequest: jest.fn().mockResolvedValue(undefined),
  sendApprovalNotification: jest.fn().mockResolvedValue(undefined),
}));

describe("POST /api/auth/register", () => {
  it("returns 400 when required fields are missing", async () => {
    const req = buildRequest("/api/auth/register", {
      method: "POST",
      body: { email: "test@example.com" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email", async () => {
    const req = buildRequest("/api/auth/register", {
      method: "POST",
      body: {
        name: "Test User",
        email: "not-an-email",
        password: "securepassword",
        role: "PATIENT",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for password shorter than 8 characters", async () => {
    const req = buildRequest("/api/auth/register", {
      method: "POST",
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "short",
        role: "PATIENT",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 when email already exists", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.user.findUnique as any).mockResolvedValue({ id: "existing-user" });

    const req = buildRequest("/api/auth/register", {
      method: "POST",
      body: {
        name: "Test User",
        email: "existing@example.com",
        password: "securepassword",
        role: "PATIENT",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/ya existe/i);
  });

  it("creates PATIENT with APPROVED status and returns 201", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.user.findUnique as any).mockResolvedValue(null);
    const fakeUser = {
      id: "new-user-id",
      email: "patient@example.com",
      role: "PATIENT",
      status: "APPROVED",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.user.create as any).mockResolvedValue(fakeUser);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.patient.create as any).mockResolvedValue({ id: "patient-id" });

    const req = buildRequest("/api/auth/register", {
      method: "POST",
      body: {
        name: "Test Patient",
        email: "patient@example.com",
        password: "securepassword",
        role: "PATIENT",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.role).toBe("PATIENT");
    expect(body.status).toBe("APPROVED");
  });

  it("creates NUTRITIONIST with PENDING status and returns 201", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.user.findUnique as any).mockResolvedValue(null);
    const fakeUser = {
      id: "nutri-user-id",
      email: "nutri@example.com",
      role: "NUTRITIONIST",
      status: "PENDING",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.user.create as any).mockResolvedValue(fakeUser);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaMock.nutritionist.create as any).mockResolvedValue({ id: "nutri-id" });

    const req = buildRequest("/api/auth/register", {
      method: "POST",
      body: {
        name: "Test Nutritionist",
        email: "nutri@example.com",
        password: "securepassword",
        role: "NUTRITIONIST",
        specialty: "Sports Nutrition",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.role).toBe("NUTRITIONIST");
    expect(body.status).toBe("PENDING");
  });

  it("returns 400 for invalid role", async () => {
    const req = buildRequest("/api/auth/register", {
      method: "POST",
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "securepassword",
        role: "ADMIN",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
