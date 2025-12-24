import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";

/**
 * Testes para o fluxo completo de convites de integridade
 * - Criação de convite
 * - Envio de email
 * - Validação de token
 * - Submissão de respostas
 */
describe("Fluxo de Convites de Integridade", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let createdInvitationToken: string;

  beforeAll(async () => {
    const adminCtx = {
      user: {
        id: 1,
        openId: "test-admin",
        name: "Admin Teste",
        email: "admin@test.com",
        role: "admin" as const,
      },
      req: {} as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(adminCtx);
  });

  it("deve criar convite para candidato externo com sucesso", async () => {
    const result = await caller.integrityPIR.createInvitation({
      candidateName: "João Silva",
      candidateEmail: "joao.silva@example.com",
      candidatePhone: "(11) 98765-4321",
      purpose: "Processo Seletivo - Vaga Analista",
      notes: "Candidato indicado pelo RH",
      expiresInDays: 7,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.token).toBeDefined();
    expect(result.token).toContain("pir_");
    expect(result.invitationUrl).toContain("/integridade/pir/responder/");
    expect(result.expiresAt).toBeInstanceOf(Date);

    createdInvitationToken = result.token;
  });

  it("deve criar convite para funcionário existente", async () => {
    const result = await caller.integrityPIR.createInvitation({
      employeeId: 1,
      purpose: "Avaliação Anual de Integridade",
      expiresInDays: 14,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.token).toBeDefined();
  });

  it("deve listar convites criados", async () => {
    const result = await caller.integrityPIR.listInvitations({
      limit: 50,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("deve filtrar convites por status", async () => {
    const result = await caller.integrityPIR.listInvitations({
      status: "sent",
      limit: 50,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    // Todos os resultados devem ter status "sent"
    result.forEach((inv) => {
      expect(inv.status).toBe("sent");
    });
  });

  it("deve buscar convite por token válido", async () => {
    const result = await caller.integrityPIR.getInvitationByToken({
      token: createdInvitationToken,
    });

    expect(result).toBeDefined();
    expect(result?.token).toBe(createdInvitationToken);
    expect(result?.candidateName).toBe("João Silva");
    expect(result?.candidateEmail).toBe("joao.silva@example.com");
  });

  it("deve retornar null para token inválido", async () => {
    const result = await caller.integrityPIR.getInvitationByToken({
      token: "token-invalido-123",
    });

    expect(result).toBeNull();
  });

  it("deve marcar convite como iniciado", async () => {
    const result = await caller.integrityPIR.startInvitation({
      token: createdInvitationToken,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verificar se status mudou
    const invitation = await caller.integrityPIR.getInvitationByToken({
      token: createdInvitationToken,
    });
    expect(invitation?.status).toBe("in_progress");
  });

  it("deve submeter respostas do PIR com sucesso", async () => {
    const mockAnswers = {
      1: 5,
      2: 4,
      3: 5,
      4: 3,
      5: 4,
    };

    const mockDimensionScores = {
      IP: 4.5,
      ID: 4.0,
      IC: 4.2,
      ES: 4.3,
      FL: 4.1,
      AU: 4.4,
    };

    const result = await caller.integrityPIR.submitPIRPublic({
      token: createdInvitationToken,
      answers: mockAnswers,
      dimensionScores: mockDimensionScores,
      overallScore: 4.25,
      notes: "Teste concluído com sucesso",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.resultId).toBeGreaterThan(0);

    // Verificar se convite foi marcado como completo
    const invitation = await caller.integrityPIR.getInvitationByToken({
      token: createdInvitationToken,
    });
    expect(invitation?.status).toBe("completed");
    expect(invitation?.completedAt).toBeDefined();
  });

  it("não deve permitir submeter respostas em convite já concluído", async () => {
    await expect(
      caller.integrityPIR.submitPIRPublic({
        token: createdInvitationToken,
        answers: { 1: 5 },
        dimensionScores: { IP: 5 },
        overallScore: 5,
      })
    ).rejects.toThrow("Este convite já foi utilizado");
  });

  it("deve reenviar convite com sucesso", async () => {
    // Criar novo convite para teste de reenvio
    const newInvitation = await caller.integrityPIR.createInvitation({
      candidateName: "Maria Santos",
      candidateEmail: "maria.santos@example.com",
      purpose: "Teste de Reenvio",
      expiresInDays: 7,
    });

    const result = await caller.integrityPIR.resendInvitation({
      invitationId: newInvitation.id,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

/**
 * Testes para validação de dados e edge cases
 */
describe("Validação de Convites de Integridade", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const adminCtx = {
      user: {
        id: 1,
        openId: "test-admin",
        name: "Admin Teste",
        email: "admin@test.com",
        role: "admin" as const,
      },
      req: {} as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(adminCtx);
  });

  it("deve criar convite com prazo de validade customizado", async () => {
    const result = await caller.integrityPIR.createInvitation({
      candidateName: "Teste Prazo",
      candidateEmail: "teste.prazo@example.com",
      expiresInDays: 30,
    });

    expect(result).toBeDefined();
    const expiresAt = new Date(result.expiresAt);
    const now = new Date();
    const diffDays = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThanOrEqual(31);
  });

  it("deve criar convite sem propósito e notas (campos opcionais)", async () => {
    const result = await caller.integrityPIR.createInvitation({
      candidateName: "Teste Mínimo",
      candidateEmail: "teste.minimo@example.com",
      expiresInDays: 7,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
  });

  it("deve retornar array vazio quando não há convites com status específico", async () => {
    const result = await caller.integrityPIR.listInvitations({
      status: "expired",
      limit: 50,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    // Pode estar vazio ou ter apenas convites expirados
    result.forEach((inv) => {
      expect(inv.status).toBe("expired");
    });
  });
});
