import { getDb } from "../db";
import { timeClockRecords, timeDiscrepancies, alerts, employees } from "../../drizzle/schema";
import { manualActivities as employeeActivities } from "../../drizzle/schema-productivity";
import { eq, and, gte, lte, sql } from "drizzle-orm";

/**
 * Job agendado para calcular discrepâncias entre ponto e atividades
 * Roda diariamente às 6h da manhã
 */

export async function calculateDailyDiscrepancies() {
  console.log("[Job] Iniciando cálculo de discrepâncias...");
  
  const db = await getDb();
  if (!db) {
    console.error("[Job] Database não disponível");
    return {
      success: false,
      error: "Database not available",
    };
  }
  
  try {
    // Calcular discrepâncias do dia anterior
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`[Job] Calculando discrepâncias de ${yesterday.toISOString()} até ${today.toISOString()}`);
    
    // Buscar registros de ponto do dia anterior
    const clockRecords = await db
      .select()
      .from(timeClockRecords)
      .where(
        and(
          gte(timeClockRecords.date, yesterday),
          lte(timeClockRecords.date, today)
        )
      );
    
    console.log(`[Job] Encontrados ${clockRecords.length} registros de ponto`);
    
    let discrepanciesCreated = 0;
    let alertsCreated = 0;
    const errors: string[] = [];
    
    for (const clockRecord of clockRecords) {
      try {
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
        
        // Pular se não houver dados suficientes
        if (clockMinutes === 0) {
          continue;
        }
        
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
        
        // Verificar se já existe discrepância para este dia/colaborador
        const existing = await db
          .select()
          .from(timeDiscrepancies)
          .where(
            and(
              eq(timeDiscrepancies.employeeId, clockRecord.employeeId),
              eq(timeDiscrepancies.date, clockRecord.date)
            )
          )
          .limit(1);
        
        if (existing.length > 0) {
          console.log(`[Job] Discrepância já existe para colaborador ${clockRecord.employeeId} em ${clockRecord.date.toISOString()}`);
          continue;
        }
        
        // Criar registro de discrepância
        await db.insert(timeDiscrepancies).values({
          employeeId: clockRecord.employeeId,
          date: clockRecord.date,
          clockMinutes,
          activityMinutes,
          differenceMinutes,
          differencePercentage: differencePercentage.toFixed(2),
          discrepancyType,
          status: "pending",
        });
        
        discrepanciesCreated++;
        
        // Criar alerta se discrepância > 20%
        if (differencePercentage > 20) {
          const [employee] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, clockRecord.employeeId))
            .limit(1);
          
          if (employee) {
            // Verificar se já existe alerta para este dia/colaborador
            const existingAlert = await db
              .select()
              .from(alerts)
              .where(
                and(
                  eq(alerts.employeeId, clockRecord.employeeId),
                  eq(alerts.type, "time_discrepancy"),
                  gte(alerts.createdAt, dayStart),
                  lte(alerts.createdAt, dayEnd)
                )
              )
              .limit(1);
            
            if (existingAlert.length === 0) {
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
      } catch (error) {
        const errorMsg = `Erro ao processar colaborador ${clockRecord.employeeId}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[Job] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    const summary = {
      success: true,
      recordsAnalyzed: clockRecords.length,
      discrepanciesCreated,
      alertsCreated,
      errors,
      timestamp: new Date().toISOString(),
    };
    
    console.log("[Job] Cálculo de discrepâncias concluído:", summary);
    
    return summary;
  } catch (error) {
    const errorMsg = `Erro geral no job: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[Job] ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    };
  }
}


