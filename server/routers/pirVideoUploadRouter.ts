import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

/**
 * Router para upload de vídeos das questões PIR Integridade
 */
export const pirVideoUploadRouter = router({
  /**
   * Upload de vídeo para questão PIR
   * Recebe o vídeo em base64 e faz upload para S3
   */
  uploadVideo: protectedProcedure
    .input(z.object({
      questionId: z.number(),
      videoBase64: z.string(), // Vídeo em base64
      fileName: z.string(),
      mimeType: z.string(), // Ex: video/mp4, video/webm, video/mov
      duration: z.number().optional(), // Duração em segundos
    }))
    .mutation(async ({ input }) => {
      const { questionId, videoBase64, fileName, mimeType, duration } = input;

      // Validar formato de vídeo
      const allowedFormats = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedFormats.includes(mimeType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Formato de vídeo não suportado. Use: ${allowedFormats.join(', ')}`,
        });
      }

      // Converter base64 para Buffer
      const videoBuffer = Buffer.from(videoBase64, 'base64');

      // Validar tamanho (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (videoBuffer.length > maxSize) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Vídeo muito grande. Tamanho máximo: 50MB',
        });
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const extension = fileName.split('.').pop();
      const fileKey = `pir-integrity/videos/${questionId}-${timestamp}-${randomSuffix}.${extension}`;

      try {
        // Upload para S3
        const { url } = await storagePut(fileKey, videoBuffer, mimeType);

        return {
          success: true,
          videoUrl: url,
          fileKey,
          duration,
        };
      } catch (error) {
        console.error('[pirVideoUpload] Erro ao fazer upload:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao fazer upload do vídeo',
        });
      }
    }),

  /**
   * Upload de thumbnail do vídeo
   */
  uploadThumbnail: protectedProcedure
    .input(z.object({
      questionId: z.number(),
      thumbnailBase64: z.string(), // Imagem em base64
      fileName: z.string(),
      mimeType: z.string(), // Ex: image/jpeg, image/png
    }))
    .mutation(async ({ input }) => {
      const { questionId, thumbnailBase64, fileName, mimeType } = input;

      // Validar formato de imagem
      const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedFormats.includes(mimeType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Formato de imagem não suportado. Use: ${allowedFormats.join(', ')}`,
        });
      }

      // Converter base64 para Buffer
      const thumbnailBuffer = Buffer.from(thumbnailBase64, 'base64');

      // Validar tamanho (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (thumbnailBuffer.length > maxSize) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Thumbnail muito grande. Tamanho máximo: 2MB',
        });
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const extension = fileName.split('.').pop();
      const fileKey = `pir-integrity/thumbnails/${questionId}-${timestamp}-${randomSuffix}.${extension}`;

      try {
        // Upload para S3
        const { url } = await storagePut(fileKey, thumbnailBuffer, mimeType);

        return {
          success: true,
          thumbnailUrl: url,
          fileKey,
        };
      } catch (error) {
        console.error('[pirThumbnailUpload] Erro ao fazer upload:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao fazer upload da thumbnail',
        });
      }
    }),

  /**
   * Deletar vídeo do S3 (quando questão é removida ou vídeo é substituído)
   */
  deleteVideo: protectedProcedure
    .input(z.object({
      fileKey: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Nota: O storage atual não tem função de delete
      // Por enquanto, apenas retornamos sucesso
      // Em produção, implementar storageDelete() em server/storage.ts
      
      console.log('[pirVideoDelete] Solicitação de delete para:', input.fileKey);
      
      return {
        success: true,
        message: 'Vídeo marcado para remoção',
      };
    }),
});
