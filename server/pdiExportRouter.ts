import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { pdiPlans, employees, pdiIntelligentDetails, pdiCompetencyGaps, pdiActions, competencies } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { generatePDIHtml, type PDIData } from "./pdiHtmlGenerator";

/**
 * Router para exportação de PDI em diferentes formatos
 */
export const pdiExportRouter = router({
  /**
   * Exportar PDI individual para PDF
   * Retorna URL do PDF gerado
   */
  exportToPdf: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Buscar dados do PDI
        const plan = await db
          .select()
          .from(pdiPlans)
          .where(eq(pdiPlans.id, input.planId))
          .limit(1);

        if (plan.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "PDI não encontrado" });
        }

        // Buscar funcionário
        const employee = await db
          .select()
          .from(employees)
          .where(eq(employees.id, plan[0].employeeId))
          .limit(1);

        if (employee.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
        }

        // Buscar detalhes inteligentes
        const details = await db
          .select()
          .from(pdiIntelligentDetails)
          .where(eq(pdiIntelligentDetails.planId, input.planId))
          .limit(1);

        // Buscar gaps de competências
        const gaps = await db
          .select({
            id: pdiCompetencyGaps.id,
            competencyName: competencies.name,
            competencyDescription: competencies.description,
            currentLevel: pdiCompetencyGaps.currentLevel,
            targetLevel: pdiCompetencyGaps.targetLevel,
            gap: pdiCompetencyGaps.gap,
            priority: pdiCompetencyGaps.priority,
          })
          .from(pdiCompetencyGaps)
          .leftJoin(competencies, eq(pdiCompetencyGaps.competencyId, competencies.id))
          .where(eq(pdiCompetencyGaps.planId, input.planId));

        // Buscar ações do PDI
        const actions = await db
          .select()
          .from(pdiActions)
          .where(eq(pdiActions.planId, input.planId));

        // Montar dados do PDI
        const pdiData: PDIData = {
          employeeName: employee[0].name,
          position: employee[0].cargo || "Não especificado",
          developmentFocus: details.length > 0 ? details[0].developmentFocus || "Desenvolvimento profissional" : "Desenvolvimento profissional",
          sponsorName: details.length > 0 ? details[0].sponsorName || "Não especificado" : "Não especificado",
          kpis: {
            currentPosition: employee[0].cargo || "Não especificado",
            reframing: details.length > 0 ? details[0].reframingTimeline || "A definir" : "A definir",
            newPosition: details.length > 0 ? details[0].targetPosition || "A definir" : "A definir",
            planDuration: details.length > 0 ? details[0].planDuration || "12 meses" : "12 meses",
          },
          competencyGaps: gaps.map(gap => ({
            title: gap.competencyName || "Competência",
            description: `Nível atual: ${gap.currentLevel || 0}, Nível alvo: ${gap.targetLevel || 0}, Gap: ${gap.gap || 0}`,
          })),
          competencyChart: {
            labels: gaps.map(gap => gap.competencyName || "Competência"),
            currentProfile: gaps.map(gap => gap.currentLevel || 0),
            targetProfile: gaps.map(gap => gap.targetLevel || 0),
          },
          compensationTrack: [],
          actionPlan: {
            onTheJob: actions.filter(a => a.type === "70_on_the_job").map(a => a.description),
            social: actions.filter(a => a.type === "20_social").map(a => a.description),
            formal: actions.filter(a => a.type === "10_formal").map(a => a.description),
          },
          responsibilityPact: {
            employee: details.length > 0 && details[0].employeeResponsibilities ? JSON.parse(details[0].employeeResponsibilities) : [],
            leadership: details.length > 0 && details[0].leadershipResponsibilities ? JSON.parse(details[0].leadershipResponsibilities) : [],
            dho: details.length > 0 && details[0].dhoResponsibilities ? JSON.parse(details[0].dhoResponsibilities) : [],
          },
        };

        // Gerar HTML
        const html = generatePDIHtml(pdiData);

        // Converter HTML para PDF usando puppeteer ou similar
        // Por enquanto, retornamos o HTML que pode ser convertido no frontend
        // ou usando uma biblioteca como html-pdf-node
        
        return {
          success: true,
          html,
          filename: `PDI_${employee[0].name.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
          message: "HTML gerado com sucesso. Conversão para PDF será implementada.",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao exportar PDI: ${error.message}`,
        });
      }
    }),

  /**
   * Exportar múltiplos PDIs para PDF em lote
   */
  exportBatchToPdf: protectedProcedure
    .input(
      z.object({
        planIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        const results = [];

        for (const planId of input.planIds) {
          try {
            // Buscar dados do PDI
            const plan = await db
              .select()
              .from(pdiPlans)
              .where(eq(pdiPlans.id, planId))
              .limit(1);

            if (plan.length === 0) {
              results.push({
                planId,
                success: false,
                error: "PDI não encontrado",
              });
              continue;
            }

            // Buscar funcionário
            const employee = await db
              .select()
              .from(employees)
              .where(eq(employees.id, plan[0].employeeId))
              .limit(1);

            if (employee.length === 0) {
              results.push({
                planId,
                success: false,
                error: "Funcionário não encontrado",
              });
              continue;
            }

            results.push({
              planId,
              success: true,
              employeeName: employee[0].name,
              filename: `PDI_${employee[0].name.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
            });
          } catch (error: any) {
            results.push({
              planId,
              success: false,
              error: error.message,
            });
          }
        }

        return {
          success: true,
          total: input.planIds.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao exportar PDIs em lote: ${error.message}`,
        });
      }
    }),

  /**
   * Exportar PDI existente para formato HTML (template original)
   * Permite edições em massa e re-importação
   */
  exportToHtml: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Buscar dados do PDI
        const plan = await db
          .select()
          .from(pdiPlans)
          .where(eq(pdiPlans.id, input.planId))
          .limit(1);

        if (plan.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "PDI não encontrado" });
        }

        // Buscar funcionário
        const employee = await db
          .select()
          .from(employees)
          .where(eq(employees.id, plan[0].employeeId))
          .limit(1);

        if (employee.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
        }

        // Buscar detalhes inteligentes
        const details = await db
          .select()
          .from(pdiIntelligentDetails)
          .where(eq(pdiIntelligentDetails.planId, input.planId))
          .limit(1);

        // Buscar gaps de competências
        const gaps = await db
          .select({
            id: pdiCompetencyGaps.id,
            competencyName: competencies.name,
            competencyDescription: competencies.description,
            currentLevel: pdiCompetencyGaps.currentLevel,
            targetLevel: pdiCompetencyGaps.targetLevel,
            gap: pdiCompetencyGaps.gap,
            priority: pdiCompetencyGaps.priority,
          })
          .from(pdiCompetencyGaps)
          .leftJoin(competencies, eq(pdiCompetencyGaps.competencyId, competencies.id))
          .where(eq(pdiCompetencyGaps.planId, input.planId));

        // Buscar ações do PDI
        const actions = await db
          .select()
          .from(pdiActions)
          .where(eq(pdiActions.planId, input.planId));

        // Montar dados do PDI
        const pdiData: PDIData = {
          employeeName: employee[0].name,
          position: employee[0].cargo || "Não especificado",
          developmentFocus: details.length > 0 ? details[0].developmentFocus || "Desenvolvimento profissional" : "Desenvolvimento profissional",
          sponsorName: details.length > 0 ? details[0].sponsorName || "Não especificado" : "Não especificado",
          kpis: {
            currentPosition: employee[0].cargo || "Não especificado",
            reframing: details.length > 0 ? details[0].reframingTimeline || "A definir" : "A definir",
            newPosition: details.length > 0 ? details[0].targetPosition || "A definir" : "A definir",
            planDuration: details.length > 0 ? details[0].planDuration || "12 meses" : "12 meses",
          },
          competencyGaps: gaps.map(gap => ({
            title: gap.competencyName || "Competência",
            description: `Nível atual: ${gap.currentLevel || 0}, Nível alvo: ${gap.targetLevel || 0}, Gap: ${gap.gap || 0}`,
          })),
          competencyChart: {
            labels: gaps.map(gap => gap.competencyName || "Competência"),
            currentProfile: gaps.map(gap => gap.currentLevel || 0),
            targetProfile: gaps.map(gap => gap.targetLevel || 0),
          },
          compensationTrack: [],
          actionPlan: {
            onTheJob: actions.filter(a => a.type === "70_on_the_job").map(a => a.description),
            social: actions.filter(a => a.type === "20_social").map(a => a.description),
            formal: actions.filter(a => a.type === "10_formal").map(a => a.description),
          },
          responsibilityPact: {
            employee: details.length > 0 && details[0].employeeResponsibilities ? JSON.parse(details[0].employeeResponsibilities) : [],
            leadership: details.length > 0 && details[0].leadershipResponsibilities ? JSON.parse(details[0].leadershipResponsibilities) : [],
            dho: details.length > 0 && details[0].dhoResponsibilities ? JSON.parse(details[0].dhoResponsibilities) : [],
          },
        };

        // Gerar HTML
        const html = generatePDIHtml(pdiData);

        return {
          success: true,
          html,
          filename: `PDI_${employee[0].name.replace(/\s+/g, '_')}_${Date.now()}.html`,
          employeeName: employee[0].name,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao exportar PDI para HTML: ${error.message}`,
        });
      }
    }),

  /**
   * Exportar múltiplos PDIs para HTML em lote
   */
  exportBatchToHtml: protectedProcedure
    .input(
      z.object({
        planIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        const results = [];

        for (const planId of input.planIds) {
          try {
            // Buscar dados do PDI
            const plan = await db
              .select()
              .from(pdiPlans)
              .where(eq(pdiPlans.id, planId))
              .limit(1);

            if (plan.length === 0) {
              results.push({
                planId,
                success: false,
                error: "PDI não encontrado",
              });
              continue;
            }

            // Buscar funcionário
            const employee = await db
              .select()
              .from(employees)
              .where(eq(employees.id, plan[0].employeeId))
              .limit(1);

            if (employee.length === 0) {
              results.push({
                planId,
                success: false,
                error: "Funcionário não encontrado",
              });
              continue;
            }

            results.push({
              planId,
              success: true,
              employeeName: employee[0].name,
              filename: `PDI_${employee[0].name.replace(/\s+/g, '_')}_${Date.now()}.html`,
            });
          } catch (error: any) {
            results.push({
              planId,
              success: false,
              error: error.message,
            });
          }
        }

        return {
          success: true,
          total: input.planIds.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao exportar PDIs em lote: ${error.message}`,
        });
      }
    }),
});
