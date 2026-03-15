import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

export const prismaMock = mockDeep<PrismaClient>();

jest.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

// Provide a default authenticated session so API route tests don't need
// a real HTTP context. Individual tests can override with mockReturnValueOnce.
jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: "test-user-id", email: "test@example.com", name: "Test User", role: "PATIENT", status: "APPROVED" },
  }),
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export type PrismaMock = DeepMockProxy<PrismaClient>;
