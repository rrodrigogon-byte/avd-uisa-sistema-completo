/**
 * Temporal Analysis Router
 * Procedures tRPC para análise temporal avançada de desempenho
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const temporalAnalysisRouter = router({
  /**
   * Criar configuração de análise temporal
   */
  createConfig: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        analysisType: z.enum(["individual", "comparativa", "departamento", "organizacional"]),
        periodType: z.enum(["mensal", "trimestral", "semestral", "anual", "customizado"]),
        startDate: z.date(),
        endDate: z.date(),
        employeeIds: z.array(z.number()).optional(),
        departmentIds: z.array(z.number()).optional(),
        includeAllActive: z.boolean().default(false),
        includeGoals: z.boolean().default(true),
        includePir: z.boolean().default(true),
        include360: z.boolean().default(true),
        includeCompetencies: z.boolean().default(true),
        compareWithPreviousPeriod: z.boolean().default(true),
        compareWithDepartmentAvg: z.boolean().default(true),
        compareWithOrgAvg: z.boolean().default(true),
        significantChangeThreshold: z.number().default(15),
        criticalChangeThreshold: z.number().default(30),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const configId = await db.createTemporalAnalysisConfig({
        ...input,
        employeeIds: input.employeeIds ? JSON.stringify(input.employeeIds) : null,
        departmentIds: input.departmentIds ? JSON.stringify(input.departmentIds) : null,
        metricsToAnalyze: JSON.stringify({
          goals: input.includeGoals,
          pir: input.includePir,
          evaluation360: input.include360,
          competencies: input.includeCompetencies,
        }),
        createdBy: ctx.user.id,
        active: true,
      });
      
      return { configId };
    }),

  /**
   * Listar configurações de análise
   */
  listConfigs: protectedProcedure
    .input(
      z.object({
        activeOnly: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const configs = await db.listTemporalAnalysisConfigs(input.activeOnly);
      
      return configs.map(config => ({
        id: config.id,
        name: config.name,
        description: config.description,
        analysisType: config.analysisType,
        periodType: config.periodType,
        startDate: config.startDate,
        endDate: config.endDate,
        active: config.active,
        createdAt: config.createdAt,
      }));
    }),

  /**
   * Buscar configuração por ID
   */
  getConfig: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const config = await db.getTemporalAnalysisConfig(input.id);
      
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuração não encontrada",
        });
      }
      
      return {
        ...config,
        employeeIds: config.employeeIds ? JSON.parse(config.employeeIds) : [],
        departmentIds: config.departmentIds ? JSON.parse(config.departmentIds) : [],
        metricsToAnalyze: JSON.parse(config.metricsToAnalyze),
      };
    }),

  /**
   * Executar análise temporal
   */
  executeAnalysis: protectedProcedure
    .input(z.object({ configId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const config = await db.getTemporalAnalysisConfig(input.configId);
      
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Configuração não encontrada",
        });
      }
      
      // Criar resultado inicial
      const resultId = await db.createTemporalAnalysisResult({
        configId: input.configId,
        analysisDate: new Date(),
        periodLabel: `${config.startDate.toLocaleDateString()} - ${config.endDate.toLocaleDateString()}`,
        totalEmployeesAnalyzed: 0,
        trendsData: JSON.stringify({}),
        status: "processando",
        generatedBy: ctx.user.id,
      });
      
      try {
        // Determinar funcionários a analisar
        let employeeIds: number[] = [];
        
        if (config.includeAllActive) {
          const allEmployees = await db.getAllEmployees();
          employeeIds = allEmployees.map(e => e.id);
        } else if (config.employeeIds) {
          employeeIds = JSON.parse(config.employeeIds);
        }
        
        // Coletar dados de cada funcionário
        const snapshots = [];
        const startTime = Date.now();
        
        for (const employeeId of employeeIds) {
          const snapshot = await collectEmployeeSnapshot(
            employeeId,
            config.startDate,
            config.endDate,
            resultId
          );
          
          if (snapshot) {
            snapshots.push(snapshot);
          }
        }
        
        // Calcular métricas agregadas
        const avgPirScore = snapshots
          .filter(s => s.pirScore !== null)
          .reduce((sum, s) => sum + (s.pirScore || 0), 0) / snapshots.length || null;
        
        const avgGoalCompletion = snapshots
          .filter(s => s.goalCompletionRate !== null)
          .reduce((sum, s) => sum + (s.goalCompletionRate || 0), 0) / snapshots.length || null;
        
        const avg360Score = snapshots
          .filter(s => s.score360 !== null)
          .reduce((sum, s) => sum + (s.score360 || 0), 0) / snapshots.length || null;
        
        // Identificar tendências
        const improvements = snapshots.filter(s => s.changeType === "melhoria");
        const declines = snapshots.filter(s => s.changeType === "declinio");
        const stable = snapshots.filter(s => s.changeType === "estavel");
        
        // Identificar top performers e que precisam atenção
        const topPerformers = snapshots
          .sort((a, b) => (b.pirScore || 0) - (a.pirScore || 0))
          .slice(0, 10);
        
        const needsAttention = snapshots
          .filter(s => s.changeType === "declinio" && (s.changeFromPrevious || 0) < -config.significantChangeThreshold)
          .sort((a, b) => (a.changeFromPrevious || 0) - (b.changeFromPrevious || 0));
        
        // Atualizar resultado
        const processingTime = Math.round((Date.now() - startTime) / 1000);
        
        await db.updateTemporalAnalysisStatus(resultId, "concluido");
        
        const database = await db.getDb();
        if (database) {
          await database
            .update(db.temporalAnalysisResults)
            .set({
              totalEmployeesAnalyzed: snapshots.length,
              averagePirScore: avgPirScore ? Math.round(avgPirScore) : null,
              averageGoalCompletion: avgGoalCompletion ? Math.round(avgGoalCompletion) : null,
              average360Score: avg360Score ? Math.round(avg360Score) : null,
              improvementRate: Math.round((improvements.length / snapshots.length) * 100),
              declineRate: Math.round((declines.length / snapshots.length) * 100),
              stableRate: Math.round((stable.length / snapshots.length) * 100),
              topPerformers: JSON.stringify(topPerformers.map(s => s.employeeId)),
              needsAttention: JSON.stringify(needsAttention.map(s => s.employeeId)),
              processingTimeSeconds: processingTime,
              status: "concluido",
            })
            .where(db.eq(db.temporalAnalysisResults.id, resultId));
        }
        
        return {
          success: true,
          resultId,
          totalAnalyzed: snapshots.length,
        };
      } catch (error) {
        await db.updateTemporalAnalysisStatus(
          resultId,
          "erro",
          error instanceof Error ? error.message : "Erro desconhecido"
        );
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao executar análise",
        });
      }
    }),

  /**
   * Buscar resultados de análise
   */
  getResults: protectedProcedure
    .input(
      z.object({
        configId: z.number(),
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      const results = await db.getTemporalAnalysisResults(input.configId, input.limit);
      
      return results.map(result => ({
        id: result.id,
        analysisDate: result.analysisDate,
        periodLabel: result.periodLabel,
        totalEmployeesAnalyzed: result.totalEmployeesAnalyzed,
        averagePirScore: result.averagePirScore,
        averageGoalCompletion: result.averageGoalCompletion,
        average360Score: result.average360Score,
        improvementRate: result.improvementRate,
        declineRate: result.declineRate,
        stableRate: result.stableRate,
        status: result.status,
        generatedAt: result.generatedAt,
      }));
    }),

  /**
   * Buscar resultado detalhado
   */
  getResultDetail: protectedProcedure
    .input(z.object({ resultId: z.number() }))
    .query(async ({ input }) => {
      const result = await db.getTemporalAnalysisResult(input.resultId);
      
      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resultado não encontrado",
        });
      }
      
      return {
        ...result,
        topPerformers: result.topPerformers ? JSON.parse(result.topPerformers) : [],
        needsAttention: result.needsAttention ? JSON.parse(result.needsAttention) : [],
        trendsData: JSON.parse(result.trendsData),
        significantChanges: result.significantChanges ? JSON.parse(result.significantChanges) : null,
      };
    }),

  /**
   * Comparar múltiplos funcionários
   */
  compareEmployees: protectedProcedure
    .input(
      z.object({
        employeeIds: z.array(z.number()),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      const snapshots = await db.compareEmployeesInPeriod(
        input.employeeIds,
        input.startDate,
        input.endDate
      );
      
      // Agrupar por funcionário
      const byEmployee = new Map<number, typeof snapshots>();
      
      for (const snapshot of snapshots) {
        if (!byEmployee.has(snapshot.employeeId)) {
          byEmployee.set(snapshot.employeeId, []);
        }
        byEmployee.get(snapshot.employeeId)!.push(snapshot);
      }
      
      // Buscar dados dos funcionários
      const employees = await Promise.all(
        input.employeeIds.map(id => db.getEmployeeById(id))
      );
      
      return input.employeeIds.map(employeeId => {
        const employee = employees.find(e => e?.id === employeeId);
        const employeeSnapshots = byEmployee.get(employeeId) || [];
        
        return {
          employeeId,
          employeeName: employee?.name || "Desconhecido",
          snapshots: employeeSnapshots.map(s => ({
            date: s.snapshotDate,
            periodLabel: s.periodLabel,
            pirScore: s.pirScore,
            goalCompletionRate: s.goalCompletionRate,
            score360: s.score360,
            changeFromPrevious: s.changeFromPrevious,
            changeType: s.changeType,
          })),
        };
      });
    }),

  /**
   * Buscar snapshots de um funcionário
   */
  getEmployeeSnapshots: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        limit: z.number().optional().default(12),
      })
    )
    .query(async ({ input }) => {
      const snapshots = await db.getEmployeeSnapshots(input.employeeId, input.limit);
      
      return snapshots.map(s => ({
        id: s.id,
        snapshotDate: s.snapshotDate,
        periodLabel: s.periodLabel,
        pirScore: s.pirScore,
        totalGoals: s.totalGoals,
        completedGoals: s.completedGoals,
        goalCompletionRate: s.goalCompletionRate,
        score360: s.score360,
        videoAnalysisScore: s.videoAnalysisScore,
        changeFromPrevious: s.changeFromPrevious,
        changeType: s.changeType,
      }));
    }),
});

/**
 * Helper para coletar snapshot de funcionário
 */
async function collectEmployeeSnapshot(
  employeeId: number,
  startDate: Date,
  endDate: Date,
  analysisResultId: number
) {
  try {
    const employee = await db.getEmployeeById(employeeId);
    if (!employee) return null;
    
    // Buscar dados do período
    const goals = await db.getGoalsByEmployee(employeeId);
    const evaluations = await db.getEvaluationsByEmployee(employeeId);
    
    // Calcular métricas
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === "concluida").length;
    const goalCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : null;
    
    // Buscar avaliação 360 mais recente
    const latest360 = evaluations[0];
    
    // Criar snapshot
    const snapshotId = await db.createEmployeeSnapshot({
      employeeId,
      analysisResultId,
      snapshotDate: new Date(),
      periodLabel: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      positionId: employee.positionId,
      departmentId: employee.departmentId,
      totalGoals,
      completedGoals,
      goalCompletionRate,
      score360: latest360?.overallScore || null,
      evaluation360Data: latest360 ? JSON.stringify(latest360) : null,
    });
    
    return {
      id: snapshotId,
      employeeId,
      pirScore: null,
      goalCompletionRate,
      score360: latest360?.overallScore || null,
      changeFromPrevious: null,
      changeType: null,
    };
  } catch (error) {
    console.error(`Error collecting snapshot for employee ${employeeId}:`, error);
    return null;
  }
}
