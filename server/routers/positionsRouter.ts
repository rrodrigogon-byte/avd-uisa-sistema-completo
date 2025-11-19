import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

// Schema de validação
const createPositionSchema = z.object({
  code: z.string().min(3, "Código deve ter no mínimo 3 caracteres"),
  title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
  description: z.string().min(20, "Descrição deve ter no mínimo 20 caracteres"),
  level: z.enum(["junior", "pleno", "senior", "especialista", "coordenador", "gerente", "diretor"]),
  departmentId: z.number().optional(),
  salaryMin: z.number().min(0, "Salário mínimo deve ser maior que 0"),
  salaryMax: z.number().min(0, "Salário máximo deve ser maior que 0"),
});

const updatePositionSchema = createPositionSchema.partial().extend({
  id: z.number(),
});

export const positionsRouter = router({
  // Listar todos os cargos
  list: protectedProcedure.query(async () => {
    // Mock data - em produção viria do banco
    return [
      {
        id: 1,
        code: "DEV-001",
        title: "Desenvolvedor Full Stack",
        description: "Responsável pelo desenvolvimento de aplicações web completas, desde o frontend até o backend.",
        level: "pleno" as const,
        department: "Tecnologia",
        departmentId: 1,
        salaryMin: 8000,
        salaryMax: 12000,
        active: true,
      },
      {
        id: 2,
        code: "GER-001",
        title: "Gerente de Projetos",
        description: "Gerencia projetos de TI, coordena equipes e garante a entrega dentro do prazo e orçamento.",
        level: "gerente" as const,
        department: "Tecnologia",
        departmentId: 1,
        salaryMin: 15000,
        salaryMax: 20000,
        active: true,
      },
      {
        id: 3,
        code: "ANA-001",
        title: "Analista de RH",
        description: "Realiza processos de recrutamento, seleção e desenvolvimento de pessoas.",
        level: "pleno" as const,
        department: "Recursos Humanos",
        departmentId: 2,
        salaryMin: 6000,
        salaryMax: 9000,
        active: true,
      },
    ];
  }),

  // Buscar cargo por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // Mock data - em produção viria do banco
      const positions = [
        {
          id: 1,
          code: "DEV-001",
          title: "Desenvolvedor Full Stack",
          description: "Responsável pelo desenvolvimento de aplicações web completas, desde o frontend até o backend.",
          level: "pleno" as const,
          department: "Tecnologia",
          departmentId: 1,
          salaryMin: 8000,
          salaryMax: 12000,
          active: true,
        },
      ];

      const position = positions.find((p) => p.id === input.id);
      if (!position) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cargo não encontrado",
        });
      }

      return position;
    }),

  // Criar novo cargo
  create: protectedProcedure
    .input(createPositionSchema)
    .mutation(async ({ input, ctx }) => {
      // Verificar se usuário tem permissão (RH ou Admin)
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e Administradores podem criar cargos",
        });
      }

      // Validar faixa salarial
      if (input.salaryMax < input.salaryMin) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Salário máximo deve ser maior que o salário mínimo",
        });
      }

      // Em produção, salvar no banco de dados
      console.log("[Positions] Criando cargo:", input);

      return {
        id: Math.floor(Math.random() * 10000),
        ...input,
        department: "Tecnologia", // Em produção, buscar do banco
        active: true,
      };
    }),

  // Atualizar cargo
  update: protectedProcedure
    .input(updatePositionSchema)
    .mutation(async ({ input, ctx }) => {
      // Verificar se usuário tem permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e Administradores podem atualizar cargos",
        });
      }

      // Validar faixa salarial se ambos forem fornecidos
      if (input.salaryMin && input.salaryMax && input.salaryMax < input.salaryMin) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Salário máximo deve ser maior que o salário mínimo",
        });
      }

      // Em produção, atualizar no banco de dados
      console.log("[Positions] Atualizando cargo:", input);

      return {
        success: true,
        message: "Cargo atualizado com sucesso!",
      };
    }),

  // Excluir cargo (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se usuário tem permissão
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas RH e Administradores podem excluir cargos",
        });
      }

      // Em produção, fazer soft delete no banco
      console.log("[Positions] Excluindo cargo:", input.id);

      return {
        success: true,
        message: "Cargo excluído com sucesso!",
      };
    }),

  // Obter estatísticas de cargos
  getStats: protectedProcedure.query(async () => {
    // Mock data - em produção viria do banco
    return {
      total: 3,
      active: 3,
      byLevel: {
        junior: 0,
        pleno: 2,
        senior: 0,
        especialista: 0,
        coordenador: 0,
        gerente: 1,
        diretor: 0,
      },
      avgSalary: 11666,
      departments: 2,
    };
  }),
});
