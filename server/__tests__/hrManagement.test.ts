import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";

describe("HR Management Routers", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  describe("Departments Router", () => {
    it("should list all departments", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: "test", name: "Test User", role: "admin" } as any,
      });

      const result = await caller.departments.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("HR Positions Router", () => {
    it("should list all positions", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: "test", name: "Test User", role: "admin" } as any,
      });

      const result = await caller.hrPositions.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a position with UISA fields", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: "test", name: "Test User", role: "admin" } as any,
      });

      const newPosition = {
        code: "TEST-001",
        title: "Test Position",
        description: "Test Description",
        level: "pleno" as const,
        mission: "Test Mission",
        responsibilities: ["Responsibility 1", "Responsibility 2"],
        technicalCompetencies: ["Tech 1", "Tech 2"],
        behavioralCompetencies: ["Behavior 1", "Behavior 2"],
        requirements: {
          education: "Bachelor's degree",
          experience: "3 years",
          certifications: ["Cert 1"],
        },
        kpis: [
          { name: "KPI 1", description: "Description 1" },
        ],
      };

      const result = await caller.hrPositions.create(newPosition);
      expect(result).toHaveProperty("id");
      expect(result.code).toBe("TEST-001");
      expect(result.mission).toBe("Test Mission");
      expect(result.responsibilities).toEqual(["Responsibility 1", "Responsibility 2"]);

      // Cleanup
      if (result.id) {
        await caller.hrPositions.delete({ id: result.id });
      }
    });
  });

  describe("HR Employees Router", () => {
    it("should list all employees", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: "test", name: "Test User", role: "admin" } as any,
      });

      const result = await caller.hrEmployees.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get employee profile with manager and subordinates", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: "test", name: "Test User", role: "admin" } as any,
      });

      const employees = await caller.hrEmployees.list();
      if (employees.length > 0) {
        const profile = await caller.hrEmployees.profile({ id: employees[0].id });
        expect(profile).toHaveProperty("id");
        expect(profile).toHaveProperty("name");
        expect(profile).toHaveProperty("subordinates");
      }
    });
  });

  describe("HR Hierarchy Router", () => {
    it("should get organization chart", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: "test", name: "Test User", role: "admin" } as any,
      });

      const result = await caller.hrHierarchy.getChart();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should update employee manager", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: "test", name: "Test User", role: "admin" } as any,
      });

      const employees = await caller.hrEmployees.list();
      if (employees.length >= 2) {
        const result = await caller.hrHierarchy.updateManager({
          employeeId: employees[0].id,
          newManagerId: employees[1].id,
        });
        expect(result).toHaveProperty("success");
        expect(result.success).toBe(true);
      }
    });
  });

  describe("HR Search Router", () => {
    it("should search globally", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, openId: "test", name: "Test User", role: "admin" } as any,
      });

      const result = await caller.hrSearch.global({ query: "test" });
      expect(result).toHaveProperty("employees");
      expect(result).toHaveProperty("positions");
      expect(result).toHaveProperty("departments");
      expect(Array.isArray(result.employees)).toBe(true);
      expect(Array.isArray(result.positions)).toBe(true);
      expect(Array.isArray(result.departments)).toBe(true);
    });
  });
});
