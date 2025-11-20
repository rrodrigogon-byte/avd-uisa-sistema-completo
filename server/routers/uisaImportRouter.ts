import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { jobDescriptions, positions, departments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "../utils/permissions";
import fs from "fs/promises";
import path from "path";

const JOB_DESCRIPTIONS_FILE = path.join(process.cwd(), 'data/uisa-job-descriptions.json');

export const uisaImportRouter = router({
  /**
   * Importa descrições de cargos UISA do arquivo JSON gerado
   */
  importJobDescriptions: protectedProcedure
    .input(z.object({
      overwriteExisting: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se é admin
      if (!(await isAdmin(ctx.user.id))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem importar descrições de cargos" });
      }

      try {
        // Ler arquivo JSON
        const fileContent = await fs.readFile(JOB_DESCRIPTIONS_FILE, 'utf-8');
        const descriptions = JSON.parse(fileContent);

        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (const desc of descriptions) {
          try {
            // Verificar se já existe
            const existing = await db.select()
              .from(jobDescriptions)
              .where(eq(jobDescriptions.positionTitle, desc.title))
              .limit(1);

            if (existing.length > 0 && !input.overwriteExisting) {
              skipped++;
              continue;
            }

            // Buscar ou criar cargo e departamento
            let positionId = 1; // Default
            let departmentId = 1; // Default

            const descriptionData = {
              positionId,
              positionTitle: desc.title,
              departmentId,
              departmentName: desc.department || 'Geral',
              mainObjective: desc.responsibilities.slice(0, 3).join('; ') || 'Sem descrição',
              responsibilities: JSON.stringify(desc.responsibilities),
              requiredKnowledge: JSON.stringify(desc.requirements),
              requiredCompetencies: JSON.stringify(desc.competencies),
              status: 'approved' as const,
              createdBy: ctx.user.id,
              createdById: ctx.user.id,
            };

            if (existing.length > 0) {
              // Atualizar
              await db.update(jobDescriptions)
                .set(descriptionData)
                .where(eq(jobDescriptions.id, existing[0].id));
            } else {
              // Inserir
              await db.insert(jobDescriptions).values(descriptionData);
            }

            imported++;
          } catch (error) {
            console.error(`Erro ao importar ${desc.title}:`, error);
            errors++;
          }
        }

        return {
          success: true,
          total: descriptions.length,
          imported,
          skipped,
          errors,
        };
      } catch (error) {
        console.error('Erro ao importar descrições:', error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }),

  /**
   * Retorna estatísticas do arquivo de importação
   */
  getImportStats: protectedProcedure
    .query(async () => {
      try {
        const fileContent = await fs.readFile(JOB_DESCRIPTIONS_FILE, 'utf-8');
        const descriptions = JSON.parse(fileContent);

        const stats = {
          total: descriptions.length,
          byDepartment: {} as Record<string, number>,
          byLevel: {} as Record<string, number>,
        };

        descriptions.forEach((desc: any) => {
          stats.byDepartment[desc.department] = (stats.byDepartment[desc.department] || 0) + 1;
          stats.byLevel[desc.level] = (stats.byLevel[desc.level] || 0) + 1;
        });

        return stats;
      } catch (error) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Arquivo de importação não encontrado. Execute o script de parser primeiro."
        });
      }
    }),
});
