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
import { parsePDIHtml, type ParsedPDI } from "./pdiHtmlParser";
import { generatePDIHtml, type PDIData } from "./pdiHtmlGenerator";
import { sendPDIImportCompletedEmail } from "./pdiEmailService";

/**
 * Router para importação de PDI a partir de arquivos HTML
 */

export const pdiHtmlImportRouter = router({
  /**
   * Listar arquivos HTML de PDI disponíveis para importação
   */
  listAvailableImports: protectedProcedure.input(z.object({})).query(async () => {
    try {
      // Buscar arquivos HTML na pasta do projeto
      const projectPath = path.join(process.cwd());
      const files = await fs.readdir(projectPath);
      const htmlFiles = files.filter(f => f.startsWith('PDI_') && (f.endsWith('.html') || f.endsWith('.txt')));

      const availableImports = [];

      for (const file of htmlFiles) {
        try {
          const filePath = path.join(projectPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const parsed = parsePDIHtml(content);

          availableImports.push({
            htmlFilename: file,
            nome: parsed.employeeName || 'Nome não identificado',
            cargo: parsed.position || 'Cargo não identificado',
            gaps_count: parsed.competencyGaps?.length || 0,
            acoes_count: (parsed.actionPlan.onTheJob?.length || 0) + (parsed.actionPlan.social?.length || 0) + (parsed.actionPlan.formal?.length || 0),
          });
        } catch (error) {
          console.error(`Erro ao processar arquivo ${file}:`, error);
        }
      }

      return availableImports;
    } catch (error: any) {
      console.error('Erro ao listar arquivos disponíveis:', error);
      return [];
    }
  }),

  /**
   * Visualizar preview de um arquivo HTML antes de importar
   */
  previewImport: protectedProcedure
    .input(
      z.object({
        htmlFilename: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const projectPath = path.join(process.cwd());
        const filePath = path.join(projectPath, input.htmlFilename);
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = parsePDIHtml(content);

        return {
          nome: parsed.employeeName || 'Nome não identificado',
          cargo: parsed.position || 'Cargo não identificado',
          foco: parsed.developmentFocus || '',
          sponsor: parsed.sponsor || '',
          kpis: parsed.kpis,
          gaps_competencias: parsed.competencyGaps || [],
          plano_acao: {
            '70_pratica': parsed.actionPlan.onTheJob || [],
            '20_social': parsed.actionPlan.social || [],
            '10_formal': parsed.actionPlan.formal || [],
          },
          trilha_remuneracao: parsed.compensationTrack || [],
          responsabilidades: parsed.responsibilityPact || {},
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao visualizar preview: ${error.message}`,
        });
      }
    }),

  /**
   * Importar PDI a partir de nome de arquivo HTML
   */
  importFromHtml: protectedProcedure
    .input(
      z.object({
        htmlFilename: z.string(),
        cycleId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Validar que o usuário está autenticado
      if (!ctx.user || !ctx.user.id) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Usuário não encontrado. Por favor, faça login novamente." 
        });
      }

      try {
        // Ler arquivo HTML
        const projectPath = path.join(process.cwd());
        const filePath = path.join(projectPath, input.htmlFilename);
        const htmlContent = await fs.readFile(filePath, 'utf-8');

        // Fazer parse do HTML usando o novo parser
        const pdiData = parsePDIHtml(htmlContent);

        if (!pdiData.employeeName) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Não foi possível extrair o nome do colaborador do HTML" 
          });
        }

        // Buscar ou criar funcionário
        let employee = await db
          .select()
          .from(employees)
          .where(eq(employees.name, pdiData.employeeName))
          .limit(1);

        let employeeId: number;
        
        if (employee.length === 0) {
          // Criar funcionário se não existir
          const employeeCode = `EMP_${Date.now()}`;
          const [newEmployee] = await db
            .insert(employees)
            .values({
              employeeCode: employeeCode,
              name: pdiData.employeeName,
              chapa: `IMPORT_${Date.now()}`, // Chapa temporária
              cargo: pdiData.position,
              status: "ativo",
            })
            .$returningId();
          
          employeeId = newEmployee.id;
        } else {
          employeeId = employee[0].id;
        }

        // Extrair duração em meses dos KPIs
        const durationMonths = pdiData.kpis.planDuration
          ? parseInt(pdiData.kpis.planDuration.replace(/\D/g, "")) || 24
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

        // Criar detalhes inteligentes do PDI
        await db.insert(pdiIntelligentDetails).values({
          planId: plan.id,
          importedFromHtml: true,
          htmlOriginalPath: input.htmlFilename,
          htmlContent: htmlContent,
          importedAt: new Date(),
          importedBy: ctx.user.id,
          strategicContext: pdiData.developmentFocus || "",
          durationMonths: durationMonths,
          milestone12Months: "Primeiro ano de desenvolvimento concluído",
          milestone24Months: "Plano de desenvolvimento completo",
        });

        // Criar gaps de competências (se houver)
        const gaps = [];
        if (pdiData.competencyGaps && pdiData.competencyGaps.length > 0) {
          // Buscar ou criar competências
          for (const gap of pdiData.competencyGaps) {
            // Tentar encontrar competência existente
            let competency = await db
              .select()
              .from(competencies)
              .where(eq(competencies.name, gap.title))
              .limit(1);

            let competencyId: number;

            if (competency.length === 0) {
              // Criar competência se não existir
              const [newComp] = await db
                .insert(competencies)
                .values({
                  code: `COMP_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                  name: gap.title,
                  description: gap.description,
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
            
            gaps.push({ competencyId });
          }
        }

        // Criar ações do PDI (modelo 70-20-10)
        const actions: any[] = [];

        // 70% - Prática
        if (pdiData.actionPlan.onTheJob && pdiData.actionPlan.onTheJob.length > 0) {
          for (const action of pdiData.actionPlan.onTheJob) {
            const dueDate = new Date(endDate);
            dueDate.setMonth(dueDate.getMonth() - 6); // 6 meses antes do fim do PDI
            
            actions.push({
              planId: plan.id,
              title: action.substring(0, 100),
              description: action,
              axis: "70_pratica",
              developmentArea: pdiData.developmentFocus?.substring(0, 100) || "Desenvolvimento Profissional",
              successMetric: "Conclusão da ação e aplicação prática",
              responsible: pdiData.sponsor || "Líder Direto",
              dueDate: dueDate,
              status: "nao_iniciado",
              priority: "alta",
              progress: 0,
            });
          }
        }

        // 20% - Social
        if (pdiData.actionPlan.social && pdiData.actionPlan.social.length > 0) {
          for (const action of pdiData.actionPlan.social) {
            const dueDate = new Date(endDate);
            dueDate.setMonth(dueDate.getMonth() - 12); // 12 meses antes do fim do PDI
            
            actions.push({
              planId: plan.id,
              title: action.substring(0, 100),
              description: action,
              axis: "20_experiencia",
              developmentArea: pdiData.developmentFocus?.substring(0, 100) || "Desenvolvimento Profissional",
              successMetric: "Aplicação de aprendizados sociais",
              responsible: pdiData.sponsor || "DHO",
              dueDate: dueDate,
              status: "nao_iniciado",
              priority: "media",
              progress: 0,
            });
          }
        }

        // 10% - Formal
        if (pdiData.actionPlan.formal && pdiData.actionPlan.formal.length > 0) {
          for (const action of pdiData.actionPlan.formal) {
            const dueDate = new Date(endDate);
            dueDate.setMonth(dueDate.getMonth() - 18); // 18 meses antes do fim do PDI
            
            actions.push({
              planId: plan.id,
              title: action.substring(0, 100),
              description: action,
              axis: "10_educacao",
              developmentArea: pdiData.developmentFocus?.substring(0, 100) || "Desenvolvimento Profissional",
              successMetric: "Conclusão do treinamento formal",
              responsible: "DHO",
              dueDate: dueDate,
              status: "nao_iniciado",
              priority: "baixa",
              progress: 0,
            });
          }
        }

        if (actions.length > 0) {
          await db.insert(pdiActions).values(actions);
        }

        // Enviar email de notificação
        try {
          await sendPDIImportCompletedEmail({
            employeeName: pdiData.employeeName,
            employeeEmail: employee.length > 0 ? employee[0].email : undefined,
            pdiId: plan.id,
            importedBy: ctx.user?.name || "Sistema",
            importDate: new Date(),
            totalGaps: gaps.length,
            totalActions: actions.length,
          });
        } catch (emailError) {
          console.error("Erro ao enviar email de PDI importado:", emailError);
          // Não falhar a importação se o email falhar
        }

        return {
          success: true,
          planId: plan.id,
          employeeId: employeeId,
          employeeName: pdiData.employeeName,
          message: `PDI importado com sucesso para ${pdiData.employeeName}`,
        };
      } catch (error: any) {
        console.error("Erro ao importar PDI:", error);
        
        // Enviar email de notificação de falha
        try {
          const { sendEmail } = await import('./_core/email');
          
          // Enviar para o usuário que tentou importar
          if (ctx.user?.email) {
            await sendEmail({
              to: ctx.user.email,
              subject: '⚠️ Falha na Importação de PDI',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #dc2626;">⚠️ Falha na Importação de PDI</h2>
                  
                  <p>Olá <strong>${ctx.user.name}</strong>,</p>
                  
                  <p>A importação do arquivo PDI HTML falhou:</p>
                  
                  <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                    <p><strong>Arquivo:</strong> ${input.htmlFilename || input.filename || 'arquivo HTML'}</p>
                    <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                    <p><strong>Erro:</strong> ${error.message}</p>
                  </div>
                  
                  <p><strong>Possíveis Soluções:</strong></p>
                  <ul style="line-height: 1.8;">
                    <li>Verifique se o arquivo HTML está no formato correto</li>
                    <li>Certifique-se de que o arquivo contém todas as informações necessárias</li>
                    <li>Tente novamente ou entre em contato com o suporte</li>
                  </ul>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px;">Esta é uma notificação automática do Sistema AVD UISA.</p>
                </div>
              `,
            });
          }
        } catch (emailError) {
          console.error('[PDI] Erro ao enviar email de falha de importação:', emailError);
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao importar PDI: ${error.message}`,
        });
      }
    }),

  /**
   * Importar PDI a partir de conteúdo HTML (método alternativo)
   */
  importFromHtmlContent: protectedProcedure
    .input(
      z.object({
        htmlContent: z.string(),
        cycleId: z.number(),
        filename: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Validar que o usuário está autenticado
      if (!ctx.user || !ctx.user.id) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Usuário não encontrado. Por favor, faça login novamente." 
        });
      }

      try {
        // Fazer parse do HTML usando o novo parser
        const pdiData = parsePDIHtml(input.htmlContent);

        if (!pdiData.employeeName) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Não foi possível extrair o nome do colaborador do HTML" 
          });
        }

        // Buscar ou criar funcionário
        let employee = await db
          .select()
          .from(employees)
          .where(eq(employees.name, pdiData.employeeName))
          .limit(1);

        let employeeId: number;
        
        if (employee.length === 0) {
          // Criar funcionário se não existir
          const employeeCode = `EMP_${Date.now()}`;
          const [newEmployee] = await db
            .insert(employees)
            .values({
              employeeCode: employeeCode,
              name: pdiData.employeeName,
              chapa: `IMPORT_${Date.now()}`, // Chapa temporária
              cargo: pdiData.position,
              status: "ativo",
            })
            .$returningId();
          
          employeeId = newEmployee.id;
        } else {
          employeeId = employee[0].id;
        }

        // Extrair duração em meses dos KPIs
        const durationMonths = pdiData.kpis.planDuration
          ? parseInt(pdiData.kpis.planDuration.replace(/\D/g, "")) || 24
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

        // Usar o HTML fornecido
        const htmlContent = input.htmlContent;
        const htmlPath = input.filename || `imported_${Date.now()}.html`;

        // Criar detalhes inteligentes do PDI
        await db.insert(pdiIntelligentDetails).values({
          planId: plan.id,
          importedFromHtml: true,
          htmlOriginalPath: htmlPath,
          htmlContent: htmlContent,
          importedAt: new Date(),
          importedBy: ctx.user.id,
          strategicContext: pdiData.developmentFocus || "",
          durationMonths: durationMonths,
          milestone12Months: "Primeiro ano de desenvolvimento concluído",
          milestone24Months: "Plano de desenvolvimento completo",
        });

        // Criar gaps de competências (se houver)
        if (pdiData.competencyGaps && pdiData.competencyGaps.length > 0) {
          // Buscar ou criar competências
          for (const gap of pdiData.competencyGaps) {
            // Tentar encontrar competência existente
            let competency = await db
              .select()
              .from(competencies)
              .where(eq(competencies.name, gap.title))
              .limit(1);

            let competencyId: number;

            if (competency.length === 0) {
              // Criar competência se não existir
              const [newComp] = await db
                .insert(competencies)
                .values({
                  code: `COMP_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                  name: gap.title,
                  description: gap.description,
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
        if (pdiData.actionPlan.onTheJob && pdiData.actionPlan.onTheJob.length > 0) {
          for (const action of pdiData.actionPlan.onTheJob) {
            const dueDate = new Date(endDate);
            dueDate.setMonth(dueDate.getMonth() - 6); // 6 meses antes do fim do PDI
            
            actions.push({
              planId: plan.id,
              title: action.substring(0, 100),
              description: action,
              axis: "70_pratica",
              developmentArea: pdiData.developmentFocus?.substring(0, 100) || "Desenvolvimento Profissional",
              successMetric: "Conclusão da ação e aplicação prática",
              responsible: pdiData.sponsor || "Líder Direto",
              dueDate: dueDate,
              status: "nao_iniciado",
              priority: "alta",
              progress: 0,
            });
          }
        }

        // 20% - Social
        if (pdiData.actionPlan.social && pdiData.actionPlan.social.length > 0) {
          for (const action of pdiData.actionPlan.social) {
            const dueDate = new Date(endDate);
            dueDate.setMonth(dueDate.getMonth() - 12); // 12 meses antes do fim do PDI
            
            actions.push({
              planId: plan.id,
              title: action.substring(0, 100),
              description: action,
              axis: "20_experiencia",
              developmentArea: pdiData.developmentFocus?.substring(0, 100) || "Desenvolvimento Profissional",
              successMetric: "Aplicação de aprendizados sociais",
              responsible: pdiData.sponsor || "DHO",
              dueDate: dueDate,
              status: "nao_iniciado",
              priority: "media",
              progress: 0,
            });
          }
        }

        // 10% - Formal
        if (pdiData.actionPlan.formal && pdiData.actionPlan.formal.length > 0) {
          for (const action of pdiData.actionPlan.formal) {
            const dueDate = new Date(endDate);
            dueDate.setMonth(dueDate.getMonth() - 18); // 18 meses antes do fim do PDI
            
            actions.push({
              planId: plan.id,
              title: action.substring(0, 100),
              description: action,
              axis: "10_educacao",
              developmentArea: pdiData.developmentFocus?.substring(0, 100) || "Desenvolvimento Profissional",
              successMetric: "Conclusão do treinamento formal",
              responsible: "DHO",
              dueDate: dueDate,
              status: "nao_iniciado",
              priority: "baixa",
              progress: 0,
            });
          }
        }

        if (actions.length > 0) {
          await db.insert(pdiActions).values(actions);
        }

        // Enviar email de notificação
        try {
          await sendPDIImportCompletedEmail({
            employeeName: pdiData.employeeName,
            employeeEmail: employee.length > 0 ? employee[0].email : undefined,
            pdiId: plan.id,
            importedBy: ctx.user?.name || "Sistema",
            importDate: new Date(),
            totalGaps: gaps.length,
            totalActions: actions.length,
          });
        } catch (emailError) {
          console.error("Erro ao enviar email de PDI importado:", emailError);
          // Não falhar a importação se o email falhar
        }

        return {
          success: true,
          planId: plan.id,
          employeeId: employeeId,
          employeeName: pdiData.employeeName,
          message: `PDI importado com sucesso para ${pdiData.employeeName}`,
        };
      } catch (error: any) {
        console.error("Erro ao importar PDI:", error);
        
        // Enviar email de notificação de falha
        try {
          const { sendEmail } = await import('./_core/email');
          
          // Enviar para o usuário que tentou importar
          if (ctx.user?.email) {
            await sendEmail({
              to: ctx.user.email,
              subject: '⚠️ Falha na Importação de PDI',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #dc2626;">⚠️ Falha na Importação de PDI</h2>
                  
                  <p>Olá <strong>${ctx.user.name}</strong>,</p>
                  
                  <p>A importação do arquivo PDI HTML falhou:</p>
                  
                  <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                    <p><strong>Arquivo:</strong> ${input.htmlFilename || input.filename || 'arquivo HTML'}</p>
                    <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                    <p><strong>Erro:</strong> ${error.message}</p>
                  </div>
                  
                  <p><strong>Possíveis Soluções:</strong></p>
                  <ul style="line-height: 1.8;">
                    <li>Verifique se o arquivo HTML está no formato correto</li>
                    <li>Certifique-se de que o arquivo contém todas as informações necessárias</li>
                    <li>Tente novamente ou entre em contato com o suporte</li>
                  </ul>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px;">Esta é uma notificação automática do Sistema AVD UISA.</p>
                </div>
              `,
            });
          }
        } catch (emailError) {
          console.error('[PDI] Erro ao enviar email de falha de importação:', emailError);
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao importar PDI: ${error.message}`,
        });
      }
    }),

  /**
   * Listar PDIs já importados
   */
  listImportedPDIs: protectedProcedure.input(z.object({})).query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    try {
      const importedPDIs = await db
        .select({
          planId: pdiPlans.id,
          employeeId: employees.id,
          employeeName: employees.name,
          position: employees.cargo,
          status: pdiPlans.status,
          startDate: pdiPlans.startDate,
          endDate: pdiPlans.endDate,
          importedAt: pdiIntelligentDetails.importedAt,
          importedFromHtml: pdiIntelligentDetails.importedFromHtml,
        })
        .from(pdiPlans)
        .leftJoin(employees, eq(pdiPlans.employeeId, employees.id))
        .leftJoin(pdiIntelligentDetails, eq(pdiIntelligentDetails.planId, pdiPlans.id))
        .where(eq(pdiIntelligentDetails.importedFromHtml, true));

      return importedPDIs;
    } catch (error: any) {
      console.error("Erro ao listar PDIs importados:", error);
      return [];
    }
  }),

  /**
   * Visualizar preview de um HTML antes de importar
   */
  previewHtml: protectedProcedure
    .input(
      z.object({
        htmlContent: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const pdiData = parsePDIHtml(input.htmlContent);
        return pdiData;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao fazer parse do HTML: ${error.message}`,
        });
      }
    }),

  /**
   * Gerar HTML de PDI a partir dos dados do banco
   */
  generateHtml: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Buscar dados do PDI
        const plan = await db
          .select()
          .from(pdiPlans)
          .where(eq(pdiPlans.id, input.planId))
          .limit(1);

        if (plan.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "PDI não encontrado" });
        }

        // Buscar funcionário
        const employee = await db
          .select()
          .from(employees)
          .where(eq(employees.id, plan[0].employeeId))
          .limit(1);

        if (employee.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
        }

        // Buscar detalhes inteligentes
        const details = await db
          .select()
          .from(pdiIntelligentDetails)
          .where(eq(pdiIntelligentDetails.planId, input.planId))
          .limit(1);

        // Buscar gaps de competências
        const gaps = await db
          .select({
            id: pdiCompetencyGaps.id,
            competencyName: competencies.name,
            competencyDescription: competencies.description,
            currentLevel: pdiCompetencyGaps.currentLevel,
            targetLevel: pdiCompetencyGaps.targetLevel,
            gap: pdiCompetencyGaps.gap,
            priority: pdiCompetencyGaps.priority,
          })
          .from(pdiCompetencyGaps)
          .leftJoin(competencies, eq(pdiCompetencyGaps.competencyId, competencies.id))
          .where(eq(pdiCompetencyGaps.planId, input.planId));

        // Buscar ações do PDI
        const actions = await db
          .select()
          .from(pdiActions)
          .where(eq(pdiActions.planId, input.planId));

        // Se foi importado de HTML, retornar o HTML original
        if (details.length > 0 && details[0].htmlContent) {
          return {
            html: details[0].htmlContent,
            isOriginal: true,
          };
        }

        // Caso contrário, gerar novo HTML a partir dos dados
        const pdiData: PDIData = {
          employeeName: employee[0].name,
          position: employee[0].cargo || "Não especificado",
          developmentFocus: details.length > 0 ? details[0].developmentFocus || "Desenvolvimento profissional" : "Desenvolvimento profissional",
          sponsorName: details.length > 0 ? details[0].sponsorName || "Não especificado" : "Não especificado",
          kpis: {
            currentPosition: employee[0].cargo || "Não especificado",
            reframing: details.length > 0 ? details[0].reframingTimeline || "A definir" : "A definir",
            newPosition: details.length > 0 ? details[0].targetPosition || "A definir" : "A definir",
            planDuration: details.length > 0 ? details[0].planDuration || "12 meses" : "12 meses",
          },
          competencyGaps: gaps.map(gap => ({
            title: gap.competencyName || "Competência",
            description: `Nível atual: ${gap.currentLevel || 0}, Nível alvo: ${gap.targetLevel || 0}, Gap: ${gap.gap || 0}`,
          })),
          competencyChart: {
            labels: gaps.map(gap => gap.competencyName || "Competência"),
            currentProfile: gaps.map(gap => gap.currentLevel || 0),
            targetProfile: gaps.map(gap => gap.targetLevel || 0),
          },
          compensationTrack: [],
          actionPlan: {
            onTheJob: actions.filter(a => a.type === "70_on_the_job").map(a => a.description),
            social: actions.filter(a => a.type === "20_social").map(a => a.description),
            formal: actions.filter(a => a.type === "10_formal").map(a => a.description),
          },
          responsibilityPact: {
            employee: details.length > 0 && details[0].employeeResponsibilities ? JSON.parse(details[0].employeeResponsibilities) : [],
            leadership: details.length > 0 && details[0].leadershipResponsibilities ? JSON.parse(details[0].leadershipResponsibilities) : [],
            dho: details.length > 0 && details[0].dhoResponsibilities ? JSON.parse(details[0].dhoResponsibilities) : [],
          },
        };

        const generatedHtml = generatePDIHtml(pdiData);
        return {
          html: generatedHtml,
          isOriginal: false,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar HTML: ${error.message}`,
        });
      }
    }),
});
