import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

/**
 * Router para Gestão de RH: Departamentos, Cargos e Funcionários
 * Implementa CRUD completo e funcionalidades de hierarquia
 */

// ============================================================================
// DEPARTAMENTOS
// ============================================================================

export const departmentsRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllDepartments();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getDepartmentById(input.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        name: z.string(),
        description: z.string().optional(),
        parentId: z.number().optional(),
        managerId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createDepartment(input);
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        code: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        parentId: z.number().optional(),
        managerId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateDepartment(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteDepartment(input.id);
      return { success: true };
    }),
});

// ============================================================================
// CARGOS (POSITIONS)
// ============================================================================

export const positionsRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllPositions();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getPositionById(input.id);
    }),

  byDepartment: protectedProcedure
    .input(z.object({ departmentId: z.number() }))
    .query(async ({ input }) => {
      return await db.getPositionsByDepartment(input.departmentId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        title: z.string(),
        description: z.string().optional(),
        level: z
          .enum(["junior", "pleno", "senior", "especialista", "coordenador", "gerente", "diretor"])
          .optional(),
        departmentId: z.number().optional(),
        salaryMin: z.number().optional(),
        salaryMax: z.number().optional(),
        // Campos UISA
        mission: z.string().optional(),
        responsibilities: z.array(z.string()).optional(),
        technicalCompetencies: z.array(z.string()).optional(),
        behavioralCompetencies: z.array(z.string()).optional(),
        requirements: z
          .object({
            education: z.string().optional(),
            experience: z.string().optional(),
            certifications: z.array(z.string()).optional(),
          })
          .optional(),
        kpis: z
          .array(
            z.object({
              name: z.string(),
              description: z.string(),
              target: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createPosition(input);
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        code: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        level: z
          .enum(["junior", "pleno", "senior", "especialista", "coordenador", "gerente", "diretor"])
          .optional(),
        departmentId: z.number().optional(),
        salaryMin: z.number().optional(),
        salaryMax: z.number().optional(),
        // Campos UISA
        mission: z.string().optional(),
        responsibilities: z.array(z.string()).optional(),
        technicalCompetencies: z.array(z.string()).optional(),
        behavioralCompetencies: z.array(z.string()).optional(),
        requirements: z
          .object({
            education: z.string().optional(),
            experience: z.string().optional(),
            certifications: z.array(z.string()).optional(),
          })
          .optional(),
        kpis: z
          .array(
            z.object({
              name: z.string(),
              description: z.string(),
              target: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updatePosition(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deletePosition(input.id);
      return { success: true };
    }),
});

// ============================================================================
// FUNCIONÁRIOS (EMPLOYEES)
// ============================================================================

export const employeesRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllEmployees();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getEmployeeById(input.id);
    }),

  profile: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getEmployeeProfile(input.id);
    }),

  byDepartment: protectedProcedure
    .input(z.object({ departmentId: z.number() }))
    .query(async ({ input }) => {
      return await db.getEmployeesByDepartment(input.departmentId);
    }),

  byPosition: protectedProcedure
    .input(z.object({ positionId: z.number() }))
    .query(async ({ input }) => {
      return await db.getEmployeesByPosition(input.positionId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        employeeCode: z.string(),
        name: z.string(),
        email: z.string().email().optional(),
        cpf: z.string().optional(),
        birthDate: z.string().optional(),
        hireDate: z.string().optional(),
        departmentId: z.number().optional(),
        positionId: z.number().optional(),
        managerId: z.number().optional(),
        photoUrl: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        salary: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createEmployee(input as any);
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        cpf: z.string().optional(),
        birthDate: z.string().optional(),
        hireDate: z.string().optional(),
        departmentId: z.number().optional(),
        positionId: z.number().optional(),
        managerId: z.number().optional(),
        photoUrl: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        salary: z.number().optional(),
        status: z.enum(["ativo", "afastado", "desligado"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateEmployee(id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteEmployee(input.id);
      return { success: true };
    }),
});

// ============================================================================
// HIERARQUIA / ORGANOGRAMA
// ============================================================================

export const hierarchyRouter = router({
  getChart: protectedProcedure.query(async () => {
    return await db.getOrganizationChart();
  }),

  getSubordinates: protectedProcedure
    .input(z.object({ managerId: z.number() }))
    .query(async ({ input }) => {
      return await db.getEmployeeSubordinates(input.managerId);
    }),

  getManager: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      return await db.getEmployeeManager(input.employeeId);
    }),

  updateManager: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        newManagerId: z.number().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateEmployeeManager(input.employeeId, input.newManagerId);
      return { success: true };
    }),

  getPath: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      return await db.getEmployeeHierarchyPath(input.employeeId);
    }),
});

// ============================================================================
// BUSCA GLOBAL
// ============================================================================

export const searchRouter = router({
  global: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return await db.searchGlobal(input.query);
    }),
});
