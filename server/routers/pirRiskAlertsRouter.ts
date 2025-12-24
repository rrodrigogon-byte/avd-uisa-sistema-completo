import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, sql, gte, lte, inArray, or, isNull } from "drizzle-orm";
import {
  pirIntegrityAssessments,
  pirIntegrityDimensionScores,
  pirIntegrityDimensions,
  employees,
  departments,
  notifications,
  users,
} from "../../drizzle/schema";
import { sendEmail } from "../emailService";
import { TRPCError } from "@trpc/server";

/**
 * Router para Alertas de Risco PIR Integridade
 * Notifica gestores quando colaboradores apresentam risco alto ou crítico
 */
export const pirRiskAlertsRouter = router({
  /**
   * Listar colaboradores com risco alto ou crítico
   */
  listHighRiskEmployees: protectedProcedure
    .input(z.object({
      riskLevel: z.enum(["high", "critical", "both"]).default("both"),
      departmentId: z.number().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { employees: [], total: 0 };

      const riskConditions = input.riskLevel === "both"
        ? or(
            eq(pirIntegrityAssessments.riskLevel, "high"),
            eq(pirIntegrityAssessments.riskLevel, "critical")
          )
        : eq(pirIntegrityAssessments.riskLevel, input.riskLevel);

      const conditions = [
        eq(pirIntegrityAssessments.status, "completed"),
        riskConditions,
      ];

      // Subquery para pegar apenas a avaliação mais recente de cada funcionário
      const latestAssessments = await db
        .select({
          id: pirIntegrityAssessments.id,
          employeeId: pirIntegrityAssessments.employeeId,
          riskLevel: pirIntegrityAssessments.riskLevel,
          overallScore: pirIntegrityAssessments.overallScore,
          moralLevel: pirIntegrityAssessments.moralLevel,
          completedAt: pirIntegrityAssessments.completedAt,
        })
        .from(pirIntegrityAssessments)
        .where(and(...conditions))
        .orderBy(desc(pirIntegrityAssessments.completedAt));

      // Agrupar por funcionário (pegar apenas a mais recente)
      const employeeAssessments = new Map<number, typeof latestAssessments[0]>();
      for (const assessment of latestAssessments) {
        if (!employeeAssessments.has(assessment.employeeId)) {
          employeeAssessments.set(assessment.employeeId, assessment);
        }
      }

      const uniqueAssessments = Array.from(employeeAssessments.values());
      
      // Filtrar por departamento se necessário
      let filteredAssessments = uniqueAssessments;
      if (input.departmentId) {
        const employeeIds = uniqueAssessments.map(a => a.employeeId);
        if (employeeIds.length > 0) {
          const deptEmployees = await db
            .select({ id: employees.id })
            .from(employees)
            .where(and(
              inArray(employees.id, employeeIds),
              eq(employees.departmentId, input.departmentId)
            ));
          const deptEmployeeIds = new Set(deptEmployees.map(e => e.id));
          filteredAssessments = uniqueAssessments.filter(a => deptEmployeeIds.has(a.employeeId));
        }
      }

      const total = filteredAssessments.length;
      const paginatedAssessments = filteredAssessments.slice(
        (input.page - 1) * input.limit,
        input.page * input.limit
      );

      // Buscar dados dos funcionários
      const employeeIds = paginatedAssessments.map(a => a.employeeId);
      if (employeeIds.length === 0) {
        return { employees: [], total: 0 };
      }

      const employeeData = await db
        .select({
          employee: employees,
          department: departments,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(inArray(employees.id, employeeIds));

      const employeeMap = new Map(employeeData.map(e => [e.employee.id, e]));

      const result = paginatedAssessments.map(assessment => {
        const empData = employeeMap.get(assessment.employeeId);
        return {
          assessment,
          employee: empData?.employee,
          department: empData?.department,
        };
      });

      return { employees: result, total };
    }),

  /**
   * Obter detalhes de risco de um colaborador
   */
  getEmployeeRiskDetails: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      // Buscar avaliação mais recente
      const [assessment] = await db
        .select()
        .from(pirIntegrityAssessments)
        .where(and(
          eq(pirIntegrityAssessments.employeeId, input.employeeId),
          eq(pirIntegrityAssessments.status, "completed")
        ))
        .orderBy(desc(pirIntegrityAssessments.completedAt))
        .limit(1);

      if (!assessment) return null;

      // Buscar funcionário
      const [employee] = await db
        .select({
          employee: employees,
          department: departments,
          manager: employees,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(
          employees as any,
          eq(employees.managerId, sql`manager.id`)
        )
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      // Buscar pontuações por dimensão
      const dimensionScores = await db
        .select({
          score: pirIntegrityDimensionScores,
          dimension: pirIntegrityDimensions,
        })
        .from(pirIntegrityDimensionScores)
        .leftJoin(pirIntegrityDimensions, eq(pirIntegrityDimensionScores.dimensionId, pirIntegrityDimensions.id))
        .where(eq(pirIntegrityDimensionScores.assessmentId, assessment.id));

      // Identificar dimensões críticas
      const criticalDimensions = dimensionScores.filter(
        ds => ds.score.riskLevel === "high" || ds.score.riskLevel === "critical"
      );

      return {
        assessment,
        employee: employee?.employee,
        department: employee?.department,
        dimensionScores,
        criticalDimensions,
      };
    }),

  /**
   * Enviar alerta para gestor sobre colaborador em risco
   */
  sendRiskAlert: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      assessmentId: z.number(),
      alertType: z.enum(["email", "notification", "both"]).default("both"),
      customMessage: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar dados do funcionário e gestor
      const [employeeData] = await db
        .select({
          employee: employees,
          department: departments,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(eq(employees.id, input.employeeId))
        .limit(1);

      if (!employeeData?.employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
      }

      // Buscar avaliação
      const [assessment] = await db
        .select()
        .from(pirIntegrityAssessments)
        .where(eq(pirIntegrityAssessments.id, input.assessmentId))
        .limit(1);

      if (!assessment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Avaliação não encontrada" });
      }

      // Buscar gestor
      let managerId = employeeData.employee.managerId;
      let managerData: { id: number; name: string | null; email: string | null; userId: number | null } | null = null;

      if (managerId) {
        const [manager] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, managerId))
          .limit(1);
        managerData = manager;
      }

      // Se não tem gestor, buscar gestor do departamento
      if (!managerData && employeeData.department?.managerId) {
        const [deptManager] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, employeeData.department.managerId))
          .limit(1);
        managerData = deptManager;
      }

      // Buscar pontuações por dimensão para o alerta
      const dimensionScores = await db
        .select({
          score: pirIntegrityDimensionScores,
          dimension: pirIntegrityDimensions,
        })
        .from(pirIntegrityDimensionScores)
        .leftJoin(pirIntegrityDimensions, eq(pirIntegrityDimensionScores.dimensionId, pirIntegrityDimensions.id))
        .where(eq(pirIntegrityDimensionScores.assessmentId, input.assessmentId));

      const criticalDimensions = dimensionScores
        .filter(ds => ds.score.riskLevel === "high" || ds.score.riskLevel === "critical")
        .map(ds => ({
          name: ds.dimension?.name || "Desconhecida",
          score: ds.score.score,
          riskLevel: ds.score.riskLevel,
        }));

      const riskLevelText = assessment.riskLevel === "critical" ? "CRÍTICO" : "ALTO";
      const riskColor = assessment.riskLevel === "critical" ? "#dc2626" : "#f59e0b";

      // Preparar mensagem
      const alertTitle = `⚠️ Alerta de Risco ${riskLevelText} - PIR Integridade`;
      const alertMessage = input.customMessage || 
        `O colaborador ${employeeData.employee.name} apresentou nível de risco ${riskLevelText} na avaliação de integridade PIR. ` +
        `Pontuação geral: ${assessment.overallScore}/100. ` +
        `Dimensões críticas: ${criticalDimensions.map(d => d.name).join(", ")}.`;

      const results = {
        emailSent: false,
        notificationSent: false,
        managerId: managerData?.id,
        managerName: managerData?.name,
      };

      // Enviar notificação in-app
      if ((input.alertType === "notification" || input.alertType === "both") && managerData?.userId) {
        try {
          await db.insert(notifications).values({
            userId: managerData.userId,
            type: "pir_risk_alert",
            title: alertTitle,
            message: alertMessage,
            link: `/pir-integridade/detalhes/${input.employeeId}`,
            read: false,
          });
          results.notificationSent = true;
        } catch (error) {
          console.error("[PirRiskAlerts] Erro ao criar notificação:", error);
        }
      }

      // Enviar email
      if ((input.alertType === "email" || input.alertType === "both") && managerData?.email) {
        try {
          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${riskColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .risk-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
    .risk-critical { background: #fee2e2; color: #dc2626; }
    .risk-high { background: #fef3c7; color: #d97706; }
    .dimension-list { margin: 15px 0; }
    .dimension-item { padding: 10px; margin: 5px 0; background: white; border-radius: 4px; border-left: 4px solid ${riskColor}; }
    .score { font-size: 24px; font-weight: bold; color: ${riskColor}; }
    .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
    .btn { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Alerta de Risco PIR Integridade</h1>
    </div>
    <div class="content">
      <p>Prezado(a) <strong>${managerData.name || "Gestor"}</strong>,</p>
      
      <p>Este é um alerta automático do Sistema AVD UISA informando que um colaborador sob sua gestão apresentou nível de risco elevado na avaliação de integridade PIR.</p>
      
      <h3>Dados do Colaborador</h3>
      <ul>
        <li><strong>Nome:</strong> ${employeeData.employee.name}</li>
        <li><strong>Departamento:</strong> ${employeeData.department?.name || "Não informado"}</li>
        <li><strong>Cargo:</strong> ${employeeData.employee.funcao || employeeData.employee.cargo || "Não informado"}</li>
      </ul>
      
      <h3>Resultado da Avaliação</h3>
      <p>
        <span class="score">${assessment.overallScore}/100</span>
        <span class="risk-badge ${assessment.riskLevel === "critical" ? "risk-critical" : "risk-high"}">
          Risco ${riskLevelText}
        </span>
      </p>
      
      <h3>Dimensões com Risco Elevado</h3>
      <div class="dimension-list">
        ${criticalDimensions.map(d => `
          <div class="dimension-item">
            <strong>${d.name}</strong>: ${d.score}/100 
            <span class="risk-badge ${d.riskLevel === "critical" ? "risk-critical" : "risk-high"}">
              ${d.riskLevel === "critical" ? "Crítico" : "Alto"}
            </span>
          </div>
        `).join("")}
      </div>
      
      <h3>Recomendações</h3>
      <ul>
        <li>Agende uma conversa individual com o colaborador</li>
        <li>Avalie a necessidade de acompanhamento especializado</li>
        <li>Considere ações de desenvolvimento focadas nas dimensões críticas</li>
        <li>Documente as ações tomadas no sistema</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="${process.env.VITE_APP_URL || ""}/pir-integridade/detalhes/${input.employeeId}" class="btn">
          Ver Detalhes Completos
        </a>
      </p>
    </div>
    <div class="footer">
      <p>Este é um email automático do Sistema AVD UISA.</p>
      <p>Não responda a este email.</p>
    </div>
  </div>
</body>
</html>
          `;

          await sendEmail({
            to: managerData.email,
            subject: alertTitle,
            html: emailHtml,
          });
          results.emailSent = true;
        } catch (error) {
          console.error("[PirRiskAlerts] Erro ao enviar email:", error);
        }
      }

      // Também notificar RH se risco crítico
      if (assessment.riskLevel === "critical") {
        try {
          const rhUsers = await db
            .select()
            .from(users)
            .where(or(eq(users.role, "admin"), eq(users.role, "rh")));

          for (const rhUser of rhUsers) {
            await db.insert(notifications).values({
              userId: rhUser.id,
              type: "pir_risk_alert_critical",
              title: `🚨 Risco CRÍTICO - ${employeeData.employee.name}`,
              message: alertMessage,
              link: `/pir-integridade/detalhes/${input.employeeId}`,
              read: false,
            });
          }
        } catch (error) {
          console.error("[PirRiskAlerts] Erro ao notificar RH:", error);
        }
      }

      return { success: true, ...results };
    }),

  /**
   * Enviar alertas em lote para todos os colaboradores em risco
   */
  sendBatchRiskAlerts: protectedProcedure
    .input(z.object({
      riskLevel: z.enum(["high", "critical", "both"]).default("both"),
      departmentId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar colaboradores em risco
      const riskConditions = input.riskLevel === "both"
        ? or(
            eq(pirIntegrityAssessments.riskLevel, "high"),
            eq(pirIntegrityAssessments.riskLevel, "critical")
          )
        : eq(pirIntegrityAssessments.riskLevel, input.riskLevel);

      const assessments = await db
        .select({
          id: pirIntegrityAssessments.id,
          employeeId: pirIntegrityAssessments.employeeId,
          riskLevel: pirIntegrityAssessments.riskLevel,
          overallScore: pirIntegrityAssessments.overallScore,
        })
        .from(pirIntegrityAssessments)
        .where(and(
          eq(pirIntegrityAssessments.status, "completed"),
          riskConditions
        ))
        .orderBy(desc(pirIntegrityAssessments.completedAt));

      // Agrupar por funcionário (pegar apenas a mais recente)
      const employeeAssessments = new Map<number, typeof assessments[0]>();
      for (const assessment of assessments) {
        if (!employeeAssessments.has(assessment.employeeId)) {
          employeeAssessments.set(assessment.employeeId, assessment);
        }
      }

      let alertsSent = 0;
      let errors = 0;

      for (const [employeeId, assessment] of employeeAssessments) {
        try {
          // Usar a mutation sendRiskAlert internamente
          // Aqui simplificamos para enviar notificação diretamente
          const [employeeData] = await db
            .select({
              employee: employees,
              department: departments,
            })
            .from(employees)
            .leftJoin(departments, eq(employees.departmentId, departments.id))
            .where(eq(employees.id, employeeId))
            .limit(1);

          if (!employeeData?.employee) continue;

          // Filtrar por departamento se especificado
          if (input.departmentId && employeeData.employee.departmentId !== input.departmentId) {
            continue;
          }

          // Buscar gestor
          let managerId = employeeData.employee.managerId;
          let managerUserId: number | null = null;

          if (managerId) {
            const [manager] = await db
              .select({ userId: employees.userId })
              .from(employees)
              .where(eq(employees.id, managerId))
              .limit(1);
            managerUserId = manager?.userId || null;
          }

          if (!managerUserId && employeeData.department?.managerId) {
            const [deptManager] = await db
              .select({ userId: employees.userId })
              .from(employees)
              .where(eq(employees.id, employeeData.department.managerId))
              .limit(1);
            managerUserId = deptManager?.userId || null;
          }

          if (managerUserId) {
            const riskLevelText = assessment.riskLevel === "critical" ? "CRÍTICO" : "ALTO";
            
            await db.insert(notifications).values({
              userId: managerUserId,
              type: "pir_risk_alert",
              title: `⚠️ Alerta de Risco ${riskLevelText} - ${employeeData.employee.name}`,
              message: `O colaborador apresentou nível de risco ${riskLevelText} na avaliação PIR. Pontuação: ${assessment.overallScore}/100.`,
              link: `/pir-integridade/detalhes/${employeeId}`,
              read: false,
            });
            alertsSent++;
          }
        } catch (error) {
          console.error(`[PirRiskAlerts] Erro ao enviar alerta para funcionário ${employeeId}:`, error);
          errors++;
        }
      }

      return { 
        success: true, 
        alertsSent, 
        errors,
        totalEmployeesInRisk: employeeAssessments.size,
      };
    }),

  /**
   * Obter estatísticas de risco por departamento
   */
  getRiskStatsByDepartment: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { stats: [] };

    const stats = await db
      .select({
        departmentId: employees.departmentId,
        departmentName: departments.name,
        riskLevel: pirIntegrityAssessments.riskLevel,
        count: sql<number>`count(DISTINCT ${pirIntegrityAssessments.employeeId})`,
      })
      .from(pirIntegrityAssessments)
      .innerJoin(employees, eq(pirIntegrityAssessments.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(eq(pirIntegrityAssessments.status, "completed"))
      .groupBy(employees.departmentId, departments.name, pirIntegrityAssessments.riskLevel);

    // Agrupar por departamento
    const departmentStats = new Map<number | null, {
      departmentId: number | null;
      departmentName: string | null;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    }>();

    for (const stat of stats) {
      const deptId = stat.departmentId;
      if (!departmentStats.has(deptId)) {
        departmentStats.set(deptId, {
          departmentId: deptId,
          departmentName: stat.departmentName,
          low: 0,
          moderate: 0,
          high: 0,
          critical: 0,
          total: 0,
        });
      }
      const deptStat = departmentStats.get(deptId)!;
      const count = Number(stat.count);
      deptStat.total += count;
      
      switch (stat.riskLevel) {
        case "low":
          deptStat.low += count;
          break;
        case "moderate":
          deptStat.moderate += count;
          break;
        case "high":
          deptStat.high += count;
          break;
        case "critical":
          deptStat.critical += count;
          break;
      }
    }

    return { stats: Array.from(departmentStats.values()) };
  }),

  /**
   * Configurar alertas automáticos
   */
  getAlertSettings: protectedProcedure.query(async () => {
    // Por enquanto, retornar configurações padrão
    // Futuramente, buscar do banco de dados
    return {
      autoAlertEnabled: true,
      alertOnHigh: true,
      alertOnCritical: true,
      emailEnabled: true,
      notificationEnabled: true,
      alertRhOnCritical: true,
    };
  }),
});
