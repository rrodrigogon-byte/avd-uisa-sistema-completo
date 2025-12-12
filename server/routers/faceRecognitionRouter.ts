import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  upsertEmployeeFaceProfile,
  getEmployeeFaceProfile,
  createFraudDetectionLog,
  getEmployeeFraudLogs,
  getPendingFraudLogs,
  updateFraudLogStatus,
} from "../db";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

/**
 * Router para reconhecimento facial e validação de identidade
 * 
 * NOTA: Este router fornece a estrutura para integração com APIs de reconhecimento facial.
 * A implementação real dependerá da API escolhida (AWS Rekognition, Azure Face API, etc.)
 */
export const faceRecognitionRouter = router({
  /**
   * Upload de foto de referência para perfil facial
   */
  uploadReferencePhoto: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        photoData: z.string(), // Base64
        photoType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Validar permissões (admin, RH ou o próprio funcionário)
        const isAdmin = ctx.user.role === "admin" || ctx.user.role === "rh";
        // TODO: Verificar se ctx.user.id corresponde ao employeeId

        if (!isAdmin) {
          // Verificar se é o próprio funcionário
          // TODO: Implementar verificação de vínculo user -> employee
        }

        // Decodificar base64
        const buffer = Buffer.from(input.photoData, "base64");
        const fileSize = buffer.length;

        // Validar tamanho (máximo 5MB)
        if (fileSize > 5 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Foto muito grande. Tamanho máximo: 5MB",
          });
        }

        // Gerar chave única para a foto
        const timestamp = Date.now();
        const photoKey = `face-profiles/${input.employeeId}/${timestamp}-reference.jpg`;

        // Upload para S3
        const { url } = await storagePut(photoKey, buffer, input.photoType);

        // TODO: Integrar com API de reconhecimento facial
        // Exemplo com AWS Rekognition:
        // const faceDescriptor = await detectFaceDescriptor(buffer);
        
        // Por enquanto, criar um descriptor mock
        const mockDescriptor = JSON.stringify({
          detected: true,
          confidence: 95,
          landmarks: [],
          timestamp: new Date().toISOString(),
        });

        // Salvar perfil facial
        await upsertEmployeeFaceProfile({
          employeeId: input.employeeId,
          referencePhotoUrl: url,
          referencePhotoKey: photoKey,
          faceDescriptor: mockDescriptor,
          photoQuality: "alta",
          confidenceScore: 95,
          isActive: true,
          verifiedBy: ctx.user.id,
          verifiedAt: new Date(),
          createdBy: ctx.user.id,
        });

        return {
          success: true,
          photoUrl: url,
          message: "Foto de referência cadastrada com sucesso",
        };
      } catch (error) {
        console.error("[FaceRecognition] Erro ao fazer upload:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao cadastrar foto de referência",
        });
      }
    }),

  /**
   * Buscar perfil facial de um funcionário
   */
  getProfile: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const profile = await getEmployeeFaceProfile(input.employeeId);
        return profile;
      } catch (error) {
        console.error("[FaceRecognition] Erro ao buscar perfil:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar perfil facial",
        });
      }
    }),

  /**
   * Validar identidade em vídeo
   * 
   * Esta função deve ser chamada durante a análise de vídeo PIR
   * para verificar se a pessoa no vídeo corresponde ao funcionário
   */
  validateVideoIdentity: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
        videoFrameData: z.string(), // Base64 de um frame do vídeo
        pirAssessmentId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Buscar perfil facial de referência
        const faceProfile = await getEmployeeFaceProfile(input.employeeId);

        if (!faceProfile) {
          return {
            success: false,
            status: "sem_perfil",
            message: "Funcionário não possui perfil facial cadastrado",
            matchScore: 0,
          };
        }

        // TODO: Integrar com API de reconhecimento facial
        // Exemplo com AWS Rekognition:
        // const frameBuffer = Buffer.from(input.videoFrameData, 'base64');
        // const matchResult = await compareFaces(
        //   faceProfile.referencePhotoKey,
        //   frameBuffer
        // );

        // Mock de validação (substituir por API real)
        const mockMatchScore = Math.floor(Math.random() * 30) + 70; // 70-100
        const isValid = mockMatchScore >= 80;

        // Se a validação falhar, registrar tentativa de fraude
        if (!isValid) {
          await createFraudDetectionLog({
            pirAssessmentId: input.pirAssessmentId,
            employeeId: input.employeeId,
            fraudType: "face_nao_correspondente",
            description: `Validação facial falhou. Score: ${mockMatchScore}%`,
            severity: "alta",
            confidenceLevel: 100 - mockMatchScore,
            evidenceData: JSON.stringify({
              matchScore: mockMatchScore,
              timestamp: new Date().toISOString(),
            }),
            status: "pendente_revisao",
          });
        }

        return {
          success: isValid,
          status: isValid ? "validado" : "falhou",
          matchScore: mockMatchScore,
          message: isValid
            ? "Identidade validada com sucesso"
            : "Identidade não corresponde ao perfil cadastrado",
        };
      } catch (error) {
        console.error("[FaceRecognition] Erro ao validar identidade:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao validar identidade",
        });
      }
    }),

  /**
   * Listar logs de fraude de um funcionário
   */
  getFraudLogs: protectedProcedure
    .input(
      z.object({
        employeeId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Apenas admin e RH podem ver logs de fraude
        if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Sem permissão para visualizar logs de fraude",
          });
        }

        const logs = await getEmployeeFraudLogs(input.employeeId);
        return logs;
      } catch (error) {
        console.error("[FaceRecognition] Erro ao buscar logs:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar logs de fraude",
        });
      }
    }),

  /**
   * Listar todos os logs de fraude pendentes (admin/RH)
   */
  getPendingFraudLogs: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Apenas admin e RH
      if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sem permissão para visualizar logs de fraude",
        });
      }

      const logs = await getPendingFraudLogs();
      return logs;
    } catch (error) {
      console.error("[FaceRecognition] Erro ao buscar logs pendentes:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar logs de fraude",
      });
    }
  }),

  /**
   * Atualizar status de log de fraude (após revisão manual)
   */
  updateFraudLogStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["confirmada", "falso_positivo", "resolvida"]),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Apenas admin e RH
        if (ctx.user.role !== "admin" && ctx.user.role !== "rh") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Sem permissão para revisar logs de fraude",
          });
        }

        await updateFraudLogStatus(
          input.id,
          input.status,
          ctx.user.id,
          input.reviewNotes
        );

        return {
          success: true,
          message: "Status atualizado com sucesso",
        };
      } catch (error) {
        console.error("[FaceRecognition] Erro ao atualizar status:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar status",
        });
      }
    }),
});
