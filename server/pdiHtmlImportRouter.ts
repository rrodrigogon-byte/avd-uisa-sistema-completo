import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import {
  employees,
  pdiPlans,
  pdiIntelligentDetails,
  pdiCompetencyGaps,
  pdiActions,
  competencies,
  evaluationCycles,
  positions,
} from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import fs from "fs/promises";
import path from "path";

/**
 * Router para importação de PDI a partir de arquivos HTML
 */

export const pdiHtmlImportRouter = router({
  /**
   * Importar PDI a partir de arquivo HTML
   * Processa os arquivos PDI_Wilson3.html e PDI_Fernando9.html
   */
  importFromHtml: protectedProcedure
    .input(
      z.object({
        htmlFilename: z.enum(["PDI_Wilson3.html", "PDI_Fernando9.html"]),
        cycleId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Ler arquivo JSON com dados extraídos
        const dataPath = path.join(process.cwd(), "pdi_data.json");
        const jsonData = await fs.readFile(dataPath, "utf-8");
        const pdiDataArray = JSON.parse(jsonData);

        // Encontrar dados do PDI correspondente ao arquivo
        const pdiData = pdiDataArray.find((item: any) => 
          item.html_original.includes(input.htmlFilename)
        );

        if (!pdiData) {
          throw new TRPCError({ 
            code: "NOT_FOUND", 
            message: `Dados não encontrados para ${input.htmlFilename}` 
          });
        }

        // Buscar ou criar funcionário
        let employee = await db
          .select()
          .from(employees)
          .where(eq(employees.name, pdiData.nome))
          .limit(1);

        let employeeId: number;
        
        if (employee.length === 0) {
          // Criar funcionário se não existir
          const employeeCode = `EMP_${Date.now()}`;
          const [newEmployee] = await db
            .insert(employees)
            .values({
              employeeCode: employeeCode,
              name: pdiData.nome,
              chapa: `IMPORT_${Date.now()}`, // Chapa temporária
              cargo: pdiData.cargo,
              status: "ativo",
            })
            .$returningId();
          
          employeeId = newEmployee.id;
        } else {
          employeeId = employee[0].id;
        }

        // Extrair duração em meses dos KPIs
        const durationMonths = pdiData.kpis["Plano de Performance"]
          ? parseInt(pdiData.kpis["Plano de Performance"].replace(/\D/g, "")) || 24
          : 24;

        // Criar data de início e fim
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // Criar PDI Plan
        const [plan] = await db
          .insert(pdiPlans)
          .values({
            cycleId: input.cycleId,
            employeeId: employeeId,
            status: "aprovado",
            startDate: startDate,
            endDate: endDate,
            overallProgress: 0,
          })
          .$returningId();

        // Ler conteúdo HTML original
        const htmlPath = path.join(process.cwd(), input.htmlFilename);
        const htmlContent = await fs.readFile(htmlPath, "utf-8");

        // Criar detalhes inteligentes do PDI
        await db.insert(pdiIntelligentDetails).values({
          planId: plan.id,
          importedFromHtml: true,
          htmlOriginalPath: htmlPath,
          htmlContent: htmlContent,
          importedAt: new Date(),
          importedBy: ctx.user.id,
          strategicContext: pdiData.foco_desenvolvimento || pdiData.estrategia_remuneracao?.justificativa || "",
          durationMonths: durationMonths,
          milestone12Months: "Primeiro ano de desenvolvimento concluído",
          milestone24Months: "Plano de desenvolvimento completo",
        });

        // Criar gaps de competências (se houver)
        if (pdiData.gaps_prioritarios && pdiData.gaps_prioritarios.length > 0) {
          // Buscar ou criar competências
          for (const gap of pdiData.gaps_prioritarios) {
            // Tentar encontrar competência existente
            let competency = await db
              .select()
              .from(competencies)
              .where(eq(competencies.name, gap.titulo))
              .limit(1);

            let competencyId: number;

            if (competency.length === 0) {
              // Criar competência se não existir
              const [newComp] = await db
                .insert(competencies)
                .values({
                  code: `COMP_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                  name: gap.titulo,
                  description: gap.descricao,
                  category: "tecnica",
                  isActive: true,
                })
                .$returningId();
              
              competencyId = newComp.id;
            } else {
              competencyId = competency[0].id;
            }

            // Criar gap de competência
            await db.insert(pdiCompetencyGaps).values({
              planId: plan.id,
              competencyId: competencyId,
              currentLevel: 2, // Nível médio
              targetLevel: 5, // Nível alto esperado
              gap: 3,
              priority: "alta",
              status: "identificado",
            });
          }
        }

        // Criar ações do PDI (modelo 70-20-10)
        const actions: any[] = [];

        // 70% - Prática
        if (pdiData.plano_acao["70_pratica"]) {
          for (const action of pdiData.plano_acao["70_pratica"]) {
            actions.push({
              planId: plan.id,
              title: action.substring(0, 100),
              description: action,
              axis: "70_pratica",
              status: "planejada",
              priority: "alta",
              progress: 0,
            });
          }
        }

        // 20% - Social
        if (pdiData.plano_acao["20_social"]) {
          for (const action of pdiData.plano_acao["20_social"]) {
            actions.push({
              planId: plan.id,
              title: action.substring(0, 100),
              description: action,
              axis: "20_experiencia",
              status: "planejada",
              priority: "media",
              progress: 0,
            });
          }
        }

        // 10% - Formal
        if (pdiData.plano_acao["10_formal"]) {
          for (const action of pdiData.plano_acao["10_formal"]) {
            actions.push({
              planId: plan.id,
              title: action.substring(0, 100),
              description: action,
              axis: "10_educacao",
              status: "planejada",
              priority: "baixa",
              progress: 0,
            });
          }
        }

        if (actions.length > 0) {
          await db.insert(pdiActions).values(actions);
        }

        return {
          success: true,
          planId: plan.id,
          employeeId: employeeId,
          employeeName: pdiData.nome,
          message: `PDI importado com sucesso para ${pdiData.nome}`,
        };
      } catch (error: any) {
        console.error("Erro ao importar PDI:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao importar PDI: ${error.message}`,
        });
      }
    }),

  /**
   * Listar PDIs disponíveis para importação
   */
  listAvailableImports: protectedProcedure.query(async () => {
    try {
      const dataPath = path.join(process.cwd(), "pdi_data.json");
      const jsonData = await fs.readFile(dataPath, "utf-8");
      const pdiDataArray = JSON.parse(jsonData);

      return pdiDataArray.map((item: any) => ({
        nome: item.nome,
        cargo: item.cargo,
        htmlFilename: path.basename(item.html_original),
        kpis: item.kpis,
        gaps_count: item.gaps_prioritarios?.length || 0,
        acoes_count: 
          (item.plano_acao["70_pratica"]?.length || 0) +
          (item.plano_acao["20_social"]?.length || 0) +
          (item.plano_acao["10_formal"]?.length || 0),
      }));
    } catch (error: any) {
      console.error("Erro ao listar PDIs disponíveis:", error);
      return [];
    }
  }),

  /**
   * Visualizar detalhes de um PDI antes de importar
   */
  previewImport: protectedProcedure
    .input(
      z.object({
        htmlFilename: z.enum(["PDI_Wilson3.html", "PDI_Fernando9.html"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const dataPath = path.join(process.cwd(), "pdi_data.json");
        const jsonData = await fs.readFile(dataPath, "utf-8");
        const pdiDataArray = JSON.parse(jsonData);

        const pdiData = pdiDataArray.find((item: any) => 
          item.html_original.includes(input.htmlFilename)
        );

        if (!pdiData) {
          throw new TRPCError({ 
            code: "NOT_FOUND", 
            message: `Dados não encontrados para ${input.htmlFilename}` 
          });
        }

        return pdiData;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao visualizar PDI: ${error.message}`,
        });
      }
    }),
});
