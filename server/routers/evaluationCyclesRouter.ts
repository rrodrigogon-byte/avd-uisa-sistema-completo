import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  evaluationCycles, 
  evaluation360CycleParticipants, 
  employees,
  departments
} from "../../drizzle/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { sendEmail } from "../emailService";

export const evaluationCyclesRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        year: z.number().int().min(2020).max(2100).optional(),
        type: z.enum(["anual", "semestral", "trimestral"]).optional(),
        startDate: z.string().or(z.date()),
        endDate: z.string().or(z.date()),
        description: z.string().optional(),
        selfEvaluationDeadline: z.string().or(z.date()).optional(),
        managerEvaluationDeadline: z.string().or(z.date()).optional(),
        consensusDeadline: z.string().or(z.date()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Converter strings para Date
      const startDate = typeof input.startDate === 'string' ? new Date(input.startDate) : input.startDate;
      const endDate = typeof input.endDate === 'string' ? new Date(input.endDate) : input.endDate;
      const selfEvaluationDeadline = input.selfEvaluationDeadline 
        ? (typeof input.selfEvaluationDeadline === 'string' ? new Date(input.selfEvaluationDeadline) : input.selfEvaluationDeadline)
        : null;
      const managerEvaluationDeadline = input.managerEvaluationDeadline
        ? (typeof input.managerEvaluationDeadline === 'string' ? new Date(input.managerEvaluationDeadline) : input.managerEvaluationDeadline)
        : null;
      const consensusDeadline = input.consensusDeadline
        ? (typeof input.consensusDeadline === 'string' ? new Date(input.consensusDeadline) : input.consensusDeadline)
        : null;

      // Extrair year e type se não fornecidos
      const year = input.year ?? startDate.getFullYear();
      const type = input.type ?? "anual";

      // Validar que endDate é posterior a startDate
      if (endDate <= startDate) {
        throw new Error("Data de término deve ser posterior à data de início");
      }

      const [result] = await db.insert(evaluationCycles).values({
        name: input.name,
        year: year,
        type: type,
        startDate: startDate,
        endDate: endDate,
        description: input.description || null,
        selfEvaluationDeadline: selfEvaluationDeadline,
        managerEvaluationDeadline: managerEvaluationDeadline,
        consensusDeadline: consensusDeadline,
        status: "planejado",
        active: true,
      });

      const cycleId = Number(result.insertId);

      return {
        success: true,
        id: cycleId,
      };
    }),

  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const cycles = await db
      .select()
      .from(evaluationCycles)
      .orderBy(sql`${evaluationCycles.createdAt} DESC`);

    return cycles;
  }),

  listActive: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const activeCycles = await db
      .select()
      .from(evaluationCycles)
      .where(
        and(
          eq(evaluationCycles.status, "ativo"),
          sql`${evaluationCycles.endDate} >= CURDATE()`
        )
      );

    return activeCycles;
  }),

  getProgressStats: protectedProcedure
    .input(z.object({ cycleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar participantes do ciclo
      const participants = await db
        .select()
        .from(evaluation360CycleParticipants)
        .where(eq(evaluation360CycleParticipants.cycleId, input.cycleId));

      // Avaliações serão contadas via participantes

      const total = participants.length;
      const completed = participants.filter(p => p.status === "completed").length;
      const pending = participants.filter(p => p.status === "pending" || p.status === "in_progress").length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // Progresso por tipo (simplificado)
      const progressByType = {
        autoavaliacao: 0,
        pares: 0,
        superiores: 0,
        subordinados: 0,
      };

      // Buscar dados de departamentos
      const employeeIds = Array.from(new Set(participants.map(p => p.employeeId)));
      const employeesData = await db
        .select()
        .from(employees)
        .where(inArray(employees.id, employeeIds));

      const departmentIds = Array.from(new Set(employeesData.map(e => e.departmentId).filter(Boolean))) as number[];
      const departmentsData = departmentIds.length > 0 ? await db
        .select()
        .from(departments)
        .where(inArray(departments.id, departmentIds)) : [];

      const departmentMap = new Map(departmentsData.map(d => [d.id, d.name]));
      const employeeDeptMap = new Map(employeesData.map(e => [e.id, e.departmentId]));

      // Progresso por departamento
      const deptStats = new Map<string, { total: number; completed: number }>();

      participants.forEach(p => {
        const deptId = employeeDeptMap.get(p.employeeId);
        const deptName = deptId ? departmentMap.get(deptId) || "Sem Departamento" : "Sem Departamento";
        
        if (!deptStats.has(deptName)) {
          deptStats.set(deptName, { total: 0, completed: 0 });
        }
        
        const stats = deptStats.get(deptName)!;
        stats.total++;
        if (p.status === "completed") stats.completed++;
      });

      const byDepartment = Array.from(deptStats.entries()).map(([department, stats]) => ({
        department,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
        total: stats.total,
        completed: stats.completed,
      }));

      return {
        total,
        completed,
        pending,
        overdue: 0, // Calcular baseado em deadline se necessário
        completionRate,
        progressByType,
        byDepartment,
      };
    }),

  getPendingEvaluators: protectedProcedure
    .input(
      z.object({
        cycleId: z.number(),
        department: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar ciclo para pegar deadline
      const cycle = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.cycleId))
        .limit(1);

      if (cycle.length === 0) return [];

      const deadline = cycle[0].endDate;

      // Buscar participantes pendentes
      const participants = await db
        .select()
        .from(evaluation360CycleParticipants)
        .where(
          and(
            eq(evaluation360CycleParticipants.cycleId, input.cycleId),
            inArray(evaluation360CycleParticipants.status, ["pending", "in_progress"])
          )
        );

      // Buscar dados de funcionários
      const employeeIds = Array.from(new Set(participants.map(p => p.employeeId)));
      const employeesData = await db
        .select()
        .from(employees)
        .where(inArray(employees.id, employeeIds));

      const employeeMap = new Map(employeesData.map(e => [e.id, e]));

      // Buscar departamentos
      const departmentIds = Array.from(new Set(employeesData.map(e => e.departmentId).filter(Boolean))) as number[];
      const departmentsData = departmentIds.length > 0 ? await db
        .select()
        .from(departments)
        .where(inArray(departments.id, departmentIds)) : [];

      const departmentMap = new Map(departmentsData.map(d => [d.id, d.name]));

      const result = participants
        .map(p => {
          const employee = employeeMap.get(p.employeeId);
          if (!employee) return null;

          const deptId = employee.departmentId;
          const deptName = deptId ? departmentMap.get(deptId) || "Sem Departamento" : "Sem Departamento";

          // Filtrar por departamento se especificado
          if (input.department && deptName !== input.department) return null;

          return {
            id: p.id,
            evaluatorName: employee.name,
            evaluatedName: employee.name,
            department: deptName,
            type: p.participationType,
            status: p.status,
            deadline,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      return result;
    }),

  resendReminder: protectedProcedure
    .input(z.object({ participantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar participante
      const participant = await db
        .select()
        .from(evaluation360CycleParticipants)
        .where(eq(evaluation360CycleParticipants.id, input.participantId))
        .limit(1);

      if (participant.length === 0) {
        throw new Error("Participante não encontrado");
      }

      const p = participant[0];

      // Buscar dados do funcionário e ciclo
      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, p.employeeId))
        .limit(1);

      const cycle = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, p.cycleId))
        .limit(1);

      if (employee.length === 0 || cycle.length === 0) {
        throw new Error("Dados não encontrados");
      }

      // Enviar email de lembrete
      await sendEmail({
        to: employee[0].email,
        subject: `Lembrete: Avaliação 360° Pendente - ${cycle[0].name}`,
        html: `
          <h2>Lembrete de Avaliação Pendente</h2>
          <p>Olá ${employee[0].name},</p>
          <p>Este é um lembrete de que você possui avaliações 360° pendentes no ciclo <strong>${cycle[0].name}</strong>.</p>
          <p><strong>Prazo:</strong> ${new Date(cycle[0].endDate).toLocaleDateString("pt-BR")}</p>
          <p>Por favor, acesse o sistema e complete suas avaliações o quanto antes.</p>
          <p>Obrigado!</p>
        `,
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "Nome é obrigatório").optional(),
        year: z.number().int().min(2020).max(2100).optional(),
        type: z.enum(["anual", "semestral", "trimestral"]).optional(),
        startDate: z.string().or(z.date()).optional(),
        endDate: z.string().or(z.date()).optional(),
        description: z.string().optional(),
        selfEvaluationDeadline: z.string().or(z.date()).optional().nullable(),
        managerEvaluationDeadline: z.string().or(z.date()).optional().nullable(),
        consensusDeadline: z.string().or(z.date()).optional().nullable(),
        status: z.enum(["planejado", "ativo", "concluido", "cancelado"]).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar ciclo existente
      const existingCycle = await db
        .select()
        .from(evaluationCycles)
        .where(eq(evaluationCycles.id, input.id))
        .limit(1);

      if (existingCycle.length === 0) {
        throw new Error("Ciclo não encontrado");
      }

      // Preparar dados para atualização
      const updateData: any = {};

      if (input.name !== undefined) updateData.name = input.name;
      if (input.year !== undefined) updateData.year = input.year;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.active !== undefined) updateData.active = input.active;

      // Converter datas se fornecidas
      if (input.startDate !== undefined) {
        updateData.startDate = typeof input.startDate === 'string' ? new Date(input.startDate) : input.startDate;
      }
      if (input.endDate !== undefined) {
        updateData.endDate = typeof input.endDate === 'string' ? new Date(input.endDate) : input.endDate;
      }
      if (input.selfEvaluationDeadline !== undefined) {
        updateData.selfEvaluationDeadline = input.selfEvaluationDeadline
          ? (typeof input.selfEvaluationDeadline === 'string' ? new Date(input.selfEvaluationDeadline) : input.selfEvaluationDeadline)
          : null;
      }
      if (input.managerEvaluationDeadline !== undefined) {
        updateData.managerEvaluationDeadline = input.managerEvaluationDeadline
          ? (typeof input.managerEvaluationDeadline === 'string' ? new Date(input.managerEvaluationDeadline) : input.managerEvaluationDeadline)
          : null;
      }
      if (input.consensusDeadline !== undefined) {
        updateData.consensusDeadline = input.consensusDeadline
          ? (typeof input.consensusDeadline === 'string' ? new Date(input.consensusDeadline) : input.consensusDeadline)
          : null;
      }

      // Validar que endDate é posterior a startDate se ambos forem fornecidos
      if (updateData.startDate && updateData.endDate) {
        if (updateData.endDate <= updateData.startDate) {
          throw new Error("Data de término deve ser posterior à data de início");
        }
      }

      // Atualizar ciclo
      await db
        .update(evaluationCycles)
        .set(updateData)
        .where(eq(evaluationCycles.id, input.id));

      return {
        success: true,
        id: input.id,
      };
    }),
});
