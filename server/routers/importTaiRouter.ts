import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { employees } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Router para Importação de Dados da Diretoria TAI
 * Apenas administradores podem executar importações
 */

export const importTaiRouter = router({
  /**
   * Importar dados da Diretoria TAI do arquivo JSON
   */
  importDiretoriaTai: adminProcedure
    .input(
      z.object({
        dryRun: z.boolean().default(false), // Se true, apenas simula sem salvar
      }).optional()
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const dryRun = input?.dryRun ?? false;

      // Ler arquivo JSON
      const dataPath = join(process.cwd(), "scripts", "diretoria-tai-data.json");
      const rawData = readFileSync(dataPath, "utf-8");
      const data = JSON.parse(rawData);

      let imported = 0;
      let updated = 0;
      let errors = 0;
      const errorDetails: Array<{ name: string; error: string }> = [];

      for (const emp of data) {
        try {
          // Determinar active baseado no status
          const active = emp.status === "active";
          const situacao = emp.status === "active" ? "Ativo" : "Ferias";

          // Determinar hierarchyLevel baseado no role
          const hierarchyMap: Record<string, "diretoria" | "gerencia" | "coordenacao" | "supervisao" | "operacional"> = {
            admin: "diretoria",
            rh: "gerencia",
            lider: "supervisao",
            user: "operacional",
          };
          const hierarchyLevel = hierarchyMap[emp.role as keyof typeof hierarchyMap] || "operacional";

          // Dados do funcionário
          const employeeData = {
            employeeCode: emp.employeeId,
            chapa: emp.employeeId,
            name: emp.name,
            email: emp.email || null,
            telefone: emp.phone || null,
            funcao: emp.position || null,
            gerencia: emp.department || null,
            diretoria: emp.directorate || null,
            cargo: emp.jobTitle || null,
            situacao,
            secao: emp.section || null,
            codSecao: emp.sectionCode || null,
            codFuncao: emp.functionCode || null,
            active,
            hierarchyLevel,
          };

          if (!dryRun) {
            // Verificar se já existe
            const existing = await db
              .select()
              .from(employees)
              .where(eq(employees.employeeCode, employeeData.employeeCode))
              .limit(1);

            if (existing.length > 0) {
              // Atualizar
              await db
                .update(employees)
                .set(employeeData)
                .where(eq(employees.employeeCode, employeeData.employeeCode));
              updated++;
            } else {
              // Inserir
              await db.insert(employees).values(employeeData);
              imported++;
            }
          } else {
            // Modo dry-run: apenas contar
            const existing = await db
              .select()
              .from(employees)
              .where(eq(employees.employeeCode, employeeData.employeeCode))
              .limit(1);

            if (existing.length > 0) {
              updated++;
            } else {
              imported++;
            }
          }
        } catch (error: any) {
          errors++;
          errorDetails.push({
            name: emp.name,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        dryRun,
        total: data.length,
        imported,
        updated,
        errors,
        errorDetails: errorDetails.slice(0, 10), // Apenas primeiros 10 erros
      };
    }),

  /**
   * Verificar status da importação (quantos já existem)
   */
  checkImportStatus: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Ler arquivo JSON
    const dataPath = join(process.cwd(), "scripts", "diretoria-tai-data.json");
    const rawData = readFileSync(dataPath, "utf-8");
    const data = JSON.parse(rawData);

    let existing = 0;
    let missing = 0;

    for (const emp of data) {
      const found = await db
        .select()
        .from(employees)
        .where(eq(employees.employeeCode, emp.employeeId))
        .limit(1);

      if (found.length > 0) {
        existing++;
      } else {
        missing++;
      }
    }

    return {
      total: data.length,
      existing,
      missing,
      needsImport: missing > 0,
    };
  }),
});
