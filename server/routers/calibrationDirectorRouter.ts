import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, sql } from "drizzle-orm";

/**
 * Router para calibração de diretoria com Nine Box interativo
 */
export const calibrationDirectorRouter = router({
  /**
   * Listar sessões de calibração
   */
  listSessions: protectedProcedure
    .input(
      z.object({
        status: z.enum(["draft", "in_progress", "completed"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = "SELECT * FROM calibrationSessions WHERE 1=1";
      const params: any[] = [];

      if (input.status) {
        query += " AND status = ?";
        params.push(input.status);
      }

      query += " ORDER BY createdAt DESC";

      const sessions = await db.execute(sql.raw(query));
      return (sessions[0] as unknown) as any[];
    }),

  /**
   * Criar nova sessão de calibração
   */
  createSession: protectedProcedure
    .input(
      z.object({
        sessionName: z.string().min(3),
        cycleId: z.number().optional(),
        departmentFilter: z.array(z.number()).optional(),
        levelFilter: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.execute(
        sql`INSERT INTO calibrationSessions (sessionName, cycleId, departmentFilter, levelFilter, status, createdBy)
           VALUES (${input.sessionName}, ${input.cycleId || null}, ${input.departmentFilter ? JSON.stringify(input.departmentFilter) : null}, ${input.levelFilter ? JSON.stringify(input.levelFilter) : null}, 'draft', ${ctx.user.id})`
      );

      return { sessionId: (result[0] as any).insertId, success: true };
    }),

  /**
   * Buscar profissionais para calibração
   */
  getEmployeesForCalibration: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        departmentIds: z.array(z.number()).optional(),
        levels: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = `
        SELECT 
          e.id,
          e.name,
          e.email,
          e.position,
          e.department,
          e.level,
          e.costCenter,
          e.photo,
          COALESCE(cp.performanceScore, 3) as performanceScore,
          COALESCE(cp.potentialScore, 3) as potentialScore,
          COALESCE(cp.nineBoxQuadrant, 'medium_medium') as nineBoxQuadrant,
          cp.justification,
          cp.evidenceFiles,
          cp.previousPosition
        FROM employees e
        LEFT JOIN calibrationPositions cp ON cp.employeeId = e.id AND cp.sessionId = ?
        WHERE e.status = 'active'
      `;

      const params: any[] = [input.sessionId];

      if (input.departmentIds && input.departmentIds.length > 0) {
        query += ` AND e.department IN (${input.departmentIds.map(() => "?").join(",")})`;
        params.push(...input.departmentIds);
      }

      if (input.levels && input.levels.length > 0) {
        query += ` AND e.level IN (${input.levels.map(() => "?").join(",")})`;
        params.push(...input.levels);
      }

      query += " ORDER BY e.name";

      const employees = await db.execute(sql.raw(query));
      return (employees[0] as unknown) as any[];
    }),

  /**
   * Atualizar posição de profissional no Nine Box
   */
  updatePosition: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        employeeId: z.number(),
        performanceScore: z.number().min(1).max(5),
        potentialScore: z.number().min(1).max(5),
        justification: z.string().optional(),
        evidenceFiles: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calcular quadrante do Nine Box
      const quadrant = getNineBoxQuadrant(input.performanceScore, input.potentialScore);

      // Buscar posição anterior
      const previousResult = await db.execute(
        sql`SELECT performanceScore, potentialScore, nineBoxQuadrant 
           FROM calibrationPositions 
           WHERE sessionId = ${input.sessionId} AND employeeId = ${input.employeeId}`
      );

      const previous = ((previousResult[0] as unknown) as any[])[0];

      // Inserir ou atualizar posição
      await db.execute(
        sql`INSERT INTO calibrationPositions 
           (sessionId, employeeId, performanceScore, potentialScore, nineBoxQuadrant, justification, evidenceFiles, previousPosition, changedBy, changedAt)
           VALUES (${input.sessionId}, ${input.employeeId}, ${input.performanceScore}, ${input.potentialScore}, ${quadrant}, ${input.justification || null}, ${input.evidenceFiles ? JSON.stringify(input.evidenceFiles) : null}, ${previous ? previous.nineBoxQuadrant : null}, ${ctx.user.id}, NOW())
           ON DUPLICATE KEY UPDATE
           performanceScore = VALUES(performanceScore),
           potentialScore = VALUES(potentialScore),
           nineBoxQuadrant = VALUES(nineBoxQuadrant),
           justification = VALUES(justification),
           evidenceFiles = VALUES(evidenceFiles),
           changedBy = VALUES(changedBy),
           changedAt = NOW()`
      );

      // Registrar histórico se houve mudança
      if (previous) {
        await db.execute(
          sql`INSERT INTO calibrationHistory 
             (sessionId, employeeId, oldPerformance, newPerformance, oldPotential, newPotential, oldQuadrant, newQuadrant, justification, changedBy, changedAt)
             VALUES (${input.sessionId}, ${input.employeeId}, ${previous.performanceScore}, ${input.performanceScore}, ${previous.potentialScore}, ${input.potentialScore}, ${previous.nineBoxQuadrant}, ${quadrant}, ${input.justification || null}, ${ctx.user.id}, NOW())`
        );
      }

      return { success: true, quadrant };
    }),

  /**
   * Upload de evidências
   */
  uploadEvidence: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        employeeId: z.number(),
        fileUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar evidências atuais
      const result = await db.execute(
        sql`SELECT evidenceFiles FROM calibrationPositions WHERE sessionId = ${input.sessionId} AND employeeId = ${input.employeeId}`
      );

      const current = ((result[0] as unknown) as any[])[0];
      const files = current?.evidenceFiles ? JSON.parse(current.evidenceFiles) : [];
      files.push(input.fileUrl);

      // Atualizar
      await db.execute(
        sql`UPDATE calibrationPositions SET evidenceFiles = ${JSON.stringify(files)} WHERE sessionId = ${input.sessionId} AND employeeId = ${input.employeeId}`
      );

      return { success: true };
    }),

  /**
   * Buscar histórico de calibrações de um profissional
   */
  getEmployeeHistory: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const history = await db.execute(
        sql`SELECT 
            ch.*,
            cs.sessionName,
            cs.sessionDate,
            u.name as changedByName
           FROM calibrationHistory ch
           JOIN calibrationSessions cs ON cs.id = ch.sessionId
           LEFT JOIN users u ON u.id = ch.changedBy
           WHERE ch.employeeId = ${input.employeeId}
           ORDER BY ch.changedAt DESC`
      );

      return (history[0] as unknown) as any[];
    }),

  /**
   * Finalizar sessão de calibração
   */
  completeSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.execute(
        sql`UPDATE calibrationSessions SET status = 'completed' WHERE id = ${input.sessionId}`
      );

      return { success: true };
    }),

  /**
   * Exportar dados da sessão
   */
  exportSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const data = await db.execute(
        sql`SELECT 
            e.name,
            e.email,
            e.position,
            e.department,
            e.level,
            cp.performanceScore,
            cp.potentialScore,
            cp.nineBoxQuadrant,
            cp.justification,
            cp.previousPosition
           FROM calibrationPositions cp
           JOIN employees e ON e.id = cp.employeeId
           WHERE cp.sessionId = ${input.sessionId}
           ORDER BY e.name`
      );

      return (data[0] as unknown) as any[];
    }),
});

/**
 * Função auxiliar para calcular quadrante do Nine Box
 */
function getNineBoxQuadrant(performance: number, potential: number): string {
  const perfLevel = performance <= 2 ? "low" : performance <= 3 ? "medium" : "high";
  const potLevel = potential <= 2 ? "low" : potential <= 3 ? "medium" : "high";
  return `${perfLevel}_${potLevel}`;
}
