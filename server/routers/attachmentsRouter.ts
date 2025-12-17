import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createEmployeeAttachment,
  getEmployeeAttachments,
  deleteEmployeeAttachment,
} from "../db";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

/**
 * Router para gerenciamento de anexos de funcionários
 */
export const attachmentsRouter = router({
  /**
   * Upload de anexo
   */
  upload: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // Base64
        fileType: z.string(),
        category: z.enum([
          "certificado",
          "documento",
          "foto",
          "curriculo",
          "diploma",
          "comprovante",
          "contrato",
          "outro",
        ]),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
        visibleToEmployee: z.boolean().default(true),
        visibleToManager: z.boolean().default(true),
        visibleToHR: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Decodificar base64
        const buffer = Buffer.from(input.fileData, "base64");
        const fileSize = buffer.length;

        // Validar tamanho (máximo 10MB)
        if (fileSize > 10 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Arquivo muito grande. Tamanho máximo: 10MB",
          });
        }

        // Gerar chave única para o arquivo
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `employee-attachments/${input.employeeId}/${timestamp}-${randomSuffix}-${input.fileName}`;

        // Upload para S3
        const { url } = await storagePut(fileKey, buffer, input.fileType);

        // Salvar no banco de dados
        await createEmployeeAttachment({
          employeeId: input.employeeId,
          fileName: input.fileName,
          fileUrl: url,
          fileKey: fileKey,
          fileType: input.fileType,
          fileSize: fileSize,
          category: input.category,
          description: input.description || null,
          isPublic: input.isPublic,
          visibleToEmployee: input.visibleToEmployee,
          visibleToManager: input.visibleToManager,
          visibleToHR: input.visibleToHR,
          uploadedBy: ctx.user.id,
        });

        return {
          success: true,
          fileUrl: url,
          message: "Anexo enviado com sucesso",
        };
      } catch (error) {
        console.error("[Attachments] Erro ao fazer upload:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao fazer upload do anexo",
        });
      }
    }),

  /**
   * Listar anexos de um funcionário
   */
  list: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        category: z
          .enum([
            "certificado",
            "documento",
            "foto",
            "curriculo",
            "diploma",
            "comprovante",
            "contrato",
            "outro",
          ])
          .optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        let attachments = await getEmployeeAttachments(input.employeeId);

        // Filtrar por categoria se especificado
        if (input.category) {
          attachments = attachments.filter(
            (att) => att.category === input.category
          );
        }

        return attachments;
      } catch (error) {
        console.error("[Attachments] Erro ao listar anexos:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar anexos",
        });
      }
    }),

  /**
   * Deletar anexo
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verificar permissões (admin, RH ou quem fez upload)
        const attachments = await getEmployeeAttachments(0); // Buscar todos
        const attachment = attachments.find((att) => att.id === input.id);

        if (!attachment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Anexo não encontrado",
          });
        }

        const isAdmin = ctx.user.role === "admin" || ctx.user.role === "rh";
        const isOwner = attachment.uploadedBy === ctx.user.id;

        if (!isAdmin && !isOwner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Sem permissão para deletar este anexo",
          });
        }

        await deleteEmployeeAttachment(input.id);

        return {
          success: true,
          message: "Anexo deletado com sucesso",
        };
      } catch (error) {
        console.error("[Attachments] Erro ao deletar anexo:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar anexo",
        });
      }
    }),

  /**
   * Buscar anexos por categoria
   */
  getByCategory: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        categories: z.array(
          z.enum([
            "certificado",
            "documento",
            "foto",
            "curriculo",
            "diploma",
            "comprovante",
            "contrato",
            "outro",
          ])
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const attachments = await getEmployeeAttachments(input.employeeId);

        return attachments.filter((att) =>
          input.categories.includes(att.category)
        );
      } catch (error) {
        console.error("[Attachments] Erro ao buscar anexos:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar anexos",
        });
      }
    }),
});
