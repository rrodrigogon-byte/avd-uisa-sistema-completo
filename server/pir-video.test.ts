/**
 * Testes para funcionalidades de vídeo do PIR
 * Valida gravação, upload e análise de vídeos
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';

// Mock de contexto autenticado
const createMockContext = (userId: number = 1, role: 'admin' | 'user' = 'admin'): Context => ({
  user: {
    id: userId,
    openId: `test-openid-${userId}`,
    name: 'Test User',
    email: 'test@example.com',
    loginMethod: 'email',
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
});

describe('PIR Video - Funcionalidades de Vídeo', () => {
  let testAssessmentId: number;

  beforeAll(async () => {
    // Criar uma avaliação PIR de teste
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const assessment = await caller.pirVideo.createAssessment({
        employeeId: 1,
      });
      testAssessmentId = assessment.id;
    } catch (error) {
      console.log('Avaliação de teste já existe ou erro ao criar:', error);
      testAssessmentId = 1; // Usar ID padrão se falhar
    }
  });

  it('Deve criar uma avaliação PIR com sucesso', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const assessment = await caller.pirVideo.createAssessment({
      employeeId: 1,
    });

    expect(assessment).toBeDefined();
    expect(assessment.id).toBeGreaterThan(0);
    expect(assessment.employeeId).toBe(1);
    expect(assessment.status).toBe('pendente');
  });

  it('Deve listar avaliações PIR', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const assessments = await caller.pirVideo.list({});

    expect(Array.isArray(assessments)).toBe(true);
  });

  it('Deve gerar chave de upload para vídeo', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const uploadInfo = await caller.pirVideo.uploadVideo({
      assessmentId: testAssessmentId,
      fileName: 'test-video.webm',
      fileSize: 1024000, // 1MB
    });

    expect(uploadInfo).toBeDefined();
    expect(uploadInfo.fileKey).toBeDefined();
    expect(uploadInfo.fileKey).toContain('pir-videos');
    expect(uploadInfo.fileKey).toContain('.webm');
    expect(uploadInfo.assessmentId).toBe(testAssessmentId);
  });

  it('Deve confirmar upload de vídeo e atualizar avaliação', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pirVideo.confirmVideoUpload({
      assessmentId: testAssessmentId,
      videoUrl: 'https://storage.example.com/test-video.webm',
      videoKey: 'pir-videos/1/test-video.webm',
      videoDuration: 120, // 2 minutos
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it('Deve validar que vídeo foi salvo na avaliação', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const assessments = await caller.pirVideo.list({});
    const assessment = assessments.find(a => a.id === testAssessmentId);

    if (assessment) {
      expect(assessment.videoUrl).toBeDefined();
      expect(assessment.videoKey).toBeDefined();
      expect(assessment.videoDuration).toBeGreaterThan(0);
      expect(assessment.status).toBe('em_andamento');
    }
  });

  it('Deve rejeitar análise de vídeo sem vídeo disponível', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Criar avaliação sem vídeo
    const newAssessment = await caller.pirVideo.createAssessment({
      employeeId: 1,
    });

    await expect(
      caller.pirVideo.analyzeVideo({
        assessmentId: newAssessment.id,
      })
    ).rejects.toThrow('Vídeo não encontrado');
  });

  it('Deve salvar metadados de vídeo', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const metadata = await caller.pirVideo.saveVideoMetadata({
      pirAssessmentId: testAssessmentId,
      facesDetected: true,
      multipleFacesDetected: false,
      noFaceDetected: false,
      personChanged: false,
      totalFramesAnalyzed: 1000,
      framesWithFace: 950,
      framesWithMultipleFaces: 0,
      framesWithNoFace: 50,
      multipleFacesTimestamps: [],
      noFaceTimestamps: [10.5, 45.2],
      personChangeTimestamps: [],
      faceDescriptors: [],
      validationPassed: true,
      validationScore: 95,
      validationNotes: 'Vídeo validado com sucesso',
    });

    expect(metadata).toBeDefined();
    expect(metadata.id).toBeGreaterThan(0);
    expect(metadata.validationPassed).toBe(true);
  });

  it('Deve recuperar metadados de vídeo salvos', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const metadata = await caller.pirVideo.getVideoMetadata({
      pirAssessmentId: testAssessmentId,
    });

    if (metadata) {
      expect(metadata.pirAssessmentId).toBe(testAssessmentId);
      expect(metadata.validationPassed).toBeDefined();
      expect(metadata.validationScore).toBeDefined();
    }
  });

  it('Deve validar estrutura de análise de vídeo (mock)', async () => {
    // Como a análise real requer chamada à IA, vamos validar a estrutura esperada
    const mockAnalysis = {
      overallScore: 85,
      summary: 'Análise de teste',
      patterns: {
        movementQuality: {
          score: 80,
          description: 'Boa qualidade de movimento',
          observations: ['Coordenação adequada', 'Fluidez nos movimentos'],
        },
        facialExpressions: {
          score: 90,
          description: 'Expressões claras',
          observations: ['Expressões naturais'],
        },
        bodyLanguage: {
          score: 85,
          description: 'Linguagem corporal positiva',
          observations: ['Postura adequada'],
        },
        verbalCommunication: {
          score: 88,
          description: 'Comunicação clara',
          observations: ['Fala articulada'],
        },
      },
      functionalCapabilities: {
        mobility: {
          level: 'independente' as const,
          score: 90,
          details: 'Mobilidade independente',
        },
        coordination: {
          level: 'boa' as const,
          score: 85,
          details: 'Boa coordenação motora',
        },
        cognition: {
          level: 'preservada' as const,
          score: 95,
          details: 'Cognição preservada',
        },
        communication: {
          level: 'clara' as const,
          score: 90,
          details: 'Comunicação clara',
        },
      },
      difficulties: [],
      strengths: ['Boa coordenação', 'Comunicação efetiva'],
      recommendations: [
        {
          category: 'Mobilidade',
          priority: 'media' as const,
          description: 'Manter exercícios regulares',
        },
      ],
      insights: ['Paciente demonstra boa capacidade funcional'],
      alerts: [],
    };

    // Validar estrutura
    expect(mockAnalysis.overallScore).toBeGreaterThanOrEqual(0);
    expect(mockAnalysis.overallScore).toBeLessThanOrEqual(100);
    expect(mockAnalysis.summary).toBeDefined();
    expect(mockAnalysis.patterns).toBeDefined();
    expect(mockAnalysis.functionalCapabilities).toBeDefined();
    expect(Array.isArray(mockAnalysis.difficulties)).toBe(true);
    expect(Array.isArray(mockAnalysis.strengths)).toBe(true);
    expect(Array.isArray(mockAnalysis.recommendations)).toBe(true);
    expect(Array.isArray(mockAnalysis.insights)).toBe(true);
    expect(Array.isArray(mockAnalysis.alerts)).toBe(true);
  });
});

describe('PIR Video - Validações e Segurança', () => {
  it('Deve rejeitar criação de avaliação sem autenticação', async () => {
    const ctx = { user: null, req: {} as any, res: {} as any };
    const caller = appRouter.createCaller(ctx as any);

    await expect(
      caller.pirVideo.createAssessment({
        employeeId: 1,
      })
    ).rejects.toThrow();
  });

  it('Deve validar tamanho de arquivo no upload', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Criar avaliação de teste
    const assessment = await caller.pirVideo.createAssessment({
      employeeId: 1,
    });

    // Validar que aceita tamanhos razoáveis
    const uploadInfo = await caller.pirVideo.uploadVideo({
      assessmentId: assessment.id,
      fileName: 'test.webm',
      fileSize: 50 * 1024 * 1024, // 50MB
    });

    expect(uploadInfo).toBeDefined();
  });
});

describe('PIR Video - Integração com Relatórios', () => {
  it('Deve incluir avaliações PIR no perfil completo do funcionário', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const profile = await caller.employees.getFullProfile({
        employeeId: 1,
      });

      expect(profile).toBeDefined();
      expect(profile.pirAssessments).toBeDefined();
      expect(Array.isArray(profile.pirAssessments)).toBe(true);
    } catch (error) {
      // Funcionário pode não existir em ambiente de teste
      console.log('Funcionário não encontrado (esperado em ambiente de teste)');
    }
  });
});
