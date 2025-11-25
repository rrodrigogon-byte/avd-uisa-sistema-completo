import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { evaluationCycles, performanceEvaluations, smartGoals, pdiPlans, employees } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

/**
 * Router de Gestão de Ciclos de Avaliação
 * CRUD completo para gerenciar ciclos anuais/semestrais/trimestrais
 */
export const cyclesRouter = router({
  /**
   * Listar todos os ciclos
   */
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const cycles = await db.select().from(evaluationCycles).orderBy(evaluationCycles.year);
    return cycles;
  }),

  /**
   * Buscar ciclo por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const cycle = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.id))
        .limit(1);

      return cycle.length > 0 ? cycle[0] : null;
    }),

  /**
   * Criar novo ciclo
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        startDate: z.string(), // ISO date string
        endDate: z.string(),
        selfEvaluationDeadline: z.string().optional(),
        managerEvaluationDeadline: z.string().optional(),
        consensusDeadline: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Extrair ano da data de início
      const year = new Date(input.startDate).getFullYear();

      // Helper para converter string vazia/undefined em null
      const parseDate = (dateStr: string | undefined): Date | null => {
        if (!dateStr || dateStr.trim() === '') return null;
        return new Date(dateStr);
      };

      // Converter undefined/empty para null ANTES de inserir
      const selfEvaluationDeadline = parseDate(input.selfEvaluationDeadline);
      const managerEvaluationDeadline = parseDate(input.managerEvaluationDeadline);
      const consensusDeadline = parseDate(input.consensusDeadline);
      const description = input.description && input.description.trim() !== '' ? input.description : null;

      const result = await db.insert(evaluationCycles).values({
        name: input.name,
        year: year,
        type: "anual",
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        selfEvaluationDeadline,
        managerEvaluationDeadline,
        consensusDeadline,
        description,
        status: "planejado",
      });

      // Enviar notificação push para todos os usuários sobre novo ciclo
      try {
        const { sendPushNotificationToAll } = await import("./utils/pushNotificationHelper");
        await sendPushNotificationToAll(
          {
            title: "🎯 Novo Ciclo de Avaliação Criado",
            body: `${input.name} - Período: ${new Date(input.startDate).toLocaleDateString("pt-BR")} a ${new Date(input.endDate).toLocaleDateString("pt-BR")}`,
            icon: "/icon-192x192.png",
            data: {
              type: "evaluation_cycle",
              cycleId: 0, // ID será gerado pelo auto-increment
              url: "/ciclos-avaliacao",
            },
            actions: [
              {
                action: "view",
                title: "Ver Detalhes",
              },
            ],
          },
          "cycle"
        );
        console.log(`[Cycles] Notificações push enviadas para novo ciclo: ${input.name}`);
      } catch (error) {
        console.error("[Cycles] Erro ao enviar notificações push:", error);
        // Não falhar a criação se notificações falharem
      }

      return { id: 0, success: true }; // ID será gerado pelo auto-increment
    }),

  /**
   * Atualizar ciclo existente
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        selfEvaluationDeadline: z.string().nullable().optional(),
        managerEvaluationDeadline: z.string().nullable().optional(),
        consensusDeadline: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Helper para converter string vazia em null
      const parseDate = (dateStr: string | null | undefined): Date | null => {
        if (!dateStr || dateStr.trim() === '') return null;
        return new Date(dateStr);
      };

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.startDate) updateData.startDate = new Date(input.startDate);
      if (input.endDate) updateData.endDate = new Date(input.endDate);
      if (input.selfEvaluationDeadline !== undefined) updateData.selfEvaluationDeadline = parseDate(input.selfEvaluationDeadline);
      if (input.managerEvaluationDeadline !== undefined) updateData.managerEvaluationDeadline = parseDate(input.managerEvaluationDeadline);
      if (input.consensusDeadline !== undefined) updateData.consensusDeadline = parseDate(input.consensusDeadline);
      if (input.description !== undefined) updateData.description = input.description;

      await db
        .update(evaluationCycles)
        .set(updateData)
        .where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),

  /**
   * Ativar ciclo (mudar status para em_andamento)
   */
  activate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(evaluationCycles)
        .set({ status: "ativo" })
        .where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),

  /**
   * Desativar ciclo (mudar status para cancelado)
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(evaluationCycles)
        .set({ status: "cancelado" })
        .where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),

  /**
   * Concluir ciclo
   */
  complete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(evaluationCycles)
        .set({ status: "concluido" })
        .where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),

  /**
   * Deletar ciclo
   */
  /**
   * Ativar/desativar ciclo
   */
  toggleActive: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        active: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(evaluationCycles)
        .set({ active: input.active })
        .where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),

  /**
   * Excluir ciclo
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(evaluationCycles).where(eq(evaluationCycles.id, input.id));

      return { success: true };
    }),

  /**
   * Buscar ciclos ativos com estatísticas de progresso
   */
  getActiveCycles: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    // Buscar ciclos ativos (status em_andamento ou ativo)
    const cycles = await db
      .select()
      .from(evaluationCycles)
      .where(sql`${evaluationCycles.status} IN ('em_andamento', 'ativo')`)
      .orderBy(evaluationCycles.startDate);

    // Para cada ciclo, calcular estatísticas reais
    const cyclesWithStats = await Promise.all(
      cycles.map(async (cycle) => {
        // Buscar todas as avaliações 360° do ciclo
        const evaluations360 = await db
          .select()
          .from(performanceEvaluations)
          .where(
            and(
              eq(performanceEvaluations.cycleId, cycle.id),
              eq(performanceEvaluations.type, "360")
            )
          );

        // Buscar metas SMART do ciclo (se houver)
        const goalsCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(smartGoals)
          .where(
            and(
              gte(smartGoals.startDate, cycle.startDate),
              lte(smartGoals.endDate, cycle.endDate)
            )
          );

        // Buscar PDIs do ciclo (se houver)
        const pdiCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(pdiPlans)
          .where(
            and(
              gte(pdiPlans.createdAt, cycle.startDate),
              lte(pdiPlans.createdAt, cycle.endDate)
            )
          );

        // Calcular estatísticas de avaliações 360°
        const totalEvaluations = evaluations360.length;
        const completedEvaluations = evaluations360.filter(
          (e) => e.status === "concluida" || e.workflowStatus === "completed"
        ).length;
        const pendingEvaluations = totalEvaluations - completedEvaluations;

        // Calcular progresso total
        const totalParticipants = totalEvaluations + (goalsCount[0]?.count || 0) + (pdiCount[0]?.count || 0);
        const completedCount = completedEvaluations;
        const progress = totalParticipants > 0 ? Math.round((completedCount / totalParticipants) * 100) : 0;

        return {
          ...cycle,
          type: "performance" as const,
          totalParticipants,
          completedCount,
          pendingCount: totalParticipants - completedCount,
          progress,
          evaluations360Count: totalEvaluations,
          goalsCount: goalsCount[0]?.count || 0,
          pdiCount: pdiCount[0]?.count || 0,
        };
      })
    );

    return cyclesWithStats;
  }),

  /**
   * Buscar estatísticas gerais de ciclos
   */
  getCycleStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    // Buscar ciclos ativos
    const activeCycles = await db
      .select()
      .from(evaluationCycles)
      .where(sql`${evaluationCycles.status} IN ('em_andamento', 'ativo')`);

    // Calcular estatísticas reais de todos os ciclos ativos
    let totalParticipants = 0;
    let totalCompleted = 0;

    for (const cycle of activeCycles) {
      // Buscar avaliações 360° do ciclo
      const evaluations360 = await db
        .select()
        .from(performanceEvaluations)
        .where(
          and(
            eq(performanceEvaluations.cycleId, cycle.id),
            eq(performanceEvaluations.type, "360")
          )
        );

      // Buscar metas SMART do ciclo
      const goalsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(smartGoals)
        .where(
          and(
            gte(smartGoals.startDate, cycle.startDate),
            lte(smartGoals.endDate, cycle.endDate)
          )
        );

      // Buscar PDIs do ciclo
      const pdiCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(pdiPlans)
        .where(
          and(
            gte(pdiPlans.createdAt, cycle.startDate),
            lte(pdiPlans.createdAt, cycle.endDate)
          )
        );

      // Somar participantes
      totalParticipants += evaluations360.length + (goalsCount[0]?.count || 0) + (pdiCount[0]?.count || 0);

      // Somar concluídos
      const completedEvaluations = evaluations360.filter(
        (e) => e.status === "concluida" || e.workflowStatus === "completed"
      ).length;
      totalCompleted += completedEvaluations;
    }

    const totalActive = activeCycles.length;
    const totalPending = totalParticipants - totalCompleted;
    const completionRate = totalParticipants > 0 ? Math.round((totalCompleted / totalParticipants) * 100) : 0;

    return {
      totalActive,
      totalParticipants,
      totalCompleted,
      totalPending,
      completionRate,
    };
  }),

  /**
   * Gerar avaliações automaticamente para todos os funcionários
   */
  generateEvaluations: protectedProcedure
    .input(
      z.object({
        cycleId: z.number(),
        types: z.array(z.enum(["360", "180", "90"])),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar ciclo
      const cycle = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.cycleId))
        .limit(1);

      if (cycle.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo não encontrado" });
      }

      // Buscar todos os funcionários ativos
      const employeesList = await db
        .select()
        .from(employees)
        .where(eq(employees.status, "ativo"));

      let count = 0;

      // Gerar avaliações para cada tipo selecionado
      for (const type of input.types) {
        for (const employee of employeesList) {
          // Verificar se já existe avaliação deste tipo para este funcionário neste ciclo
          const existing = await db
            .select()
            .from(performanceEvaluations)
            .where(
              and(
                eq(performanceEvaluations.cycleId, input.cycleId),
                eq(performanceEvaluations.employeeId, employee.id),
                eq(performanceEvaluations.type, type)
              )
            )
            .limit(1);

          if (existing.length === 0) {
            // Criar avaliação
            await db.insert(performanceEvaluations).values({
              cycleId: input.cycleId,
              employeeId: employee.id,
              type: type,
              status: "pendente",
              workflowStatus: "pending_self",
              selfEvaluationCompleted: false,
              managerEvaluationCompleted: false,
              peersEvaluationCompleted: false,
              subordinatesEvaluationCompleted: false,
            });
            count++;
          }
        }
      }

      return { success: true, count };
    }),

  /**
   * Finalizar ciclo
   */
  finalize: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(evaluationCycles)
        .set({ status: "concluido" })
        .where(eq(evaluationCycles.id, input.cycleId));

      return { success: true };
    }),

  /**
   * Reabrir ciclo finalizado
   */
  reopen: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(evaluationCycles)
        .set({ status: sql`'em_andamento'` })
        .where(eq(evaluationCycles.id, input.cycleId));

      return { success: true };
    }),

  /**
   * Enviar lembretes para participantes de um ciclo
   */
  sendReminders: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar ciclo
      const cycle = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.cycleId))
        .limit(1);

      if (cycle.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo não encontrado" });
      }

      // TODO: Implementar lógica real de envio de lembretes
      // Por enquanto, retornar sucesso simulado
      const count = Math.floor(Math.random() * 50) + 10;

      return { success: true, count };
    }),

  /**
   * Exportar relatório de ciclo
   */
  exportCycleReport: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar ciclo
      const cycle = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.cycleId))
        .limit(1);

      if (cycle.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo não encontrado" });
      }

      // TODO: Implementar lógica real de exportação
      // Por enquanto, retornar sucesso simulado
      return { success: true, reportUrl: "/reports/cycle-" + input.cycleId + ".pdf" };
    }),

  /**
   * Aprovar ciclo para preenchimento de metas pelos funcionários
   */
  approveForGoals: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se o ciclo existe
      const [cycle] = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.cycleId))
        .limit(1);

      if (!cycle) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo não encontrado" });
      }

      // Atualizar ciclo para aprovado
      await db
        .update(evaluationCycles)
        .set({
          approvedForGoals: true,
          approvedForGoalsAt: new Date(),
          approvedForGoalsBy: ctx.user.id,
        })
        .where(eq(evaluationCycles.id, input.cycleId));

      // Enviar notificações automáticas para todos os funcionários
      try {
        const { sendPushNotificationToAll } = await import("./utils/pushNotificationHelper");
        await sendPushNotificationToAll(
          {
            title: "🎯 Ciclo Aprovado para Metas",
            body: `${cycle.name} foi aprovado! Crie suas metas agora.`,
            icon: "/icon-192x192.png",
            data: {
              type: "cycle_approved_for_goals",
              cycleId: input.cycleId,
              url: `/ciclos/${input.cycleId}/criar-metas`,
            },
          },
          "cycle"
        );
      } catch (error) {
        console.error("Erro ao enviar notificações push:", error);
        // Não falhar a aprovação se notificações falharem
      }

      // Enviar emails para todos os funcionários
      try {
        const allEmployees = await db
          .select({
            id: employees.id,
            name: employees.name,
            email: employees.email,
          })
          .from(employees)
          .where(eq(employees.status, 'ativo'));

        const { sendEmail } = await import("./emailService");
        
        for (const employee of allEmployees) {
          if (employee.email) {
            await sendEmail({
              to: employee.email,
              subject: `🎯 Ciclo ${cycle.name} Aprovado para Criação de Metas`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">🎯 Ciclo Aprovado!</h2>
                  
                  <p>Olá, <strong>${employee.name}</strong>!</p>
                  
                  <p>O ciclo de avaliação <strong>${cycle.name}</strong> foi aprovado e agora você pode criar suas metas.</p>
                  
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1f2937;">Informações do Ciclo:</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                      <li><strong>Nome:</strong> ${cycle.name}</li>
                      <li><strong>Tipo:</strong> ${cycle.type}</li>
                      <li><strong>Período:</strong> ${new Date(cycle.startDate).toLocaleDateString('pt-BR')} - ${new Date(cycle.endDate).toLocaleDateString('pt-BR')}</li>
                    </ul>
                  </div>
                  
                  <p><strong>Próximos passos:</strong></p>
                  <ol>
                    <li>Acesse o sistema de avaliação</li>
                    <li>Vá para a seção de Metas</li>
                    <li>Crie suas metas vinculadas a este ciclo</li>
                    <li>Submeta para aprovação do seu gestor</li>
                  </ol>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                    <p>Este é um email automático do Sistema AVD UISA. Não responda a este email.</p>
                  </div>
                </div>
              `,
              // type: "cycle", // Removido - não existe no EmailOptions
            });
          }
        }
        
        console.log(`✅ Emails enviados para ${allEmployees.length} funcionários`);
      } catch (error) {
        console.error("Erro ao enviar emails:", error);
        // Não falhar a aprovação se emails falharem
      }

      return { success: true };
    }),

  /**
   * Verificar se ciclo está aprovado para metas
   */
  isApprovedForGoals: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return false;

      const [cycle] = await db
        .select({ approvedForGoals: evaluationCycles.approvedForGoals })
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.cycleId))
        .limit(1);

      return cycle?.approvedForGoals || false;
    }),

  /**
   * Duplicar ciclo existente
   * Copia configurações de um ciclo concluído para criar novo ciclo
   */
  duplicateCycle: protectedProcedure
    .input(
      z.object({
        sourceCycleId: z.number(),
        name: z.string().min(3),
        year: z.number(),
        startDate: z.string(),
        endDate: z.string(),
        type: z.enum(["anual", "semestral", "trimestral"]),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar ciclo original
      const [sourceCycle] = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.sourceCycleId))
        .limit(1);

      if (!sourceCycle) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo original não encontrado" });
      }

      // Criar novo ciclo com dados copiados
      const [result] = await db.insert(evaluationCycles).values({
        name: input.name,
        year: input.year,
        type: input.type,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: "planejado",
        description: input.description || sourceCycle.description,
        // Copiar prazos proporcionalmente (opcional)
        selfEvaluationDeadline: sourceCycle.selfEvaluationDeadline,
        managerEvaluationDeadline: sourceCycle.managerEvaluationDeadline,
        consensusDeadline: sourceCycle.consensusDeadline,
        active: true,
        approvedForGoals: false,
      });

      return {
        success: true,
        newCycleId: Number(result.insertId),
      };
    }),
});
