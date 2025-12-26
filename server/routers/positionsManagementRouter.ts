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
