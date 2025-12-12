/**
 * Router para Ciclo Completo de Avaliação
 * Gerencia todo o fluxo de avaliação 360° incluindo:
 * - Criação de ciclos
 * - Envio de emails
 * - Preenchimento automático (simulação)
 * - Cálculo de resultados
 * - Geração de PDI
 * - Dashboard PIR
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { sendEmail } from "../emailService";
import { TRPCError } from "@trpc/server";

export const evaluationCycleRouter = router({
  /**
   * Criar avaliações para todos os funcionários de um ciclo
   */
  createEvaluationsForCycle: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const evaluations = await db.createEvaluationsForCycle(input.cycleId);
        return {
          success: true,
          count: evaluations.length,
          evaluations,
        };
      } catch (error) {
        console.error("Error creating evaluations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar avaliações",
        });
      }
    }),

  /**
   * Enviar emails de avaliação para funcionários específicos
   */
  sendEvaluationEmails: protectedProcedure
    .input(
      z.object({
        cycleId: z.number(),
        emails: z.array(z.string().email()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");

        const results = [];

        for (const email of input.emails) {
          // Buscar funcionário por email
          const [employee] = await database
            .select()
            .from(db.employees)
            .where(db.eq(db.employees.email, email))
            .limit(1);

          if (!employee) {
            results.push({
              email,
              success: false,
              message: "Funcionário não encontrado",
            });
            continue;
          }

          // Buscar avaliação do funcionário no ciclo
          const [evaluation] = await database
            .select()
            .from(db.performanceEvaluations)
            .where(
              db.and(
                db.eq(db.performanceEvaluations.cycleId, input.cycleId),
                db.eq(db.performanceEvaluations.employeeId, employee.id)
              )
            )
            .limit(1);

          if (!evaluation) {
            results.push({
              email,
              success: false,
              message: "Avaliação não encontrada",
            });
            continue;
          }

          // Enviar email
          const emailSent = await sendEmail({
            to: email,
            subject: "Avaliação de Desempenho AVD UISA",
            html: `
              <h2>Olá ${employee.name},</h2>
              <p>Está disponível sua avaliação de desempenho no sistema AVD UISA.</p>
              <p>Por favor, acesse o sistema e complete sua autoavaliação.</p>
              <p><strong>Prazo:</strong> Até o final do ciclo</p>
              <p><a href="${process.env.VITE_APP_URL || "https://avduisa-sys-vd5bj8to.manus.space"}/avaliacoes/${evaluation.id}">Acessar Avaliação</a></p>
              <br>
              <p>Atenciosamente,<br>Equipe RH UISA</p>
            `,
          });

          results.push({
            email,
            success: emailSent,
            message: emailSent ? "Email enviado com sucesso" : "Erro ao enviar email",
            evaluationId: evaluation.id,
            employeeId: employee.id,
          });
        }

        return {
          success: true,
          results,
          totalSent: results.filter((r) => r.success).length,
          totalFailed: results.filter((r) => !r.success).length,
        };
      } catch (error) {
        console.error("Error sending evaluation emails:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao enviar emails",
        });
      }
    }),

  /**
   * Preencher autoavaliação automaticamente (simulação)
   */
  fillSelfEvaluation: protectedProcedure
    .input(
      z.object({
        evaluationId: z.number(),
        employeeId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await db.fillSelfEvaluation(
          input.evaluationId,
          input.employeeId
        );
        return result;
      } catch (error) {
        console.error("Error filling self evaluation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao preencher autoavaliação",
        });
      }
    }),

  /**
   * Preencher avaliação do gestor automaticamente (simulação)
   */
  fillManagerEvaluation: protectedProcedure
    .input(
      z.object({
        evaluationId: z.number(),
        managerId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await db.fillManagerEvaluation(
          input.evaluationId,
          input.managerId
        );
        return result;
      } catch (error) {
        console.error("Error filling manager evaluation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao preencher avaliação do gestor",
        });
      }
    }),

  /**
   * Finalizar avaliação com consenso
   */
  finalizeEvaluation: protectedProcedure
    .input(z.object({ evaluationId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await db.finalizeEvaluation(input.evaluationId);
        return result;
      } catch (error) {
        console.error("Error finalizing evaluation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao finalizar avaliação",
        });
      }
    }),

  /**
   * Buscar detalhes de uma avaliação
   */
  getEvaluationDetails: protectedProcedure
    .input(z.object({ evaluationId: z.number() }))
    .query(async ({ input }) => {
      try {
        const details = await db.getEvaluationDetails(input.evaluationId);
        if (!details) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Avaliação não encontrada",
          });
        }
        return details;
      } catch (error) {
        console.error("Error getting evaluation details:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar detalhes da avaliação",
        });
      }
    }),

  /**
   * Buscar todas as avaliações de um funcionário
   */
  getEmployeeEvaluations: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      try {
        const evaluations = await db.getEmployeePerformanceEvaluationsWithCycle(input.employeeId);
        return evaluations;
      } catch (error) {
        console.error("Error getting employee evaluations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar avaliações do funcionário",
        });
      }
    }),

  /**
   * Calcular quartis de desempenho de um ciclo
   */
  calculateCycleQuartiles: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ input }) => {
      try {
        const quartiles = await db.calculateCycleQuartiles(input.cycleId);
        return quartiles;
      } catch (error) {
        console.error("Error calculating cycle quartiles:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao calcular quartis",
        });
      }
    }),

  /**
   * Gerar PDI automático baseado nos gaps
   */
  generateAutomaticPDI: protectedProcedure
    .input(z.object({ evaluationId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await db.generateAutomaticPDI(input.evaluationId);
        return result;
      } catch (error) {
        console.error("Error generating automatic PDI:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar PDI automático",
        });
      }
    }),

  /**
   * Executar ciclo completo simulado
   * Esta função executa todo o fluxo de avaliação de forma automática
   */
  runCompleteCycle: protectedProcedure
    .input(
      z.object({
        cycleId: z.number(),
        emails: z.array(z.string().email()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");

        const results = {
          emailsSent: [] as any[],
          evaluationsCompleted: [] as any[],
          pdisGenerated: [] as any[],
        };

        // 1. Enviar emails
        for (const email of input.emails) {
          const [employee] = await database
            .select()
            .from(db.employees)
            .where(db.eq(db.employees.email, email))
            .limit(1);

          if (!employee) continue;

          const [evaluation] = await database
            .select()
            .from(db.performanceEvaluations)
            .where(
              db.and(
                db.eq(db.performanceEvaluations.cycleId, input.cycleId),
                db.eq(db.performanceEvaluations.employeeId, employee.id)
              )
            )
            .limit(1);

          if (!evaluation) continue;

          // Enviar email
          const emailSent = await sendEmail({
            to: email,
            subject: "Avaliação de Desempenho AVD UISA - Ciclo Completo",
            html: `
              <h2>Olá ${employee.name},</h2>
              <p>Está disponível sua avaliação de desempenho no sistema AVD UISA.</p>
              <p>Este é um ciclo de teste automático.</p>
            `,
          });

          results.emailsSent.push({ email, success: emailSent });

          // 2. Preencher autoavaliação
          const selfResult = await db.fillSelfEvaluation(
            evaluation.id,
            employee.id
          );

          // 3. Preencher avaliação do gestor (usar o próprio funcionário como gestor para simulação)
          const managerResult = await db.fillManagerEvaluation(
            evaluation.id,
            employee.managerId || employee.id
          );

          // 4. Finalizar avaliação
          const finalResult = await db.finalizeEvaluation(evaluation.id);

          results.evaluationsCompleted.push({
            employeeId: employee.id,
            employeeName: employee.name,
            evaluationId: evaluation.id,
            selfScore: selfResult.selfScore,
            managerScore: managerResult.managerScore,
            finalScore: finalResult.finalScore,
          });

          // 5. Gerar PDI automático
          const pdiResult = await db.generateAutomaticPDI(evaluation.id);

          results.pdisGenerated.push({
            employeeId: employee.id,
            employeeName: employee.name,
            pdiId: pdiResult.pdiId,
            actionsCreated: pdiResult.actionsCreated,
          });
        }

        return {
          success: true,
          results,
          summary: {
            emailsSent: results.emailsSent.filter((e) => e.success).length,
            evaluationsCompleted: results.evaluationsCompleted.length,
            pdisGenerated: results.pdisGenerated.length,
          },
        };
      } catch (error) {
        console.error("Error running complete cycle:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao executar ciclo completo",
        });
      }
    }),

  /**
   * Buscar estatísticas do ciclo para dashboard PIR
   */
  exportEvaluationPDF: protectedProcedure
    .input(z.object({ evaluationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");

        // Buscar detalhes da avaliação
        const details = await db.getEvaluationDetails(input.evaluationId);
        if (!details) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Avaliação não encontrada",
          });
        }

        const { evaluation, competencyScores } = details;

        // Buscar dados do funcionário
        const [employee] = await database
          .select()
          .from(db.employees)
          .where(db.eq(db.employees.id, evaluation.employeeId))
          .limit(1);

        if (!employee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Funcionário não encontrado",
          });
        }

        // Buscar dados do ciclo
        const [cycle] = await database
          .select()
          .from(db.evaluationCycles)
          .where(db.eq(db.evaluationCycles.id, evaluation.cycleId))
          .limit(1);

        if (!cycle) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Ciclo não encontrado",
          });
        }

        // Determinar nível de desempenho
        const finalScore = evaluation.finalScore || 0;
        let performanceLevel = "Abaixo das Expectativas";
        if (finalScore >= 90) performanceLevel = "Excepcional";
        else if (finalScore >= 75) performanceLevel = "Supera Expectativas";
        else if (finalScore >= 60) performanceLevel = "Atende Expectativas";

        // Calcular quartil
        const quartiles = await db.calculateCycleQuartiles(evaluation.cycleId);
        const employeeQuartile = quartiles.distribution.find(
          (d) => d.employeeId === employee.id
        );

        // Preparar dados para PDF
        const pdfData = {
          employee: {
            name: employee.name,
            employeeCode: employee.employeeCode,
            department: "Tecnologia", // TODO: buscar do banco
            position: "Analista", // TODO: buscar do banco
          },
          cycle: {
            name: cycle.name,
            year: cycle.year,
          },
          scores: {
            selfScore: evaluation.selfScore || 0,
            managerScore: evaluation.managerScore || 0,
            finalScore: evaluation.finalScore || 0,
          },
          competencies: competencyScores,
          performanceLevel,
          quartile: employeeQuartile?.quartile || 1,
        };

        // Gerar PDF
        const { generateEvaluationPDF } = await import("../pdfExport");
        const pdfBuffer = await generateEvaluationPDF(pdfData);

        // Retornar PDF como base64
        return {
          success: true,
          pdf: pdfBuffer.toString("base64"),
          filename: `avaliacao_${employee.employeeCode}_${cycle.year}.pdf`,
        };
      } catch (error) {
        console.error("Error exporting PDF:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao exportar PDF",
        });
      }
    }),

  getCycleStats: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ input }) => {
      try {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");

        // Buscar todas as avaliações do ciclo
        const evaluations = await database
          .select()
          .from(db.performanceEvaluations)
          .where(db.eq(db.performanceEvaluations.cycleId, input.cycleId));

        // Calcular estatísticas
        const total = evaluations.length;
        const completed = evaluations.filter(
          (e) => e.status === "concluida"
        ).length;
        const pending = total - completed;

        const avgSelfScore =
          evaluations
            .filter((e) => e.selfScore !== null)
            .reduce((sum, e) => sum + (e.selfScore || 0), 0) / completed || 0;

        const avgManagerScore =
          evaluations
            .filter((e) => e.managerScore !== null)
            .reduce((sum, e) => sum + (e.managerScore || 0), 0) / completed || 0;

        const avgFinalScore =
          evaluations
            .filter((e) => e.finalScore !== null)
            .reduce((sum, e) => sum + (e.finalScore || 0), 0) / completed || 0;

        // Calcular quartis
        const quartiles = await db.calculateCycleQuartiles(input.cycleId);

        return {
          total,
          completed,
          pending,
          completionRate: total > 0 ? (completed / total) * 100 : 0,
          avgSelfScore: Math.round(avgSelfScore),
          avgManagerScore: Math.round(avgManagerScore),
          avgFinalScore: Math.round(avgFinalScore),
          quartiles,
        };
      } catch (error) {
        console.error("Error getting cycle stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar estatísticas do ciclo",
        });
      }
    }),
});
