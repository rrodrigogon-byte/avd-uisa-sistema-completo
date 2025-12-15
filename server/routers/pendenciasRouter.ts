import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Router de Pendências
 * Gerenciamento de tarefas e pendências do sistema
 */
export const pendenciasRouter = router({
  /**
   * Listar todas as pendências com filtros opcionais
   */
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["pendente", "em_andamento", "concluida", "cancelada"]).optional(),
          prioridade: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
          responsavelId: z.number().optional(),
          categoria: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      // Se não for admin/rh, mostrar apenas pendências do usuário
      const employee = await db.getUserEmployee(ctx.user.id);
      
      const filters = input || {};
      
      // Se não for admin/rh, filtrar por responsável
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh" && employee) {
        filters.responsavelId = employee.id;
      }
      
      return await db.getAllPendencias(filters);
    }),

  /**
   * Buscar pendência por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const pendencia = await db.getPendenciaById(input.id);
      
      if (!pendencia) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pendência não encontrada",
        });
      }
      
      // Verificar permissão
      const employee = await db.getUserEmployee(ctx.user.id);
      if (
        ctx.user.role !== "admin" &&
        ctx.user.role !== "rh" &&
        employee &&
        pendencia.responsavelId !== employee.id &&
        pendencia.criadoPorId !== ctx.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para visualizar esta pendência",
        });
      }
      
      return pendencia;
    }),

  /**
   * Criar nova pendência
   */
  create: protectedProcedure
    .input(
      z.object({
        titulo: z.string().min(1, "Título é obrigatório"),
        descricao: z.string().optional(),
        status: z.enum(["pendente", "em_andamento", "concluida", "cancelada"]).default("pendente"),
        prioridade: z.enum(["baixa", "media", "alta", "urgente"]).default("media"),
        responsavelId: z.number(),
        dataVencimento: z.string().optional(),
        dataInicio: z.string().optional(),
        categoria: z.string().optional(),
        tags: z.string().optional(),
        avaliacaoId: z.number().optional(),
        metaId: z.number().optional(),
        pdiId: z.number().optional(),
        funcionarioId: z.number().optional(),
        progresso: z.number().min(0).max(100).default(0),
        observacoes: z.string().optional(),
        anexos: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const data = {
        ...input,
        criadoPorId: ctx.user.id,
        dataVencimento: input.dataVencimento ? new Date(input.dataVencimento) : undefined,
        dataInicio: input.dataInicio ? new Date(input.dataInicio) : undefined,
      };
      
      return await db.createPendencia(data);
    }),

  /**
   * Atualizar pendência
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        titulo: z.string().min(1).optional(),
        descricao: z.string().optional(),
        status: z.enum(["pendente", "em_andamento", "concluida", "cancelada"]).optional(),
        prioridade: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
        responsavelId: z.number().optional(),
        dataVencimento: z.string().optional(),
        dataInicio: z.string().optional(),
        dataConclusao: z.string().optional(),
        categoria: z.string().optional(),
        tags: z.string().optional(),
        progresso: z.number().min(0).max(100).optional(),
        observacoes: z.string().optional(),
        anexos: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      
      // Verificar se pendência existe e permissão
      const pendencia = await db.getPendenciaById(id);
      if (!pendencia) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pendência não encontrada",
        });
      }
      
      const employee = await db.getUserEmployee(ctx.user.id);
      if (
        ctx.user.role !== "admin" &&
        ctx.user.role !== "rh" &&
        employee &&
        pendencia.responsavelId !== employee.id &&
        pendencia.criadoPorId !== ctx.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar esta pendência",
        });
      }
      
      // Converter datas
      const data: any = { ...updateData };
      if (updateData.dataVencimento) {
        data.dataVencimento = new Date(updateData.dataVencimento);
      }
      if (updateData.dataInicio) {
        data.dataInicio = new Date(updateData.dataInicio);
      }
      if (updateData.dataConclusao) {
        data.dataConclusao = new Date(updateData.dataConclusao);
      }
      
      // Se status mudou para concluída, definir data de conclusão
      if (updateData.status === "concluida" && !data.dataConclusao) {
        data.dataConclusao = new Date();
        data.progresso = 100;
      }
      
      return await db.updatePendencia(id, data);
    }),

  /**
   * Excluir pendência
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se pendência existe e permissão
      const pendencia = await db.getPendenciaById(input.id);
      if (!pendencia) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pendência não encontrada",
        });
      }
      
      // Apenas admin, rh ou criador pode excluir
      if (
        ctx.user.role !== "admin" &&
        ctx.user.role !== "rh" &&
        pendencia.criadoPorId !== ctx.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para excluir esta pendência",
        });
      }
      
      return await db.deletePendencia(input.id);
    }),

  /**
   * Contar pendências por status
   */
  countByStatus: protectedProcedure.query(async ({ ctx }) => {
    const employee = await db.getUserEmployee(ctx.user.id);
    
    // Se não for admin/rh, contar apenas do usuário
    const responsavelId =
      ctx.user.role !== "admin" && ctx.user.role !== "rh" && employee
        ? employee.id
        : undefined;
    
    return await db.countPendenciasByStatus(responsavelId);
  }),

  /**
   * Buscar pendências do responsável
   */
  myPendencias: protectedProcedure.query(async ({ ctx }) => {
    const employee = await db.getUserEmployee(ctx.user.id);
    
    if (!employee) {
      return [];
    }
    
    return await db.getPendenciasByResponsavel(employee.id);
  }),
});
