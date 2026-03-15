/**
 * Unit tests for the Prisma singleton pattern.
 * Verifies that the same PrismaClient instance is reused across imports
 * to prevent connection pool exhaustion in development.
 */

// Isolate module registry for each test to test singleton behavior
describe("Prisma singleton client", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    // Clean up the global to reset state between tests
    const g = globalThis as unknown as { prisma: unknown };
    delete g.prisma;
    jest.resetModules();
  });

  it("exports a prisma instance", async () => {
    process.env = { ...originalEnv, DATABASE_URL: "mysql://user:pass@localhost:3306/test" };
    const { prisma } = await import("@/lib/prisma");
    expect(prisma).toBeDefined();
  });

  it("reuses the same instance on repeated imports (singleton)", async () => {
    process.env = { ...originalEnv, DATABASE_URL: "mysql://user:pass@localhost:3306/test" };
    const { prisma: instance1 } = await import("@/lib/prisma");
    const { prisma: instance2 } = await import("@/lib/prisma");
    expect(instance1).toBe(instance2);
  });

  it("reuses existing globalThis.prisma when already set", async () => {
    process.env = { ...originalEnv, DATABASE_URL: "mysql://user:pass@localhost:3306/test" };
    // Pre-populate globalThis.prisma before importing the module
    const mockExistingInstance = { _isMockInstance: true };
    const g = globalThis as unknown as { prisma: unknown };
    g.prisma = mockExistingInstance;

    jest.resetModules();
    const { prisma } = await import("@/lib/prisma");
    // The module should reuse the existing instance from globalThis
    expect(prisma).toBe(mockExistingInstance);
  });

  it("stores the client on globalThis in non-production environments", async () => {
    process.env = { ...originalEnv, NODE_ENV: "development", DATABASE_URL: "mysql://user:pass@localhost:3306/test" };
    await import("@/lib/prisma");
    const g = globalThis as unknown as { prisma: unknown };
    expect(g.prisma).toBeDefined();
  });
});
