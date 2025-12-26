import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { notificationTemplates, InsertNotificationTemplate } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { sendNotificationToUser } from "./websocket";

/**
 * Router para gerenciamento de templates de notificações personalizadas
 * Permite criar, editar, listar e testar templates com variáveis dinâmicas
 */
export const notificationTemplatesRouter = router({
  /**
   * Listar todos os templates de notificações
   */
  list: adminProcedure.input(z.object({})).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const templates = await db
      .select()
      .from(notificationTemplates)
      .orderBy(desc(notificationTemplates.createdAt));

    return templates;
  }),

  /**
   * Obter template específico por ID
   */
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [template] = await db
        .select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" });
      }

      return template;
    }),

  /**
   * Listar templates por tipo de evento
   */
  listByEvent: protectedProcedure
    .input(z.object({ eventType: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const templates = await db
        .select()
        .from(notificationTemplates)
        .where(
          and(
            eq(notificationTemplates.eventType, input.eventType),
            eq(notificationTemplates.active, "yes")
          )
        )
        .orderBy(desc(notificationTemplates.createdAt));

      return templates;
    }),

  /**
   * Criar novo template de notificação
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
        description: z.string().optional(),
        eventType: z.string().min(1, "Tipo de evento é obrigatório"),
        title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
        message: z.string().min(10, "Mensagem deve ter no mínimo 10 caracteres"),
        link: z.string().optional(),
        priority: z.enum(["baixa", "media", "alta", "critica"]).default("media"),
        active: z.enum(["yes", "no"]).default("yes"),
        sendEmail: z.enum(["yes", "no"]).default("no"),
        sendPush: z.enum(["yes", "no"]).default("yes"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const newTemplate: InsertNotificationTemplate = {
        name: input.name,
        description: input.description || null,
        eventType: input.eventType,
        title: input.title,
        message: input.message,
        link: input.link || null,
        priority: input.priority,
        active: input.active,
        sendEmail: input.sendEmail,
        sendPush: input.sendPush,
        createdBy: ctx.user.id,
      };

      const [result] = await db.insert(notificationTemplates).values(newTemplate);

      return { success: true, id: result.insertId };
    }),

  /**
   * Atualizar template existente
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(3).optional(),
        description: z.string().optional(),
        eventType: z.string().optional(),
        title: z.string().min(3).optional(),
        message: z.string().min(10).optional(),
        link: z.string().optional(),
        priority: z.enum(["baixa", "media", "alta", "critica"]).optional(),
        active: z.enum(["yes", "no"]).optional(),
        sendEmail: z.enum(["yes", "no"]).optional(),
        sendPush: z.enum(["yes", "no"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.eventType) updateData.eventType = input.eventType;
      if (input.title) updateData.title = input.title;
      if (input.message) updateData.message = input.message;
      if (input.link !== undefined) updateData.link = input.link;
      if (input.priority) updateData.priority = input.priority;
      if (input.active) updateData.active = input.active;
      if (input.sendEmail) updateData.sendEmail = input.sendEmail;
      if (input.sendPush) updateData.sendPush = input.sendPush;

      await db
        .update(notificationTemplates)
        .set(updateData)
        .where(eq(notificationTemplates.id, input.id));

      return { success: true };
    }),

  /**
   * Deletar template
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(notificationTemplates).where(eq(notificationTemplates.id, input.id));

      return { success: true };
    }),

  /**
   * Testar template com dados de exemplo
   */
  preview: adminProcedure
    .input(
      z.object({
        title: z.string(),
        message: z.string(),
        variables: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const processedTitle = replaceVariables(input.title, input.variables);
      const processedMessage = replaceVariables(input.message, input.variables);

      return {
        title: processedTitle,
        message: processedMessage,
      };
    }),

  /**
   * Enviar notificação de teste
   */
  sendTest: adminProcedure
    .input(
      z.object({
        templateId: z.number(),
        userId: z.number(),
        variables: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [template] = await db
        .select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.id, input.templateId))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" });
      }

      const variables = input.variables || {};
      const processedTitle = replaceVariables(template.title, variables);
      const processedMessage = replaceVariables(template.message, variables);

      // Enviar notificação (simulação - integrar com sistema real)
      // const io = getIO();
      // if (io) {
      //   sendNotificationToUser(io, input.userId, {
      //     type: "feedback",
      //     title: processedTitle,
      //     message: processedMessage,
      //     link: template.link || undefined,
      //   });
      // }

      return { success: true };
    }),

  /**
   * Obter variáveis disponíveis por tipo de evento
   */
  getAvailableVariables: adminProcedure
    .input(z.object({ eventType: z.string() }))
    .query(async ({ ctx, input }) => {
      // Mapear variáveis disponíveis por tipo de evento
      const variablesByEvent: Record<string, Array<{ name: string; description: string; example: string }>> = {
        meta_vencida: [
          { name: "nome", description: "Nome do funcionário", example: "João Silva" },
          { name: "meta", description: "Nome da meta", example: "Aumentar vendas em 20%" },
          { name: "prazo", description: "Data de vencimento", example: "31/12/2025" },
          { name: "dias_atraso", description: "Dias de atraso", example: "5" },
        ],
        avaliacao_pendente: [
          { name: "nome", description: "Nome do funcionário", example: "Maria Santos" },
          { name: "tipo_avaliacao", description: "Tipo de avaliação", example: "360°" },
          { name: "prazo", description: "Data limite", example: "15/01/2025" },
          { name: "link", description: "Link para avaliação", example: "/avaliacoes/123" },
        ],
        pdi_criado: [
          { name: "nome", description: "Nome do funcionário", example: "Carlos Souza" },
          { name: "periodo", description: "Período do PDI", example: "2025" },
          { name: "total_acoes", description: "Total de ações", example: "10" },
        ],
        ciclo_iniciado: [
          { name: "nome_ciclo", description: "Nome do ciclo", example: "Ciclo 2025" },
          { name: "data_inicio", description: "Data de início", example: "01/01/2025" },
          { name: "data_fim", description: "Data de término", example: "31/12/2025" },
        ],
        meta_aprovada: [
          { name: "nome", description: "Nome do funcionário", example: "Ana Costa" },
          { name: "meta", description: "Nome da meta", example: "Reduzir custos em 15%" },
          { name: "aprovador", description: "Nome do aprovador", example: "Gestor RH" },
        ],
        meta_rejeitada: [
          { name: "nome", description: "Nome do funcionário", example: "Pedro Lima" },
          { name: "meta", description: "Nome da meta", example: "Melhorar atendimento" },
          { name: "motivo", description: "Motivo da rejeição", example: "Meta muito genérica" },
        ],
        sucessor_indicado: [
          { name: "nome_sucessor", description: "Nome do sucessor", example: "Julia Ferreira" },
          { name: "cargo", description: "Cargo para sucessão", example: "Gerente de Vendas" },
          { name: "prontidao", description: "Nível de prontidão", example: "Pronto agora" },
        ],
        feedback_recebido: [
          { name: "nome", description: "Nome do funcionário", example: "Roberto Alves" },
          { name: "avaliador", description: "Nome do avaliador", example: "Gestor Direto" },
          { name: "tipo_feedback", description: "Tipo de feedback", example: "Positivo" },
        ],
        alerta_desempenho: [
          { name: "nome", description: "Nome do funcionário", example: "Fernanda Costa" },
          { name: "tipo_alerta", description: "Tipo de alerta", example: "Baixo desempenho" },
          { name: "periodo", description: "Período analisado", example: "Último trimestre" },
        ],
        relatorio_gerado: [
          { name: "tipo_relatorio", description: "Tipo de relatório", example: "PDI" },
          { name: "data_geracao", description: "Data de geração", example: "20/01/2025" },
          { name: "total_registros", description: "Total de registros", example: "45" },
        ],
      };

      return variablesByEvent[input.eventType] || [];
    }),

  /**
   * Criar templates padrão (seed inicial)
   */
  createDefaultTemplates: adminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const defaultTemplates: InsertNotificationTemplate[] = [
      {
        name: "Meta Vencida",
        description: "Notificação quando uma meta vence sem ser concluída",
        eventType: "meta_vencida",
        title: "⚠️ Meta Vencida: {{meta}}",
        message: "Olá {{nome}}, sua meta '{{meta}}' venceu em {{prazo}}. Por favor, atualize o status ou entre em contato com seu gestor.",
        link: "/metas",
        priority: "alta",
        active: "yes",
        sendEmail: "yes",
        sendPush: "yes",
        createdBy: ctx.user.id,
      },
      {
        name: "Avaliação Pendente",
        description: "Lembrete de avaliação pendente",
        eventType: "avaliacao_pendente",
        title: "📝 Avaliação Pendente",
        message: "Olá {{nome}}, você tem uma avaliação {{tipo_avaliacao}} pendente. Prazo: {{prazo}}. Clique aqui para responder.",
        link: "/avaliacoes",
        priority: "media",
        active: "yes",
        sendEmail: "no",
        sendPush: "yes",
        createdBy: ctx.user.id,
      },
      {
        name: "PDI Criado",
        description: "Confirmação de criação de PDI",
        eventType: "pdi_criado",
        title: "✅ PDI {{periodo}} Criado",
        message: "Parabéns {{nome}}! Seu Plano de Desenvolvimento Individual para {{periodo}} foi criado com {{total_acoes}} ações.",
        link: "/pdi",
        priority: "baixa",
        active: "yes",
        sendEmail: "yes",
        sendPush: "yes",
        createdBy: ctx.user.id,
      },
      {
        name: "Ciclo Iniciado",
        description: "Notificação de início de novo ciclo de avaliação",
        eventType: "ciclo_iniciado",
        title: "🚀 Novo Ciclo: {{nome_ciclo}}",
        message: "O ciclo {{nome_ciclo}} foi iniciado! Período: {{data_inicio}} a {{data_fim}}. Prepare-se para definir suas metas.",
        link: "/ciclos",
        priority: "alta",
        active: "yes",
        sendEmail: "yes",
        sendPush: "yes",
        createdBy: ctx.user.id,
      },
      {
        name: "Meta Aprovada",
        description: "Confirmação de aprovação de meta",
        eventType: "meta_aprovada",
        title: "✅ Meta Aprovada",
        message: "Ótima notícia {{nome}}! Sua meta '{{meta}}' foi aprovada por {{aprovador}}. Agora é hora de colocar em prática!",
        link: "/metas",
        priority: "media",
        active: "yes",
        sendEmail: "no",
        sendPush: "yes",
        createdBy: ctx.user.id,
      },
      {
        name: "Meta Rejeitada",
        description: "Notificação de rejeição de meta",
        eventType: "meta_rejeitada",
        title: "❌ Meta Rejeitada",
        message: "Olá {{nome}}, sua meta '{{meta}}' foi rejeitada. Motivo: {{motivo}}. Por favor, revise e reenvie.",
        link: "/metas",
        priority: "alta",
        active: "yes",
        sendEmail: "yes",
        sendPush: "yes",
        createdBy: ctx.user.id,
      },
      {
        name: "Sucessor Indicado",
        description: "Notificação de indicação como sucessor",
        eventType: "sucessor_indicado",
        title: "🎯 Você foi Indicado como Sucessor",
        message: "Parabéns {{nome_sucessor}}! Você foi indicado como sucessor para o cargo de {{cargo}}. Prontidão: {{prontidao}}.",
        link: "/sucessao",
        priority: "alta",
        active: "yes",
        sendEmail: "yes",
        sendPush: "yes",
        createdBy: ctx.user.id,
      },
      {
        name: "Feedback Recebido",
        description: "Notificação de novo feedback",
        eventType: "feedback_recebido",
        title: "💬 Novo Feedback Recebido",
        message: "Olá {{nome}}, você recebeu um feedback {{tipo_feedback}} de {{avaliador}}. Confira os detalhes.",
        link: "/feedbacks",
        priority: "media",
        active: "yes",
        sendEmail: "no",
        sendPush: "yes",
        createdBy: ctx.user.id,
      },
      {
        name: "Alerta de Desempenho",
        description: "Alerta de desempenho baixo",
        eventType: "alerta_desempenho",
        title: "⚠️ Alerta de Desempenho",
        message: "Olá {{nome}}, identificamos um alerta de {{tipo_alerta}} no período: {{periodo}}. Vamos conversar?",
        link: "/performance",
        priority: "critica",
        active: "yes",
        sendEmail: "yes",
        sendPush: "yes",
        createdBy: ctx.user.id,
      },
      {
        name: "Relatório Gerado",
        description: "Notificação de relatório disponível",
        eventType: "relatorio_gerado",
        title: "📊 Relatório Disponível",
        message: "Seu relatório de {{tipo_relatorio}} foi gerado em {{data_geracao}} com {{total_registros}} registros. Confira agora!",
        link: "/relatorios",
        priority: "baixa",
        active: "yes",
        sendEmail: "no",
        sendPush: "yes",
        createdBy: ctx.user.id,
      },
    ];

    for (const template of defaultTemplates) {
      await db.insert(notificationTemplates).values(template);
    }

    return { success: true, count: defaultTemplates.length };
  }),
});

/**
 * Substituir variáveis no texto por valores reais
 * Exemplo: "Olá {{nome}}" → "Olá João Silva"
 */
function replaceVariables(text: string, variables: Record<string, any>): string {
  let result = text;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, String(value));
  }
  
  return result;
}

/**
 * Enviar notificação usando template
 * Uso: await sendNotificationFromTemplate(templateId, userId, variables)
 */
export async function sendNotificationFromTemplate(
  templateId: number,
  userId: number,
  variables: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [template] = await db
    .select()
    .from(notificationTemplates)
    .where(
      and(
        eq(notificationTemplates.id, templateId),
        eq(notificationTemplates.active, "yes")
      )
    )
    .limit(1);

  if (!template) {
    throw new Error("Template não encontrado ou inativo");
  }

  const processedTitle = replaceVariables(template.title, variables);
  const processedMessage = replaceVariables(template.message, variables);

  // Enviar notificação via WebSocket (integrar com sistema real)
  // const io = getIO();
  // if (io) {
  //   sendNotificationToUser(io, userId, {
  //     type: "feedback",
  //     title: processedTitle,
  //     message: processedMessage,
  //     link: template.link || undefined,
  //   });
  // }
}
