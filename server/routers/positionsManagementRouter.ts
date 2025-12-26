import { z } from "zod";
import { protectedProcedure, router, adminProcedure } from "../_core/trpc";
import {
  listPositionsWithFilters,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition,
} from "../db";

/**
 * Router para gestão completa de cargos
 * Inclui CRUD e funcionalidades de descrição de cargo
 */
export const positionsManagementRouter = router({
  /**
   * Listar todos os cargos com filtros
   */
  list: protectedProcedure
    .input(
      z.object({
        departmentId: z.number().optional(),
        level: z.string().optional(),
        active: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input = {} }) => {
      return await listPositionsWithFilters(input);
    }),

  /**
   * Buscar cargo por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getPositionById(input.id);
    }),

  /**
   * Criar novo cargo
   */
  create: adminProcedure
    .input(
      z.object({
        code: z.string().min(1, "Código é obrigatório"),
        title: z.string().min(1, "Título é obrigatório"),
        description: z.string().optional(),
        level: z.enum(["junior", "pleno", "senior", "especialista", "coordenador", "gerente", "diretor"]).optional(),
        departmentId: z.number().optional(),
        salaryMin: z.number().optional(),
        salaryMax: z.number().optional(),
        
        // Campos UISA - Descrição Completa
        mission: z.string().optional(),
        responsibilities: z.array(z.string()).optional(),
        technicalCompetencies: z.array(z.string()).optional(),
        behavioralCompetencies: z.array(z.string()).optional(),
        requirements: z.object({
          education: z.string().optional(),
          experience: z.string().optional(),
          certifications: z.array(z.string()).optional(),
        }).optional(),
        kpis: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
            target: z.string().optional(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const positionId = await createPosition({
        ...input,
        active: true,
      });

      return {
        success: true,
        positionId,
        message: "Cargo criado com sucesso",
      };
    }),

  /**
   * Atualizar cargo existente
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        code: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        level: z.enum(["junior", "pleno", "senior", "especialista", "coordenador", "gerente", "diretor"]).optional(),
        departmentId: z.number().optional(),
        salaryMin: z.number().optional(),
        salaryMax: z.number().optional(),
        
        // Campos UISA
        mission: z.string().optional(),
        responsibilities: z.array(z.string()).optional(),
        technicalCompetencies: z.array(z.string()).optional(),
        behavioralCompetencies: z.array(z.string()).optional(),
        requirements: z.object({
          education: z.string().optional(),
          experience: z.string().optional(),
          certifications: z.array(z.string()).optional(),
        }).optional(),
        kpis: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
            target: z.string().optional(),
          })
        ).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updatePosition(id, data);

      return {
        success: true,
        message: "Cargo atualizado com sucesso",
      };
    }),

  /**
   * Desativar cargo
   */
  deactivate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deletePosition(input.id);

      return {
        success: true,
        message: "Cargo desativado com sucesso",
      };
    }),

  /**
   * Importação em massa de cargos via CSV
   */
  bulkImportCSV: adminProcedure
    .input(
      z.object({
        csvContent: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const lines = input.csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error("Arquivo CSV vazio");
      }

      // Parsear headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
      const rows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      const results: any[] = [];
      let successCount = 0;

      for (const row of rows) {
        try {
          // Mapear colunas
          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index] || '';
          });

          // Validar campos obrigatórios
          if (!rowData['codigo'] || !rowData['titulo']) {
            results.push({
              code: rowData['codigo'] || 'N/A',
              title: rowData['titulo'] || 'N/A',
              success: false,
              error: 'Código e título são obrigatórios',
            });
            continue;
          }

          // Parsear listas (separadas por ponto e vírgula)
          const parseList = (str: string): string[] => {
            if (!str) return [];
            return str.split(';').map(s => s.trim()).filter(Boolean);
          };

          // Criar cargo
          const positionData: any = {
            code: rowData['codigo'],
            title: rowData['titulo'],
            description: rowData['descricao'] || '',
            level: rowData['nivel'] as any || undefined,
            mission: rowData['missao'] || '',
            responsibilities: parseList(rowData['responsabilidades']),
            technicalCompetencies: parseList(rowData['competencias_tecnicas']),
            behavioralCompetencies: parseList(rowData['competencias_comportamentais']),
            active: true,
          };

          const positionId = await createPosition(positionData);

          results.push({
            code: rowData['codigo'],
            title: rowData['titulo'],
            success: true,
            message: `Cargo criado com ID ${positionId}`,
          });
          successCount++;
        } catch (error: any) {
          results.push({
            code: row[0] || 'N/A',
            title: row[1] || 'N/A',
            success: false,
            error: error.message || 'Erro desconhecido',
          });
        }
      }

      return {
        success: successCount,
        failed: results.length - successCount,
        total: results.length,
        results,
      };
    }),

  /**
   * Estatísticas de cargos
   */
  stats: protectedProcedure
    .query(async () => {
      const allPositions = await listPositionsWithFilters();
      const activePositions = allPositions.filter(p => p.active);
      
      const byLevel = allPositions.reduce((acc, pos) => {
        const level = pos.level || 'não_definido';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byDepartment = allPositions.reduce((acc, pos) => {
        const dept = pos.departmentId || 0;
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      return {
        total: allPositions.length,
        active: activePositions.length,
        inactive: allPositions.length - activePositions.length,
        byLevel,
        byDepartment,
      };
    }),
});
