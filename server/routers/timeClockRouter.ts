import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { timeClockRecords, timeDiscrepancies, employeeActivities, employees, alerts } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

/**
 * Router para integração com sistema de ponto eletrônico
 */
export const timeClockRouter = router({
  /**
   * Importar registros de ponto (CSV, API, manual)
   */
  importRecords: protectedProcedure
    .input(z.object({
      records: z.array(z.object({
        employeeId: z.number(),
        date: z.string(), // ISO date
        clockIn: z.string().optional(), // ISO datetime
        clockOut: z.string().optional(), // ISO datetime
        totalMinutes: z.number().optional(),
        breakMinutes: z.number().optional(),
        recordType: z.enum(["normal", "overtime", "absence", "late", "early_leave", "holiday"]).optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      })),
      importSource: z.string(), // "manual", "api", "csv"
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      for (const record of input.records) {
        try {
          // Calcular minutos trabalhados se não fornecido
          let workedMinutes = record.totalMinutes;
          if (!workedMinutes && record.clockIn && record.clockOut) {
            const clockInTime = new Date(record.clockIn).getTime();
            const clockOutTime = new Date(record.clockOut).getTime();
            const totalMinutes = Math.floor((clockOutTime - clockInTime) / (1000 * 60));
            workedMinutes = totalMinutes - (record.breakMinutes || 0);
          }
          
          await db.insert(timeClockRecords).values({
            employeeId: record.employeeId,
            date: new Date(record.date),
            clockIn: record.clockIn ? new Date(record.clockIn) : null,
            clockOut: record.clockOut ? new Date(record.clockOut) : null,
            totalMinutes: record.totalMinutes || null,
            breakMinutes: record.breakMinutes || 0,
            workedMinutes: workedMinutes || null,
            recordType: record.recordType || "normal",
            location: record.location || null,
            notes: record.notes || null,
            importSource: input.importSource,
          });
          
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Erro ao importar registro do colaborador ${record.employeeId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      return {
        success: successCount,
        failed: errorCount,
        total: input.records.length,
        errors,
      };
    }),
  
  /**
   * Calcular discrepâncias entre ponto e atividades
   */
  calculateDiscrepancies: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      employeeId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      
      // Buscar registros de ponto
      const clockRecordsQuery = db
        .select()
        .from(timeClockRecords)
        .where(
          and(
            gte(timeClockRecords.date, startDate),
            lte(timeClockRecords.date, endDate),
            input.employeeId ? eq(timeClockRecords.employeeId, input.employeeId) : undefined
          )
        );
      
      const clockRecords = await clockRecordsQuery;
      
      let discrepanciesCreated = 0;
      let alertsCreated = 0;
      
      for (const clockRecord of clockRecords) {
        // Buscar atividades do mesmo dia
        const dayStart = new Date(clockRecord.date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(clockRecord.date);
        dayEnd.setHours(23, 59, 59, 999);
        
        const activities = await db
          .select()
          .from(employeeActivities)
          .where(
            and(
              eq(employeeActivities.employeeId, clockRecord.employeeId),
              gte(employeeActivities.activityDate, dayStart),
              lte(employeeActivities.activityDate, dayEnd)
            )
          );
        
        // Calcular total de minutos de atividades
        const activityMinutes = activities.reduce((sum, act) => sum + (act.durationMinutes || 0), 0);
        const clockMinutes = clockRecord.workedMinutes || 0;
        
        // Calcular diferença
        const differenceMinutes = clockMinutes - activityMinutes;
        const differencePercentage = clockMinutes > 0 ? (Math.abs(differenceMinutes) / clockMinutes) * 100 : 0;
        
        // Classificar discrepância
        let discrepancyType: "over_reported" | "under_reported" | "acceptable";
        if (differencePercentage < 10) {
          discrepancyType = "acceptable";
        } else if (differenceMinutes < 0) {
          discrepancyType = "over_reported"; // Mais atividades que ponto
        } else {
          discrepancyType = "under_reported"; // Menos atividades que ponto
        }
        
        // Criar registro de discrepância
        const [discrepancy] = await db.insert(timeDiscrepancies).values({
          employeeId: clockRecord.employeeId,
          date: clockRecord.date,
          clockMinutes,
          activityMinutes,
          differenceMinutes,
          differencePercentage: differencePercentage.toFixed(2),
          discrepancyType,
          status: "pending",
        }).$returningId();
        
        discrepanciesCreated++;
        
        // Criar alerta se discrepância > 20%
        if (differencePercentage > 20) {
          const [employee] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, clockRecord.employeeId))
            .limit(1);
          
          if (employee) {
            await db.insert(alerts).values({
              employeeId: clockRecord.employeeId,
              type: "time_discrepancy",
              severity: differencePercentage > 50 ? "critical" : differencePercentage > 30 ? "high" : "medium",
              title: `Discrepância de ${differencePercentage.toFixed(0)}% entre ponto e atividades`,
              description: `Colaborador ${employee.name} apresentou ${clockMinutes} minutos no ponto mas registrou apenas ${activityMinutes} minutos em atividades no dia ${clockRecord.date.toLocaleDateString()}.`,
              metrics: JSON.stringify({
                clockMinutes,
                activityMinutes,
                differenceMinutes,
                differencePercentage,
              }),
              status: "active",
            });
            
            alertsCreated++;
          }
        }
      }
      
      return {
        discrepanciesCreated,
        alertsCreated,
        recordsAnalyzed: clockRecords.length,
      };
    }),
  
  /**
   * Listar registros de ponto
   */
  listRecords: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      if (input.employeeId) conditions.push(eq(timeClockRecords.employeeId, input.employeeId));
      if (input.startDate) conditions.push(gte(timeClockRecords.date, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(timeClockRecords.date, new Date(input.endDate)));
      
      const records = await db
        .select({
          id: timeClockRecords.id,
          employeeId: timeClockRecords.employeeId,
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          date: timeClockRecords.date,
          clockIn: timeClockRecords.clockIn,
          clockOut: timeClockRecords.clockOut,
          totalMinutes: timeClockRecords.totalMinutes,
          breakMinutes: timeClockRecords.breakMinutes,
          workedMinutes: timeClockRecords.workedMinutes,
          recordType: timeClockRecords.recordType,
          location: timeClockRecords.location,
          notes: timeClockRecords.notes,
          importSource: timeClockRecords.importSource,
          importedAt: timeClockRecords.importedAt,
        })
        .from(timeClockRecords)
        .leftJoin(employees, eq(timeClockRecords.employeeId, employees.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(timeClockRecords.date))
        .limit(input.limit);
      
      return records;
    }),
  
  /**
   * Listar discrepâncias
   */
  listDiscrepancies: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      status: z.enum(["pending", "reviewed", "justified", "flagged"]).optional(),
      minPercentage: z.number().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      if (input.employeeId) conditions.push(eq(timeDiscrepancies.employeeId, input.employeeId));
      if (input.status) conditions.push(eq(timeDiscrepancies.status, input.status));
      if (input.minPercentage) conditions.push(sql`${timeDiscrepancies.differencePercentage} >= ${input.minPercentage}`);
      
      const discrepancies = await db
        .select({
          id: timeDiscrepancies.id,
          employeeId: timeDiscrepancies.employeeId,
          employeeName: employees.name,
          employeeCode: employees.employeeCode,
          date: timeDiscrepancies.date,
          clockMinutes: timeDiscrepancies.clockMinutes,
          activityMinutes: timeDiscrepancies.activityMinutes,
          differenceMinutes: timeDiscrepancies.differenceMinutes,
          differencePercentage: timeDiscrepancies.differencePercentage,
          discrepancyType: timeDiscrepancies.discrepancyType,
          status: timeDiscrepancies.status,
          justification: timeDiscrepancies.justification,
          createdAt: timeDiscrepancies.createdAt,
        })
        .from(timeDiscrepancies)
        .leftJoin(employees, eq(timeDiscrepancies.employeeId, employees.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(timeDiscrepancies.date))
        .limit(input.limit);
      
      return discrepancies;
    }),
  
  /**
   * Justificar discrepância
   */
  justifyDiscrepancy: protectedProcedure
    .input(z.object({
      discrepancyId: z.number(),
      justification: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(timeDiscrepancies)
        .set({
          status: "justified",
          justification: input.justification,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        })
        .where(eq(timeDiscrepancies.id, input.discrepancyId));
      
      return { success: true };
    }),
  
  /**
   * Estatísticas de ponto
   */
  getStats: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalRecords: 0, totalDiscrepancies: 0, criticalDiscrepancies: 0 };
      
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      
      const [recordStats] = await db
        .select({
          totalRecords: sql<number>`COUNT(*)`,
        })
        .from(timeClockRecords)
        .where(
          and(
            gte(timeClockRecords.date, startDate),
            lte(timeClockRecords.date, endDate)
          )
        );
      
      const [discrepancyStats] = await db
        .select({
          totalDiscrepancies: sql<number>`COUNT(*)`,
          criticalDiscrepancies: sql<number>`SUM(CASE WHEN differencePercentage > 50 THEN 1 ELSE 0 END)`,
        })
        .from(timeDiscrepancies)
        .where(
          and(
            gte(timeDiscrepancies.date, startDate),
            lte(timeDiscrepancies.date, endDate)
          )
        );
      
      return {
        totalRecords: recordStats?.totalRecords || 0,
        totalDiscrepancies: discrepancyStats?.totalDiscrepancies || 0,
        criticalDiscrepancies: discrepancyStats?.criticalDiscrepancies || 0,
      };
    }),
});
