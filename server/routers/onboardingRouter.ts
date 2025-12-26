import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { employees, evaluationProcesses } from "../../drizzle/schema";
import { sql, and, gte, lte, eq, desc } from "drizzle-orm";

/**
 * Router de Onboarding
 * Gerenciamento e acompanhamento de novos colaboradores
 */

export const onboardingRouter = router({
  /**
   * Obter estatísticas de onboarding
   */
  getStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Contar novos funcionários
      const newEmployeesResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(employees)
        .where(
          and(
            gte(employees.hireDate, startDate),
            eq(employees.status, "ativo")
          )
        );

      const newEmployeesCount = Number(newEmployeesResult[0]?.count || 0);

      // Contar documentação pendente (funcionários sem email ou CPF)
      const pendingDocsResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(employees)
        .where(
          and(
            gte(employees.hireDate, startDate),
            eq(employees.status, "ativo"),
            sql`(${employees.email} IS NULL OR ${employees.cpf} IS NULL)`
          )
        );

      const pendingDocsCount = Number(pendingDocsResult[0]?.count || 0);

      // Simular processos em andamento (baseado em funcionários com email)
      const inProgressResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(employees)
        .where(
          and(
            gte(employees.hireDate, startDate),
            eq(employees.status, "ativo"),
            sql`${employees.email} IS NOT NULL`
          )
        );

      const inProgressCount = Number(inProgressResult[0]?.count || 0);

      // Simular processos completos (funcionários com email e CPF)
      const completedResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(employees)
        .where(
          and(
            gte(employees.hireDate, startDate),
            eq(employees.status, "ativo"),
            sql`${employees.email} IS NOT NULL`,
            sql`${employees.cpf} IS NOT NULL`
          )
        );

      const completedCount = Number(completedResult[0]?.count || 0);
      const completionRate = newEmployeesCount > 0 
        ? Math.round((completedCount / newEmployeesCount) * 100) 
        : 0;

      return {
        newEmployeesCount,
        pendingDocsCount,
        inProgressCount,
        completionRate,
      };
    }),

  /**
   * Obter lista de novos funcionários
   */
  getNewEmployees: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Buscar novos funcionários com informações de departamento e posição
      const newEmployees = await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          hireDate: employees.hireDate,
          departmentId: employees.departmentId,
          positionId: employees.positionId,
          status: employees.status,
        })
        .from(employees)
        .where(
          and(
            gte(employees.hireDate, startDate),
            eq(employees.status, "ativo")
          )
        )
        .orderBy(desc(employees.hireDate));

      // Buscar informações de departamento e posição
      const { departments, positions } = await import("../../drizzle/schema");
      
      const enrichedEmployees = await Promise.all(
        newEmployees.map(async (emp) => {
          // Buscar departamento
          let departmentName = null;
          if (emp.departmentId) {
            const deptResult = await db
              .select({ name: departments.name })
              .from(departments)
              .where(eq(departments.id, emp.departmentId))
              .limit(1);
            departmentName = deptResult[0]?.name || null;
          }

          // Buscar posição
          let positionName = null;
          if (emp.positionId) {
            const posResult = await db
              .select({ title: positions.title })
              .from(positions)
              .where(eq(positions.id, emp.positionId))
              .limit(1);
            positionName = posResult[0]?.title || null;
          }

          // Simular progresso de onboarding baseado em dados disponíveis
          let onboardingProgress = 0;
          let onboardingStatus = "pending";
          
          // Se tem email e CPF, considera 100% completo
          if (emp.email && emp.email.trim() !== "") {
            onboardingProgress = 50;
            onboardingStatus = "in_progress";
          }
          
          // Se tem departamento e posição também, considera completo
          if (emp.email && emp.departmentId && emp.positionId) {
            onboardingProgress = 100;
            onboardingStatus = "completed";
          }

          return {
            ...emp,
            departmentName,
            positionName,
            onboardingProgress,
            onboardingStatus,
          };
        })
      );

      return enrichedEmployees;
    }),

  /**
   * Obter progresso de onboarding por etapa
   */
  getProgress: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Definir etapas do onboarding
      const stages = [
        { stage: 1, stageName: "Dados Pessoais" },
        { stage: 2, stageName: "Perfil Comportamental (PIR)" },
        { stage: 3, stageName: "Avaliação de Competências" },
        { stage: 4, stageName: "Avaliação de Desempenho" },
        { stage: 5, stageName: "Plano de Desenvolvimento (PDI)" },
      ];

      // Contar total de novos funcionários
      const totalResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(employees)
        .where(
          and(
            gte(employees.hireDate, startDate),
            eq(employees.status, "ativo")
          )
        );

      const totalCount = Number(totalResult[0]?.count || 0);

      // Simular progresso por etapa (baseado em dados de funcionários)
      const progress = stages.map(({ stage, stageName }) => {
        // Simular conclusão decrescente por etapa
        const completedCount = Math.max(0, totalCount - (stage - 1) * Math.floor(totalCount / 5));
        const percentage = totalCount > 0 
          ? Math.round((completedCount / totalCount) * 100) 
          : 0;

        return {
          stage,
          stageName,
          completedCount,
          totalCount,
          percentage,
        };
      });

      return progress;
    }),
});
